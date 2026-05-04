const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const FileController = require('../controllers/fileController');

/**
 * Route: POST /api/files/upload
 * Description: Handles both Evaluator (Questions) and Student (Submissions) uploads.
 * Middleware: 'upload.single('file')' matches the key used in the Frontend FormData.
 */
router.post('/upload', upload.single('file'), FileController.uploadFile);

/**
 * Route: GET /api/files/download/:assessmentId
 * Description: Converts the VARBINARY solution key from DB back into a file.
 */
router.get('/download/:assessmentId', FileController.downloadSolution);

/**
 * Route: POST /api/files/export-pdf
 * Description: Uses Puppeteer to generate a PDF report.
 */
// router.post('/export-pdf', FileController.exportToPDF); 

module.exports = router;