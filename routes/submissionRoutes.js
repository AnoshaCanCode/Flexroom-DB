const express = require('express');
const router = express.Router();
const submissionDAL = require('../server/dal/SubmissionDAL');
const { AuthService } = require('../server/singleton/AuthService');
const auth = AuthService.getInstance();

/** Fetch overview of submissions for evaluator view */
router.get('/assessment/:id', auth.authorize(['evaluator']), async (req, res) => {
    try {
        const assessmentId = parseInt(req.params.id, 10);
        const data = await submissionDAL.getSubmissionsByAssessment(assessmentId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;