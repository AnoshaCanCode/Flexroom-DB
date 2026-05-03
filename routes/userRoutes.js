const express = require('express');
const crypto = require('crypto');
const { AuthService } = require('../server/singleton/AuthService');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');
const sql = require('mssql');

const router = express.Router();
const auth = AuthService.getInstance();

/** [BACK-USER-01]: Login */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await auth.login(email, password);
        res.json(data);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

/** [BACK-USER-02]: Join Class Logic */
router.post('/join-class', auth.authorize(['student']), async (req, res) => {
    try {
        const { classCode } = req.body;
        const pool = await ConnectionManager.getInstance().getPool();

        // 1. Find the class by the 4-digit code (per your schema.sql)
        const classResult = await pool.request()
            .input('code', sql.Int, classCode)
            .query('SELECT classID FROM CourseClass WHERE classCode = @code');

        if (classResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Invalid Class Code' });
        }

        const classId = classResult.recordset[0].classID;

        // 2. Logic: In your schema, CourseClass has 'numStudents'. 
        // We update the count and you might want a junction table 'ClassEnrollments' later.
        await pool.request()
            .input('cid', sql.Int, classId)
            .query('UPDATE CourseClass SET numStudents = numStudents + 1 WHERE classID = @cid');

        res.json({ ok: true, message: 'Successfully joined class', classId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** Extra: 6-digit Code Generator for Evaluators creating classes */
router.get('/generate-code', auth.authorize(['evaluator']), (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000); // 6-digit
    res.json({ code });
});

module.exports = router;