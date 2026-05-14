const express = require('express');
const router = express.Router();
const multer = require('multer');
const sql = require('mssql');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');

// Use memory storage for VARBINARY (PDF files)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * POST /api/grading/assessments
 * Purpose: Save a new assignment, its rubrics, and its test cases.
 */
router.post('/assessments', upload.fields([
    { name: 'questionPdf', maxCount: 1 },
    { name: 'solutionKey', maxCount: 1 }
]), async (req, res) => {
    console.log("--- New Assessment Request Received ---");

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

        // 1. Preparation
        const finalClassId = classId || 1; 
        const parsedRubric = rubric ? JSON.parse(rubric) : [];
        const parsedTestCases = testCases ? JSON.parse(testCases) : [];

        const questionBuffer = req.files['questionPdf'] ? req.files['questionPdf'][0].buffer : null;
        const solutionBuffer = req.files['solutionKey'] ? req.files['solutionKey'][0].buffer : null;

        const pool = await ConnectionManager.getInstance().getPool();
        
        // 2. Insert into Assessment Table
        const assessmentResult = await pool.request()
            .input('classID', sql.Int, finalClassId)
            .input('title', sql.NVarChar, title)
            .input('type', sql.NVarChar, assessmentType || 'document')
            .input('marks', sql.Int, parseInt(totalMarks) || 0)
            .input('dueDate', sql.NVarChar, dueDate || null)
            .input('qContent', sql.VarBinary(sql.MAX), questionBuffer)
            .input('sContent', sql.VarBinary(sql.MAX), solutionBuffer)
            .query(`
                INSERT INTO dbo.Assessment (
                    classID, title, type, marks, uploadingDate, dueDate, status, questionFile, solutionFile
                )
                OUTPUT INSERTED.assessmentID
                VALUES (
                    @classID, @title, @type, @marks, 
                    CONVERT(NVARCHAR(20), GETDATE(), 23), 
                    @dueDate, 'unmarked', @qContent, @sContent
                )
            `);

        const newID = assessmentResult.recordset[0].assessmentID;
        console.log(`Assessment created with ID: ${newID}`);

        // 3. Insert Rubric Items (Matches: AssessmentID, CriterionDescription, MaxPoints)
        if (parsedRubric.length > 0) {
            for (const item of parsedRubric) {
                await pool.request()
                    .input('assessmentID', sql.Int, newID)
                    .input('description', sql.NVarChar, item.description)
                    .input('points', sql.Int, item.marks) // item.marks comes from frontend form
                    .query(`
                        INSERT INTO dbo.Rubrics (AssessmentID, CriterionDescription, MaxPoints)
                        VALUES (@assessmentID, @description, @points)
                    `);
            }
            console.log(`Inserted ${parsedRubric.length} rubric criteria.`);
        }

        // 4. Insert Test Cases (Matches: AssessmentID, Input, ExpectedOutput, Marks)
        if (assessmentType === 'code' && parsedTestCases.length > 0) {
            for (const tc of parsedTestCases) {
                await pool.request()
                    .input('assessmentID', sql.Int, newID)
                    .input('inputData', sql.NVarChar, tc.input) // tc.input comes from frontend form
                    .input('marks', sql.Int, tc.marks)
                    .query(`
                        INSERT INTO dbo.TestCases (AssessmentID, [Input], ExpectedOutput, Marks)
                        VALUES (@assessmentID, @inputData, '', @marks)
                    `);
            }
            console.log(`Inserted ${parsedTestCases.length} test cases.`);
        }

        res.status(201).json({ 
            assessmentID: newID, 
            message: "Assessment, Rubrics, and Test Cases saved successfully" 
        });

    } catch (err) {
        console.error("BACKEND ERROR:", err.message);
        res.status(500).json({ error: "Failed to create assessment: " + err.message });
    }
});

/**
 * GET /api/grading/assessments/:classId
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
                FROM dbo.Assessment 
                WHERE classID = @classId
                ORDER BY assessmentID DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/grading/student-assessments/:classId/:studentId
 */
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
                FROM dbo.Assessment a
                LEFT JOIN dbo.Submissions s ON a.assessmentID = s.AssignmentID AND s.StudentID = @studentId
                LEFT JOIN dbo.Grades g ON a.assessmentID = g.AssessmentID AND g.StudentID = @studentId
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