/**
 * Factory pattern: construct Document vs Code assessments.
 */
const { DocumentAssessment, CodeAssessment } = require('./Assessment');

class AssessmentFactory {
  /**
   * @param {'document'|'code'} type
   * @param {object} baseFields fields for Assessment constructor
   */
  static create(type, baseFields) {
    if (type === 'document') {
      return new DocumentAssessment(baseFields);
    }
    if (type === 'code') {
      return new CodeAssessment(baseFields);
    }
    throw new Error(`AssessmentFactory: unsupported type "${type}". Use 'document' or 'code'.`);
  }
}

module.exports = { AssessmentFactory };
