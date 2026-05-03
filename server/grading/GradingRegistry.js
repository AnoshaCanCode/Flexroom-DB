/**
 * In-memory registry for Postman-driven testing. Swap for SQL repositories later.
 */
const { v4: uuidv4 } = require('uuid');

const assessments = new Map();
const submissions = new Map();

function createAssessmentId() {
  return uuidv4();
}

function createSubmissionId() {
  return uuidv4();
}

module.exports = {
  assessments,
  submissions,
  createAssessmentId,
  createSubmissionId,
};
