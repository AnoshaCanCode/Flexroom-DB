const express = require('express');
const sql = require('mssql');
const upload = require('../middleware/upload');
const { ConnectionManager } = require('../server/singleton/ConnectionManager');
const { AuthService } = require('../server/singleton/AuthService');

const router = express.Router();
const auth = AuthService.getInstance();

const { MatchResults } = require('../server/plagiarism/MatchResults');
const { CodeExecutionService } = require('../server/codeRunner/CodeExecutionService');

function normalizeCompareOutput(s) {
    return String(s || '').trim().replace(/\r\n/g, '\n');
}

const DEFAULT_CODE_RUBRIC = [
    { id: '1', criteria: '1. Precision', maxMarks: 33 },
    { id: '2', criteria: '2. Logic', maxMarks: 34 },
    { id: '3', criteria: '3. Correct Datastructure', maxMarks: 33 },
];

const DEFAULT_DOC_RUBRIC = [
    { id: 'Q1', criteria: 'Q1', maxMarks: 2 },
    { id: 'Q2', criteria: 'Q2', maxMarks: 2 },
    { id: 'Q3', criteria: 'Q3', maxMarks: 3 },
    { id: 'Q4', criteria: 'Q4', maxMarks: 2 },
    { id: 'Q5', criteria: 'Q5', maxMarks: 3 },
    { id: 'Q6', criteria: 'Q6', maxMarks: 3 },
];

async function loadRubrics(pool, assessmentId, assessmentType) {
    const r = await pool.request()
        .input('aid', sql.Int, assessmentId)
        .query(`
            SELECT RubricID AS id, CriterionDescription AS criteria, MaxPoints AS maxMarks
            FROM Rubrics
            WHERE AssessmentID = @aid
            ORDER BY RubricID
        `);
    if (r.recordset.length) {
        return r.recordset.map((row) => ({
            id: String(row.id),
            criteria: row.criteria,
            maxMarks: row.maxMarks,
        }));
    }
    return String(assessmentType).toLowerCase() === 'document'
        ? [...DEFAULT_DOC_RUBRIC]
        : [...DEFAULT_CODE_RUBRIC];
}

async function loadTestCases(pool, assessmentId) {
    const r = await pool.request()
        .input('aid', sql.Int, assessmentId)
        .query(`
            SELECT TestCaseID AS id, Input AS inputText, ExpectedOutput AS expectedOutput, Marks AS marks
            FROM TestCases
            WHERE AssessmentID = @aid
            ORDER BY TestCaseID
        `);
    return r.recordset.map((row) => ({
        id: row.id,
        inputText: row.inputText,
        expectedOutput: row.expectedOutput,
        marks: row.marks,
    }));
}

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

