const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../db');

const router = express.Router();

const SQL_UNIQUE_VIOLATION = 2627;
const SQL_UNIQUE_INDEX = 2601;

function requireEvaluator(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Server Issues' });
    }
    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, secret);
        const role = payload.userRole || payload.role || payload.UserRole;
        if (role !== 'evaluator') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = payload;
        return next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

function isDuplicateClassCodeError(err) {
    const code = err?.number ?? err?.originalError?.info?.number;
    return code === SQL_UNIQUE_VIOLATION || code === SQL_UNIQUE_INDEX;
}

function handleRouteError(res, err) {
    console.error('CourseClass route error:', err);
    if (isDuplicateClassCodeError(err)) {
        return res.status(409).json({ error: 'Duplicate Course Code' });
    }
    return res.status(500).json({ error: 'Server Issues' });
}

/**
 * POST /create — Evaluator creates a CourseClass row.
 * Body: { classID?, className | courseName, classCode | courseCode, courseID?, numStudents?, description? }
 * Aliases courseName/courseCode accepted for convenience. description is echoed only (not stored).
 */
router.post('/create', requireEvaluator, async (req, res) => {
    const body = req.body || {};
    const className = body.className ?? body.courseName;
    const classCode = body.classCode ?? body.courseCode;
    const { description, numStudents } = body;
    let { classID, courseID } = body;

    if (className === undefined || className === null || String(className).trim() === '') {
        return res.status(400).json({ error: 'className is required' });
    }
    if (classCode === undefined || classCode === null || String(classCode).trim() === '') {
        return res.status(400).json({ error: 'classCode is required' });
    }

    const codeNum = parseInt(String(classCode).trim(), 10);
    if (Number.isNaN(codeNum)) {
        return res.status(400).json({ error: 'classCode must be a number' });
    }

    let courseIdNum = 0;
    if (courseID !== undefined && courseID !== null && String(courseID).trim() !== '') {
        courseIdNum = parseInt(String(courseID).trim(), 10);
        if (Number.isNaN(courseIdNum)) {
            return res.status(400).json({ error: 'courseID must be a number' });
        }
    }

    let numStudentsVal = 0;
    if (numStudents !== undefined && numStudents !== null && String(numStudents).trim() !== '') {
        numStudentsVal = parseInt(String(numStudents).trim(), 10);
        if (Number.isNaN(numStudentsVal) || numStudentsVal < 0) {
            return res.status(400).json({ error: 'numStudents must be a non-negative number' });
        }
    }

    try {
        const pool = await getPool();
        let id = classID;
        if (id === undefined || id === null || String(id).trim() === '') {
            const nextResult = await pool
                .request()
                .query('SELECT ISNULL(MAX(classID), 0) + 1 AS nextId FROM CourseClass');
            id = nextResult.recordset[0].nextId;
        } else {
            id = parseInt(String(id).trim(), 10);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'classID must be a number' });
            }
        }

        const generatedDate = new Date().toISOString().slice(0, 10);

        await pool
            .request()
            .input('classID', sql.Int, id)
            .input('courseID', sql.Int, courseIdNum)
            .input('className', sql.NVarChar(100), String(className).trim())
            .input('classCode', sql.Int, codeNum)
            .input('generatedDate', sql.NVarChar(20), generatedDate)
            .input('numStudents', sql.Int, numStudentsVal)
            .query(`
                INSERT INTO CourseClass (classID, courseID, className, classCode, generatedDate, numStudents)
                VALUES (@classID, @courseID, @className, @classCode, @generatedDate, @numStudents)
            `);

        return res.status(201).json({
            classID: id,
            courseID: courseIdNum,
            className: String(className).trim(),
            classCode: codeNum,
            generatedDate,
            numStudents: numStudentsVal,
            description: description == null ? null : String(description),
        });
    } catch (err) {
        return handleRouteError(res, err);
    }
});

/**
 * GET /:id — Fetch CourseClass by classID.
 */
router.get('/:id', async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid class id' });
    }

    try {
        const pool = await getPool();
        const result = await pool
            .request()
            .input('classID', sql.Int, id)
            .query(`
                SELECT classID, courseID, className, classCode, generatedDate, numStudents
                FROM CourseClass
                WHERE classID = @classID
            `);

        if (!result.recordset.length) {
            return res.status(404).json({ error: 'CourseClass not found' });
        }

        const row = result.recordset[0];
        return res.json({
            classID: row.classID,
            courseID: row.courseID,
            className: row.className,
            classCode: row.classCode,
            generatedDate: row.generatedDate,
            numStudents: row.numStudents,
            description: null,
        });
    } catch (err) {
        return handleRouteError(res, err);
    }
});

module.exports = router;
