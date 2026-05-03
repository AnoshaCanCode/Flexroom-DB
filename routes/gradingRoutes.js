/**
 * FlexRoom — Assessment & Grading API (SQL Persistence Version).
 * Autograding (TestCase) and plagiarism (MatchResults) are intentionally separate.
 */
const express = require('express');
const multer = require('multer');
const sql = require('mssql'); // Added this so sql.Int/sql.NVarChar works
const { AssessmentFactory } = require('../server/assessment/AssessmentFactory');
const { Rubric } = require('../server/rubric/Rubric');
const { TestCase } = require('../server/testCase/TestCase');
const { SolutionKey } = require('../server/solutionKey/SolutionKey');
const { MatchResults } = require('../server/plagiarism/MatchResults');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');
const { StudentDashboardObserver, globalAutogradeSubject } = require('../server/observer/DashboardNotifier');

// Warm singleton side-effects (ensures upload folders exist).
ConnectionManager.getInstance();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = express.Router();

/** @type {Map<string, StudentDashboardObserver>} */
const studentObservers = new Map();

function ensureStudentObserver(studentId) {
  const key = String(studentId);
  if (!studentObservers.has(key)) {
    const observer = new StudentDashboardObserver(key);
    globalAutogradeSubject.subscribe(observer);
    studentObservers.set(key, observer);
  }
  return studentObservers.get(key);
}

/** Health + pattern smoke */
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    module: 'grading',
    patterns: ['Factory', 'Composite', 'State', 'Template', 'Observer', 'Singleton'],
  });
});

/** 1. Create Assessment (Saves to SQL) */
router.post('/assessments', express.json(), async (req, res) => {
  try {
    const { type, title, marks, dueDate, classId } = req.body;
    const pool = await ConnectionManager.getInstance().getPool();
    
    const result = await pool.request()
      .input('classID', sql.Int, classId)
      .input('title', sql.NVarChar, title)
      .input('type', sql.NVarChar, type)
      .input('marks', sql.Int, marks)
      .input('dueDate', sql.NVarChar, dueDate || null)
      .query(`
        INSERT INTO Assessment (classID, title, type, marks, uploadingDate, dueDate, status)
        OUTPUT INSERTED.assessmentID
        VALUES (@classID, @title, @type, @marks, CONVERT(NVARCHAR(20), GETDATE(), 23), @dueDate, 'unmarked')
      `);

    const newId = result.recordset[0].assessmentID;
    return res.status(201).json({ assessmentID: newId, title, message: "Saved to Database" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** 2. Get Assessment Details (From SQL) */
router.get('/assessments/:id', async (req, res) => {
  try {
    const pool = await ConnectionManager.getInstance().getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Assessment WHERE assessmentID = @id');

    if (result.recordset.length === 0) return res.status(404).json({ error: 'Assessment not found.' });
    
    const row = result.recordset[0];
    // Re-wrap in Factory object to keep pattern logic (isSubmissionOpen, etc)
    const a = AssessmentFactory.create(row.type, row);
    
    return res.json({
      ...a.getAssessmentDetails(),
      status: row.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** 3. Student upload submission (Saves to SQL VARBINARY) */
router.post('/submissions', upload.single('file'), async (req, res) => {
  try {
    const { assessmentId, studentId, type } = req.body;
    if (!assessmentId || !studentId || !type || !req.file) {
      return res.status(400).json({ error: 'assessmentId, studentId, type, and file are required.' });
    }

    const pool = await ConnectionManager.getInstance().getPool();
    const result = await pool.request()
      .input('aid', sql.Int, assessmentId)
      .input('sid', sql.Int, studentId)
      .input('filename', sql.NVarChar, req.file.originalname)
      .input('content', sql.VarBinary(sql.MAX), req.file.buffer)
      .query(`
        INSERT INTO Submissions (AssignmentID, StudentID, FileName, FileContent, SubmissionDate, Status)
        OUTPUT INSERTED.SubmissionID
        VALUES (@aid, @sid, @filename, @content, GETDATE(), 'On-Time')
      `);

    return res.status(201).json({ submissionId: result.recordset[0].SubmissionID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** 4. Evaluator-triggered autograde (SQL + Local g++) */
router.post('/autograde', upload.single('file'), async (req, res) => {
  try {
    const { assessmentId, studentId } = req.body;
    if (!assessmentId || !studentId || !req.file) {
      return res.status(400).json({ error: 'assessmentId, studentId, and file are required.' });
    }

    const pool = await ConnectionManager.getInstance().getPool();
    const assessmentResult = await pool.request()
      .input('aid', assessmentId)
      .query('SELECT * FROM Assessment WHERE assessmentID = @aid');

    const assessment = assessmentResult.recordset[0];
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

    const tester = new TestCase({ assessmentId });
    const summary = await tester.execute(req.file.buffer, assessment.marks);

    await pool.request()
      .input('aid', assessmentId)
      .input('sid', studentId)
      .input('marks', sql.Decimal(5,2), summary.earnedMarks)
      .input('feedback', `Autograded: ${summary.passedCount}/${summary.totalCount} tests passed.`)
      .query(`
        INSERT INTO Grades (AssessmentID, StudentID, TotalMarks, Feedback)
        VALUES (@aid, @sid, @marks, @feedback)
      `);

    ensureStudentObserver(studentId);
    globalAutogradeSubject.notifyAutogradeComplete({
      assessmentId,
      studentId: String(studentId),
      summary,
      at: new Date().toISOString(),
    });

    return res.json({ ok: true, summary });
  } catch (err) {
    console.error('Autograde Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/** 5. Plagiarism engine — compares target against SQL repository */
router.post('/plagiarism/run', express.json(), async (req, res) => {
  try {
    const { targetSubmissionId } = req.body;
    const pool = await ConnectionManager.getInstance().getPool();
    
    // Get the target file
    const targetRes = await pool.request()
      .input('id', targetSubmissionId)
      .query('SELECT * FROM Submissions WHERE SubmissionID = @id');
    
    if (targetRes.recordset.length === 0) return res.status(404).json({ error: 'Submission not found.' });
    const target = targetRes.recordset[0];

    // Get all other files for same assessment to compare
    const othersRes = await pool.request()
      .input('aid', target.AssignmentID)
      .input('tid', target.SubmissionID)
      .query('SELECT * FROM Submissions WHERE AssignmentID = @aid AND SubmissionID != @tid');

    const repo = othersRes.recordset;
    const engine = new MatchResults();
    const report = await engine.runAnalysis(target, repo);
    
    return res.json({ ok: true, report: engine.getComparisonReport() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Observer demo: poll dashboard notifications */
router.get('/students/:studentId/notifications', (req, res) => {
  const observer = ensureStudentObserver(req.params.studentId);
  return res.json({ studentId: req.params.studentId, notifications: observer.getNotifications() });
});

module.exports = router;