/** Evaluator: marking workspace payload */
router.get('/evaluator/submissions/:submissionId/marking-context', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const submissionId = Number(req.params.submissionId);
        const pool = await ConnectionManager.getInstance().getPool();

        const sr = await pool.request()
            .input('sid', sql.Int, submissionId)
            .query(`
                SELECT 
                    s.SubmissionID AS submissionId,
                    s.FileName AS fileName,
                    s.FileContent AS fileContent,
                    s.StudentID AS studentId,
                    s.AssignmentID AS assignmentId,
                    u.Name AS studentName,
                    a.title AS title,
                    a.type AS type,
                    a.marks AS marks,
                    a.dueDate AS dueDate,
                    a.solutionFile AS solutionFile,
                    cc.className AS className,
                    cc.classCode AS classCode
                FROM Submissions s
                INNER JOIN Users u ON u.UserID = s.StudentID
                INNER JOIN Assessment a ON a.assessmentID = s.AssignmentID
                INNER JOIN CourseClass cc ON cc.classID = a.classID
                WHERE s.SubmissionID = @sid
            `);

        const row = sr.recordset[0];
        if (!row) return res.status(404).json({ error: 'Submission not found' });

        const submissionText = row.fileContent ? Buffer.from(row.fileContent).toString('utf8') : '';
        const keyText = row.solutionFile && row.solutionFile.length
            ? Buffer.from(row.solutionFile).toString('utf8')
            : '';

        const rubric = await loadRubrics(pool, row.assessmentId, row.type);
        const testCases = await loadTestCases(pool, row.assessmentId);

        const gr = await pool.request()
            .input('aid', sql.Int, row.assessmentId)
            .input('stu', sql.Int, row.studentId)
            .query(`
                SELECT TOP 1 TotalMarks AS totalMarks, Feedback AS feedback
                FROM Grades
                WHERE AssessmentID = @aid AND StudentID = @stu
                ORDER BY GradedAt DESC
            `);

        return res.json({
            assessment: {
                assessmentID: row.assessmentId,
                title: row.title,
                type: row.type,
                marks: row.marks,
                dueDate: row.dueDate,
                className: row.className,
                classCode: row.classCode,
            },
            submission: {
                submissionId: row.submissionId,
                fileName: row.fileName,
                studentId: row.studentId,
                studentName: row.studentName,
                sourceText: submissionText,
            },
            keyText,
            rubric,
            testCases,
            grade: gr.recordset[0] || null,
        });
    } catch (err) {
        console.error('evaluator marking-context:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Compare submission to peers on same assignment */
router.post('/plagiarism/run', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const submissionId = Number(req.body.submissionId);
        const pool = await ConnectionManager.getInstance().getPool();

        const tr = await pool.request()
            .input('sid', sql.Int, submissionId)
            .query(`
                SELECT s.SubmissionID, s.FileName, s.FileContent, s.AssignmentID, a.type AS assessmentType
                FROM Submissions s
                INNER JOIN Assessment a ON a.assessmentID = s.AssignmentID
                WHERE s.SubmissionID = @sid
            `);
        const targetRow = tr.recordset[0];
        if (!targetRow) return res.status(404).json({ error: 'Submission not found' });

        const typeNorm = String(targetRow.assessmentType).toLowerCase() === 'document' ? 'document' : 'code';
        const target = {
            id: targetRow.SubmissionID,
            type: typeNorm,
            fileName: targetRow.FileName,
            buffer: Buffer.from(targetRow.FileContent || []),
        };

        const peers = await pool.request()
            .input('aid', sql.Int, targetRow.AssignmentID)
            .input('sid', sql.Int, submissionId)
            .query(`
                SELECT SubmissionID AS submissionId, FileName AS fileName, FileContent AS fileContent
                FROM Submissions
                WHERE AssignmentID = @aid AND SubmissionID <> @sid
            `);

        const repository = peers.recordset.map((p) => ({
            id: p.submissionId,
            type: typeNorm,
            fileName: p.fileName,
            buffer: Buffer.from(p.fileContent || []),
        }));

        const engine = new MatchResults();
        const report = await engine.runAnalysis(target, repository);
        const comparisons = report.comparisons || [];
        const maxSimilarity = comparisons.length
            ? Math.max(...comparisons.map((c) => Number(c.similarityPercentage) || 0))
            : 0;
        const plagiarismDetected = comparisons.some((c) => c.flagged);

        return res.json({ report, maxSimilarity, plagiarismDetected });
    } catch (err) {
        console.error('plagiarism/run:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Run compiled tests against submission (code assessments) */
router.post('/autograde', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const submissionId = Number(req.body.submissionId);
        const pool = await ConnectionManager.getInstance().getPool();

        const sr = await pool.request()
            .input('sid', sql.Int, submissionId)
            .query(`
                SELECT s.FileContent, s.FileName, s.AssignmentID, a.type AS assessmentType, a.marks AS assessmentMarks
                FROM Submissions s
                INNER JOIN Assessment a ON a.assessmentID = s.AssignmentID
                WHERE s.SubmissionID = @sid
            `);
        const row = sr.recordset[0];
        if (!row) return res.status(404).json({ error: 'Submission not found' });
        if (String(row.assessmentType).toLowerCase() === 'document') {
            return res.status(400).json({ error: 'Autograde applies to code assessments only' });
        }

        const fn = String(row.FileName || '').toLowerCase();
        if (!fn.endsWith('.cpp') && !fn.endsWith('.cxx') && !fn.endsWith('.cc')) {
            return res.status(400).json({ error: 'Submission must be a .cpp file for autograde' });
        }

        const testCases = await loadTestCases(pool, row.AssignmentID);
        if (!testCases.length) {
            return res.status(400).json({ error: 'No test cases configured for this assessment' });
        }

        const svc = new CodeExecutionService();
        const buf = Buffer.from(row.FileContent || []);
        const results = [];
        let earned = 0;
        let totalWeight = 0;
        for (const tc of testCases) {
            totalWeight += Number(tc.marks) || 0;
            const run = await svc.compileAndRunCpp(buf, tc.inputText || '');
            const pass = normalizeCompareOutput(run.stdout) === normalizeCompareOutput(tc.expectedOutput);
            if (pass) earned += Number(tc.marks) || 0;
            results.push({
                testCaseId: tc.id,
                passed: pass,
                stdout: run.stdout,
                stderr: run.stderr,
                exitCode: run.exitCode,
            });
        }

        const assessmentMarks = Number(row.assessmentMarks) || 100;
        const ratio = totalWeight > 0 ? earned / totalWeight : 0;
        const suggestedTotal = Math.round(ratio * assessmentMarks * 100) / 100;

        const rubric = await loadRubrics(pool, row.AssignmentID, row.assessmentType);
        const maxRubricSum = rubric.reduce((s, it) => s + Number(it.maxMarks), 0) || 1;
        const suggestedRubricMarks = {};
        rubric.forEach((it) => {
            const share = (Number(it.maxMarks) / maxRubricSum) * suggestedTotal;
            suggestedRubricMarks[it.id] = Math.min(Number(it.maxMarks), Math.round(share * 100) / 100);
        });

        return res.json({
            testResults: results,
            suggestedTotal,
            suggestedRubricMarks,
            earnedTestMarks: earned,
            totalTestMarks: totalWeight,
        });
    } catch (err) {
        console.error('autograde:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Official grade write — Grades table */
router.post('/evaluator/finalize-grade', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const {
            assessmentId,
            studentId,
            totalMarks,
            feedback,
            detail,
        } = req.body;

        const aid = Number(assessmentId);
        const sid = Number(studentId);
        const total = totalMarks != null ? Number(totalMarks) : null;
        const fb = feedback != null ? String(feedback) : '';
        const detailJson = detail != null ? JSON.stringify(detail) : null;

        const pool = await ConnectionManager.getInstance().getPool();

        const exists = await pool.request()
            .input('aid', sql.Int, aid)
            .input('stu', sql.Int, sid)
            .query('SELECT GradeID FROM Grades WHERE AssessmentID=@aid AND StudentID=@stu');

        async function upsertWithDetail(useDetail) {
            const rq = pool.request()
                .input('aid', sql.Int, aid)
                .input('stu', sql.Int, sid)
                .input('tm', sql.Decimal(10, 2), total)
                .input('fb', sql.NVarChar(sql.MAX), fb);
            if (useDetail && detailJson != null) rq.input('dj', sql.NVarChar(sql.MAX), detailJson);

            if (exists.recordset.length) {
                const sqlUpdate = useDetail && detailJson != null
                    ? `UPDATE Grades SET TotalMarks=@tm, Feedback=@fb, DetailJSON=@dj, GradedAt=GETDATE()
                       WHERE AssessmentID=@aid AND StudentID=@stu`
                    : `UPDATE Grades SET TotalMarks=@tm, Feedback=@fb, GradedAt=GETDATE()
                       WHERE AssessmentID=@aid AND StudentID=@stu`;
                await rq.query(sqlUpdate);
            } else {
                const sqlInsert = useDetail && detailJson != null
                    ? `INSERT INTO Grades (AssessmentID, StudentID, TotalMarks, Feedback, DetailJSON)
                       VALUES (@aid, @stu, @tm, @fb, @dj)`
                    : `INSERT INTO Grades (AssessmentID, StudentID, TotalMarks, Feedback)
                       VALUES (@aid, @stu, @tm, @fb)`;
                await rq.query(sqlInsert);
            }
        }

        try {
            await upsertWithDetail(true);
        } catch (e) {
            if (detailJson != null && String(e.message || '').includes('DetailJSON')) {
                await upsertWithDetail(false);
            } else {
                throw e;
            }
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error('finalize-grade:', err);
        return res.status(500).json({ error: err.message });
    }
});

/** Student self-eval workspace */
router.get('/student/assessments/:assessmentId/self-eval-context', auth.authorize(['student']), async (req, res) => {
    try {
        const assessmentId = Number(req.params.assessmentId);
        const pool = await ConnectionManager.getInstance().getPool();

        const ar = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .query(`
                SELECT a.assessmentID, a.title, a.type, a.marks, a.dueDate, a.solutionFile,
                       a.classID, cc.className, cc.classCode
                FROM Assessment a
                INNER JOIN CourseClass cc ON cc.classID = a.classID
                WHERE a.assessmentID = @aid
            `);
        const arow = ar.recordset[0];
        if (!arow) return res.status(404).json({ error: 'Assessment not found' });

        const enr = await pool.request()
            .input('uid', sql.Int, req.user.userId)
            .input('cid', sql.Int, arow.classID)
            .query('SELECT 1 FROM ClassEnrollment WHERE userID=@uid AND classID=@cid');
        if (!enr.recordset.length) return res.status(403).json({ error: 'Not enrolled' });

        if (!isDeadlinePassed(arow.dueDate, new Date())) {
            return res.status(403).json({ error: 'Self evaluation opens after the deadline' });
        }

        const sr = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .input('uid', sql.Int, req.user.userId)
            .query(`
                SELECT TOP 1 SubmissionID AS submissionId, FileName AS fileName, FileContent AS fileContent
                FROM Submissions
                WHERE AssignmentID=@aid AND StudentID=@uid
                ORDER BY SubmissionDate DESC
            `);
        const sub = sr.recordset[0];
        if (!sub) return res.status(400).json({ error: 'Submit your work before using self evaluation' });

        const submissionText = sub.fileContent ? Buffer.from(sub.fileContent).toString('utf8') : '';
        const keyText = arow.solutionFile && arow.solutionFile.length
            ? Buffer.from(arow.solutionFile).toString('utf8')
            : '';

        const rubric = await loadRubrics(pool, assessmentId, arow.type);
        const testCases = await loadTestCases(pool, assessmentId);

        let saved = null;
        try {
            const sv = await pool.request()
                .input('aid', sql.Int, assessmentId)
                .input('uid', sql.Int, req.user.userId)
                .query(`
                    SELECT RubricScores, TestCaseScores, TotalMarks
                    FROM StudentSelfEval
                    WHERE AssessmentID=@aid AND StudentID=@uid
                `);
            if (sv.recordset.length) {
                saved = sv.recordset[0];
                try {
                    saved.rubricScores = saved.RubricScores ? JSON.parse(saved.RubricScores) : {};
                    saved.testCaseScores = saved.TestCaseScores ? JSON.parse(saved.TestCaseScores) : {};
                } catch (_) {
                    saved.rubricScores = {};
                    saved.testCaseScores = {};
                }
            }
        } catch (_) {
            /* StudentSelfEval table may not exist yet */
        }

        return res.json({
            assessment: {
                assessmentID: arow.assessmentID,
                title: arow.title,
                type: arow.type,
                marks: arow.marks,
                dueDate: arow.dueDate,
                className: arow.className,
                classCode: arow.classCode,
            },
            submission: {
                submissionId: sub.submissionId,
                fileName: sub.fileName,
                sourceText: submissionText,
            },
            keyText,
            rubric,
            testCases,
            savedSelfEval: saved,
        });
    } catch (err) {
        console.error('self-eval-context:', err);
        return res.status(500).json({ error: err.message });
    }
});

router.post('/student/assessments/:assessmentId/self-eval', auth.authorize(['student']), async (req, res) => {
    try {
        const assessmentId = Number(req.params.assessmentId);
        const { rubricMarks, testCaseResults, totalMarks } = req.body;
        const pool = await ConnectionManager.getInstance().getPool();

        const ar = await pool.request()
            .input('aid', sql.Int, assessmentId)
            .query('SELECT dueDate, classID FROM Assessment WHERE assessmentID=@aid');
        const arow = ar.recordset[0];
        if (!arow) return res.status(404).json({ error: 'Assessment not found' });

        const enr = await pool.request()
            .input('uid', sql.Int, req.user.userId)
            .input('cid', sql.Int, arow.classID)
            .query('SELECT 1 FROM ClassEnrollment WHERE userID=@uid AND classID=@cid');
        if (!enr.recordset.length) return res.status(403).json({ error: 'Not enrolled' });

        if (!isDeadlinePassed(arow.dueDate, new Date())) {
            return res.status(403).json({ error: 'Self evaluation opens after the deadline' });
        }

        const rubricJson = JSON.stringify(rubricMarks || {});
        const tcJson = JSON.stringify(testCaseResults || {});
        const tm = totalMarks != null ? Number(totalMarks) : null;

        await pool.request()
            .input('aid', sql.Int, assessmentId)
            .input('uid', sql.Int, req.user.userId)
            .input('rj', sql.NVarChar(sql.MAX), rubricJson)
            .input('tj', sql.NVarChar(sql.MAX), tcJson)
            .input('tm', sql.Decimal(10, 2), tm)
            .query(`
                MERGE StudentSelfEval AS t
                USING (SELECT @aid AS AssessmentID, @uid AS StudentID) AS s
                ON t.AssessmentID = s.AssessmentID AND t.StudentID = s.StudentID
                WHEN MATCHED THEN UPDATE SET RubricScores=@rj, TestCaseScores=@tj, TotalMarks=@tm, UpdatedAt=GETDATE()
                WHEN NOT MATCHED THEN INSERT (AssessmentID, StudentID, RubricScores, TestCaseScores, TotalMarks)
                VALUES (@aid, @uid, @rj, @tj, @tm);
            `);

        return res.json({ ok: true });
    } catch (err) {
        console.error('POST self-eval:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
