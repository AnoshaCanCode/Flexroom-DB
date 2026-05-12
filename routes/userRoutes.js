const express = require('express');
const crypto = require('crypto');
const sql = require('mssql');

// PATH ADJUSTMENTS BASED ON YOUR FOLDER TREE:
const { AuthService } = require('../server/singleton/AuthService'); 
const { ConnectionManager } = require('../server/singleton/ConnectionManager'); 
const userDAL = require('../server/dal/UserDAL'); 

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

        const classResult = await pool.request()
            .input('code', sql.Int, classCode)
            .query('SELECT classID FROM CourseClass WHERE classCode = @code');

        if (classResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Invalid Class Code' });
        }

        const classId = classResult.recordset[0].classID;

        await pool.request()
            .input('cid', sql.Int, classId)
            .query('UPDATE CourseClass SET numStudents = numStudents + 1 WHERE classID = @cid');

        res.json({ ok: true, message: 'Successfully joined class', classId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** [BACK-USER-00]: Signup */
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const data = await auth.signup(name, email, password, role); 
        res.json({ success: true, data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/** Create a New Class */
router.post('/create-class', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const { className } = req.body;
        const classCode = Math.floor(1000 + Math.random() * 9000);
        const today = new Date().toLocaleDateString();

        await userDAL.createClass(className, classCode, today);
        res.json({ success: true, classCode, className });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** Fetch Classes for Dashboard */
router.get('/classes', async (req, res) => {
    try {
        const classes = await userDAL.getAllClasses();
        res.json(classes || []); 
    } catch (err) {
        console.error("Route Error /classes:", err.message);
        res.status(500).json({ error: "Failed to fetch classes" });
    }
});

router.get('/test', (req, res) => {
    res.send("User routes are working!");
});

module.exports = router;