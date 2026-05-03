/**
 * TestCase: autograding harness for code assessments (.cpp).
 * Separate concern from plagiarism engine.
 */
const { CodeExecutionService } = require('../codeRunner/CodeExecutionService');

class TestCase {
  /**
   * @param {{ assessmentId: string; getAssessmentStatus?: () => string }} opts
   */
  constructor(opts) {
    this.assessmentId = opts.assessmentId;
    this.getAssessmentStatus = opts.getAssessmentStatus || (() => 'unmarked');
    /** @type {{ input: string; expectedOutput: string; lastRunPassed?: boolean }[]} */
    this.tests = [];
    this.runner = new CodeExecutionService({
      preferJudge0: process.env.USE_JUDGE0 === '1',
    });
  }

  addTest(input, expectedOutput) {
    this.tests.push({ input, expectedOutput });
    return this;
  }

  /**
   * Execute student C++ source against all tests; partial marks scale with rubric total.
   * @param {string | Buffer} studentCode
   * @param {import('../rubric/Rubric').Rubric | null} rubric
   */
  /**
   * @param {string | Buffer} studentCode
   * @param {import('../rubric/Rubric').Rubric | null} rubric
   * @param {number | null} [maxPointsOverride] assessment.marks when rubric absent
   */
  async execute(studentCode, rubric = null, maxPointsOverride = null) {
    const source = Buffer.isBuffer(studentCode) ? studentCode.toString('utf8') : String(studentCode);
    const results = [];
    let passed = 0;

    for (const t of this.tests) {
      const run = await this.runner.compileAndRunCpp(source, t.input);
      const out = (run.stdout || '').trim();
      const expected = (t.expectedOutput || '').trim();
      const ok = run.exitCode === 0 && out === expected;
      t.lastRunPassed = ok;
      if (ok) passed += 1;
      results.push({
        input: t.input,
        expectedOutput: expected,
        actualOutput: out,
        exitCode: run.exitCode,
        passed: ok,
        mode: run.mode,
        stderr: run.stderr,
      });
    }

    const total = this.tests.length || 1;
    const ratio = passed / total;
    const rubricTotal =
      maxPointsOverride != null
        ? maxPointsOverride
        : rubric
          ? rubric.getTotalPoints()
          : 100;
    const partialMarks = Math.round(ratio * rubricTotal * 100) / 100;

    return {
      passedCount: passed,
      totalTests: this.tests.length,
      partialMarks,
      rubricTotal,
      results,
    };
  }

  /**
   * Students only see test visibility after evaluator has marked the assessment.
   */
  showVisibleTests() {
    const status = this.getAssessmentStatus();
    if (status !== 'marked') {
      return {
        visible: false,
        message: 'Test case details are available only after the evaluator has marked this assessment.',
        assessmentStatus: status,
      };
    }

    return {
      visible: true,
      tests: this.tests.map((t) => ({
        input: t.input,
        passed: t.lastRunPassed ?? null,
        // Intentionally omit expected output post-mark if you want to hide answers:
        revealedExpectedOutput: t.expectedOutput,
      })),
    };
  }
}

module.exports = { TestCase };
