/**
 * Assessment manager base. Factory creates Document vs Code specializations.
 */

class Assessment {
  /**
   * @param {{
   *  id: string;
   *  title: string;
   *  type: 'document'|'code';
   *  marks: number;
   *  classId?: string|number;
   *  uploadingDate?: string;
   *  dueDate?: string|null;
   *  status?: string;
   * }} params
   */
  constructor(params) {
    this.id = params.id;
    this.title = params.title;
    this.type = params.type;
    this.marks = params.marks;
    this.classId = params.classId;
    this.uploadingDate = params.uploadingDate;
    this.dueDate = params.dueDate ?? null;
    this.status = params.status || 'unmarked';

    /** @type {import('../rubric/Rubric').Rubric | null} */
    this.rubric = null;
    /** @type {import('../testCase/TestCase').TestCase | null} */
    this.testCase = null;
    /** @type {import('../solutionKey/SolutionKey').SolutionKey | null} */
    this.solutionKey = null;
  }

  getAssessmentDetails() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      marks: this.marks,
      classId: this.classId,
      uploadingDate: this.uploadingDate,
      dueDate: this.dueDate,
      status: this.status,
      hasRubric: Boolean(this.rubric),
      hasTestCases: Boolean(this.testCase),
      hasSolutionKey: Boolean(this.solutionKey),
      solutionKeyState: this.solutionKey?.getStateName() ?? null,
      rubricSummary: this.rubric ? this.rubric.getMarkingScheme() : null,
    };
  }

  /**
   * Submissions allowed until due date (inclusive — matches typical LMS; adjust if you need strict before-midnight).
   */
  isSubmissionOpen(at = new Date()) {
    if (!this.dueDate) return true;
    const due = new Date(this.dueDate);
    return at <= due;
  }

  /**
   * @param {import('../rubric/Rubric').Rubric} rubricObject
   */
  linkRubric(rubricObject) {
    this.rubric = rubricObject;
    return this;
  }

  /**
   * @param {import('../testCase/TestCase').TestCase} testCaseObject
   */
  linkTestCases(testCaseObject) {
    this.testCase = testCaseObject;
    return this;
  }

  /**
   * @param {import('../solutionKey/SolutionKey').SolutionKey} solutionKeyObject
   */
  attachSolutionKey(solutionKeyObject) {
    this.solutionKey = solutionKeyObject;
    solutionKeyObject.attachToAssessment(this);
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }
}

class DocumentAssessment extends Assessment {
  constructor(params) {
    super({ ...params, type: 'document' });
  }
}

class CodeAssessment extends Assessment {
  constructor(params) {
    super({ ...params, type: 'code' });
  }
}

module.exports = {
  Assessment,
  DocumentAssessment,
  CodeAssessment,
};
