const express = require('express');
const router = express.Router();
const multer = require('multer'); // <--- ADD THIS
const upload = multer({ dest: 'uploads/' });
/** 1. Create Assessment (Saves to SQL + Handles PDF Files) */
// CHANGE: Removed express.json() and added upload.fields to capture PDFs
router.post('/assessments', upload.fields([
  { name: 'questionPdf', maxCount: 1 },
  { name: 'solutionKey', maxCount: 1 }
]), async (req, res) => {
  try {
    // In a multipart/form-data request, fields are in req.body, files are in req.files
    const { type, title, totalMarks, dueDate, classId, rubric, testCases } = req.body;
    
    // Parse the JSON strings back into objects
    const parsedRubric = rubric ? JSON.parse(rubric) : [];
    const parsedTestCases = testCases ? JSON.parse(testCases) : [];

    // Extract file buffers (the PDFs)
    const questionFile = req.files['questionPdf'] ? req.files['questionPdf'][0] : null;
    const solutionFile = req.files['solutionKey'] ? req.files['solutionKey'][0] : null;

    const pool = await ConnectionManager.getInstance().getPool();
    
    const result = await pool.request()
      .input('classID', sql.Int, classId || 1) // Defaulting to 1 if not provided
      .input('title', sql.NVarChar, title)
      .input('type', sql.NVarChar, type || 'document')
      .input('marks', sql.Int, totalMarks)
      .input('dueDate', sql.NVarChar, dueDate || null)
      // Save PDFs as VARBINARY in SQL (matching your submission logic)
      .input('qContent', sql.VarBinary(sql.MAX), questionFile ? questionFile.buffer : null)
      .input('sContent', sql.VarBinary(sql.MAX), solutionFile ? solutionFile.buffer : null)
      .query(`
        INSERT INTO Assessment (classID, title, type, marks, uploadingDate, dueDate, status, questionFile, solutionFile)
        OUTPUT INSERTED.assessmentID
        VALUES (@classID, @title, @type, @marks, CONVERT(NVARCHAR(20), GETDATE(), 23), @dueDate, 'unmarked', @qContent, @sContent)
      `);

    const newId = result.recordset[0].assessmentID;

    // TODO: If you have a separate Rubric table, you would loop through 
    // parsedRubric and insert them here using newId as the Foreign Key.

    return res.status(201).json({ 
      assessmentID: newId, 
      title, 
      message: "Assessment and Files saved to Database" 
    });
  } catch (err) {
    console.error("Creation Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;