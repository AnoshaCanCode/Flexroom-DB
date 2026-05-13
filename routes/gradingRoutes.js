const express = require('express');
const router = express.Router();
const multer = require('multer');
const sql = require('mssql');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');

// Use memory storage for VARBINARY
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/assessments', upload.fields([
  { name: 'questionPdf', maxCount: 1 },
  { name: 'solutionKey', maxCount: 1 }
]), async (req, res) => {
  console.log("--- New Assessment Request Received ---");
  console.log("Body Data:", req.body);
  console.log("Files Received:", req.files ? Object.keys(req.files) : "None");

  try {
    const { 
      assessmentType, 
      title, 
      totalMarks, 
      dueDate, 
      classId, 
      rubric, 
      testCases 
    } = req.body;

    // Safety check: if classId is missing, SQL will reject it
    const finalClassId = classId || 1; 

    // Parse JSON safely
    const parsedRubric = rubric ? JSON.parse(rubric) : [];
    const parsedTestCases = testCases ? JSON.parse(testCases) : [];

    // Extract Buffers
    const questionBuffer = req.files['questionPdf'] ? req.files['questionPdf'][0].buffer : null;
    const solutionBuffer = req.files['solutionKey'] ? req.files['solutionKey'][0].buffer : null;

    if (!questionBuffer) {
        console.warn("Warning: questionPdf buffer is empty!");
    }

// gradingRoutes.js inside router.post
const pool = await ConnectionManager.getInstance().getPool();
console.log("Database Pool Status:", pool.connected); // Add this line    
    console.log("Attempting SQL Insert...");
    const result = await pool.request()
      .input('classID', sql.Int, finalClassId)
      .input('title', sql.NVarChar, title)
      .input('type', sql.NVarChar, assessmentType || 'document')
      .input('marks', sql.Int, parseInt(totalMarks) || 0)
      .input('dueDate', sql.NVarChar, dueDate || null)
      .input('qContent', sql.VarBinary(sql.MAX), questionBuffer)
      .input('sContent', sql.VarBinary(sql.MAX), solutionBuffer)
      .query(`
        INSERT INTO Assessment (
            classID, title, type, marks, uploadingDate, dueDate, status, questionFile, solutionFile
        )
        OUTPUT INSERTED.assessmentID
        VALUES (
            @classID, @title, @type, @marks, 
            CONVERT(NVARCHAR(20), GETDATE(), 23), 
            @dueDate, 'unmarked', @qContent, @sContent
        )
      `);

    const newID = result.recordset[0].assessmentID;
    console.log("Successfully inserted! New ID:", newID);

    res.status(201).json({ 
      assessmentID: newID, 
      message: "Assessment saved successfully" 
    });

  } catch (err) {
    console.error("BACKEND ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** * GET route for EvaluatorPage
 * This makes the list actually show up in your UI
 */
router.get('/assessments/:classId', async (req, res) => {
    try {
        const pool = await ConnectionManager.getInstance().getPool();
        const result = await pool.request()
            .input('classId', sql.Int, req.params.classId)
            .query(`
                SELECT 
                    assessmentID as serial, 
                    title, 
                    0 as submitted, 
                    '--' as [left] 
                FROM Assessment 
                WHERE classID = @classId
                ORDER BY assessmentID DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET assignments for a student with their specific status and grade
router.get('/student-assessments/:classId/:studentId', async (req, res) => {
  try {
      const { classId, studentId } = req.params;
      const pool = await ConnectionManager.getInstance().getPool();
      
      const result = await pool.request()
          .input('classId', sql.Int, classId)
          .input('studentId', sql.Int, studentId)
          .query(`
              SELECT 
                  a.assessmentID as id,
                  a.title,
                  a.marks as total,
                  ISNULL(s.Status, 'unsubmitted') as submissionStatus,
                  g.TotalMarks as obtained
              FROM Assessment a
              LEFT JOIN Submissions s ON a.assessmentID = s.AssignmentID AND s.StudentID = @studentId
              LEFT JOIN Grades g ON a.assessmentID = g.AssessmentID AND g.StudentID = @studentId
              WHERE a.classID = @classId
              ORDER BY a.dueDate ASC
          `);

      res.json(result.recordset);
  } catch (err) {
      console.error("Fetch Student Assessments Error:", err.message);
      res.status(500).json({ error: err.message });
  }
});

module.exports = router;