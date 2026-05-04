const db = require('../config/db'); // Your SQL Connection

const FileController = {
    // Shared Logic for Evaluators and Students
    uploadFile: async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ message: "No file uploaded" });

            const { assignmentId, userId, role } = req.body;
            const fileBuffer = req.file.buffer;
            const fileName = req.file.originalname;

            if (role === 'evaluator') {
                // Update Assessment with Question/Key
                await db.query(
                    "UPDATE assessments SET solution_key = ?, key_name = ? WHERE id = ?",
                    [fileBuffer, fileName, assignmentId]
                );
            } else {
                // Update Student Submission
                await db.query(
                    "UPDATE student_submissions SET file_data = ?, file_name = ? WHERE student_id = ? AND assessment_id = ?",
                    [fileBuffer, fileName, userId, assignmentId]
                );
            }

            res.status(200).json({ message: "File uploaded and secured in DB" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    downloadSolution: async (req, res) => {
        try {
            const { assessmentId } = req.params;
            
            // Adapter Pattern: Fetching VARBINARY from DB
            const [rows] = await db.query(
                "SELECT solution_key, key_name FROM assessments WHERE id = ?", 
                [assessmentId]
            );

            if (!rows.length || !rows[0].solution_key) {
                return res.status(404).json({ message: "Solution not found" });
            }

            const fileBuffer = rows[0].solution_key;
            const fileName = rows[0].key_name;

            // Set headers to trigger browser download
            res.setHeader('Content-Type', 'application/pdf'); // Adjust based on stored mimetype
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.send(fileBuffer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = FileController;