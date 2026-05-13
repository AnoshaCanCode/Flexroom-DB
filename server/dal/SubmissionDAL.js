const { ConnectionManager } = require('../singleton/ConnectionManager');
const sql = require('mssql');

class SubmissionDAL {
    /** Get all submissions split by marked and unmarked status for an assessment */
    async getSubmissionsByAssessment(assessmentId) {
        const pool = await ConnectionManager.getInstance().getPool();
        
        // 1. Fetch Pending (Unmarked) Submissions
        const pendingResult = await pool.request()
            .input('assessmentId', sql.Int, assessmentId)
            .query(`
                SELECT s.SubmissionID, u.UserID, u.Name, a.type
                FROM Submissions s
                JOIN Users u ON s.StudentID = u.UserID
                JOIN Assessment a ON s.AssignmentID = a.assessmentID
                WHERE s.AssignmentID = @assessmentId AND s.status_eval = 'unmarked'
            `);

        // 2. Fetch Marked Submissions with their Grade details
        const markedResult = await pool.request()
            .input('assessmentId', sql.Int, assessmentId)
            .query(`
                SELECT g.GradeID, u.UserID, u.Name, g.TotalMarks, a.marks AS MaxMarks, a.type
                FROM Grades g
                JOIN Users u ON g.StudentID = u.UserID
                JOIN Assessment a ON g.AssessmentID = a.assessmentID
                WHERE g.AssessmentID = @assessmentId
            `);

        return {
            pending: pendingResult.recordset,
            marked: markedResult.recordset
        };
    }
}

module.exports = new SubmissionDAL();