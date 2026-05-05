const express = require('express');
const sql = require('mssql');
const upload = require('../middleware/upload');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');
const { AuthService } = require('../server/singleton/AuthService');

const router = express.Router();
const auth = AuthService.getInstance();

/** Same calendar-day rule as the client: deadline passes after the due date (local). */
function isDeadlinePassed(dueDateStr, referenceDate) {
    if (dueDateStr == null || dueDateStr === '') return false;
    const due = new Date(dueDateStr);
    if (Number.isNaN(due.getTime())) return false;
    const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    return refDay > dueDay;
}

/** Create Assessment (VARBINARY PDFs in SQL) */
router.post(
    '/assessments',
    auth.authorize(['evaluator']),
    upload.fields([
        { name: 'questionPdf', maxCount: 1 },
        { name: 'solutionKey', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { type, title, totalMarks, dueDate, classId, rubric, testCases } = req.body;

            const parsedRubric = rubric ? JSON.parse(rubric) : [];
            const parsedTestCases = testCases ? JSON.parse(testCases) : [];

            const questionFile = req.files['questionPdf'] ? req.files['questionPdf'][0] : null;
            const solutionFile = req.files['solutionKey'] ? req.files['solutionKey'][0] : null;

            const pool = await ConnectionManager.getInstance().getPool();

            const result = await pool.request()
                .input('classID', sql.Int, classId || 1)
                .input('title', sql.NVarChar, title)
                .input('type', sql.NVarChar, type || 'document')
                .input('marks', sql.Int, totalMarks)
                .input('dueDate', sql.NVarChar, dueDate || null)
                .input('qContent', sql.VarBinary(sql.MAX), questionFile ? questionFile.buffer : null)
                .input('sContent', sql.VarBinary(sql.MAX), solutionFile ? solutionFile.buffer : null)
                .query(`
                    INSERT INTO Assessment (classID, title, type, marks, uploadingDate, dueDate, status, questionFile, solutionFile)
                    OUTPUT INSERTED.assessmentID
                    VALUES (@classID, @title, @type, @marks, CONVERT(NVARCHAR(20), GETDATE(), 23), @dueDate, 'unmarked', @qContent, @sContent)
                `);

            const newId = result.recordset[0].assessmentID;

            void parsedRubric;
            void parsedTestCases;

            return res.status(201).json({
                assessmentID: newId,
                title,
                message: 'Assessment and Files saved to Database',
            });
        } catch (err) {
            console.error('Creation Error:', err);
            return res.status(500).json({ error: err.message });
        }
    }
);

/** Assessments in a class — students must be enrolled */
router.get('/classes/:classId/assessments', auth.authorize(['student', 'evaluator']), async (req, res) => {
    try {
        const classId = Number(req.params.classId);
        const pool = await ConnectionManager.getInstance().getPool();

        if (req.user.role === 'student') {
            const check = await pool.request()
                .input('uid', sql.Int, req.user.userId)
                .input('cid', sql.Int, classId)
                .query('SELECT 1 AS ok FROM ClassEnrollment WHERE userID = @uid AND classID = @cid');
            if (!check.recordset.length) {
                return res.status(403).json({ error: 'Not enrolled in this class' });
            }
        }

        const list = await pool.request()
            .input('cid', sql.Int, classId)
            .query(`
                SELECT 
                    a.assessmentID,
                    a.classID,
                    a.title,
                    a.type,
                    a.marks,
                    a.uploadingDate,
                    a.dueDate,
                    a.status,
                    cc.numStudents,
                    (
                        SELECT COUNT(*)
                        FROM Submissions s
                        WHERE s.AssignmentID = a.assessmentID
                    ) AS submitted
                FROM Assessment a
                INNER JOIN CourseClass cc ON cc.classID = a.classID
                WHERE a.classID = @cid
                ORDER BY a.assessmentID
            `);

        return res.json(list.recordset);
    } catch (err) {
        console.error('classes/:classId/assessments:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Student: single-assignment dashboard (metadata + own submission + grade) */
router.get('/student/assessments/:assessmentId/dashboard', auth.authorize(['student']), async (req, res) => {
    try {
        const assessmentId = Number(req.params.assessmentId);
        const pool = await ConnectionManager.getInstance().getPool();

        const assessResult = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .query(`
                SELECT 
                    a.assessmentID,
                    a.classID,
                    a.title,
                    a.type,
                    a.marks,
                    a.uploadingDate,
                    a.dueDate,
                    a.status,
                    cc.className,
                    cc.classCode
                FROM Assessment a
                INNER JOIN CourseClass cc ON cc.classID = a.classID
                WHERE a.assessmentID = @aid
            `);

        const assessment = assessResult.recordset[0];
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        const enr = await pool.request()
            .input('uid', sql.Int, req.user.userId)
            .input('cid', sql.Int, assessment.classID)
            .query('SELECT 1 AS ok FROM ClassEnrollment WHERE userID = @uid AND classID = @cid');
        if (!enr.recordset.length) {
            return res.status(403).json({ error: 'Not enrolled in this class' });
        }

        const subResult = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .input('sid', sql.Int, req.user.userId)
            .query(`
                SELECT TOP 1 
                    SubmissionID AS submissionId,
                    FileName AS fileName,
                    Status AS status,
                    SubmissionDate AS submissionDate
                FROM Submissions
                WHERE AssignmentID = @aid AND StudentID = @sid
                ORDER BY SubmissionDate DESC
            `);

        const gradeResult = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .input('sid', sql.Int, req.user.userId)
            .query(`
                SELECT TOP 1 TotalMarks AS totalMarks, Feedback AS feedback
                FROM Grades
                WHERE AssessmentID = @aid AND StudentID = @sid
                ORDER BY GradedAt DESC
            `);

        return res.json({
            assessment,
            submission: subResult.recordset[0] || null,
            grade: gradeResult.recordset[0] || null,
        });
    } catch (err) {
        console.error('student/assessments/:assessmentId/dashboard:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Student: withdraw submission only before deadline */
router.delete('/student/submissions/:submissionId', auth.authorize(['student']), async (req, res) => {
    try {
        const submissionId = Number(req.params.submissionId);
        const pool = await ConnectionManager.getInstance().getPool();

        const rowResult = await pool.request()
            .input('subId', sql.Int, submissionId)
            .query(`
                SELECT 
                    s.SubmissionID,
                    s.StudentID,
                    s.AssignmentID,
                    a.dueDate
                FROM Submissions s
                INNER JOIN Assessment a ON a.assessmentID = s.AssignmentID
                WHERE s.SubmissionID = @subId
            `);

        const row = rowResult.recordset[0];
        if (!row) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        if (row.StudentID !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (isDeadlinePassed(row.dueDate, new Date())) {
            return res.status(403).json({ error: 'Cannot unsubmit after the deadline' });
        }

        await pool.request()
            .input('subId', sql.Int, submissionId)
            .query('DELETE FROM Submissions WHERE SubmissionID = @subId');

        return res.json({ ok: true });
    } catch (err) {
        console.error('DELETE student/submissions:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Evaluator: submissions for an assessment */
router.get('/assessments/:assessmentId/submissions', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const assessmentId = Number(req.params.assessmentId);
        const pool = await ConnectionManager.getInstance().getPool();

        const result = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .query(`
                SELECT 
                    s.SubmissionID AS submissionId,
                    s.Status AS status,
                    u.Name AS studentName,
                    s.StudentID AS studentId
                FROM Submissions s
                INNER JOIN Users u ON u.UserID = s.StudentID
                WHERE s.AssignmentID = @aid
                ORDER BY u.Name
            `);

        return res.json(result.recordset);
    } catch (err) {
        console.error('assessments/:assessmentId/submissions:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
