/**
 * Plagiarism engine — Template Method pattern.
 *
 * Pipeline (fixed order):
 *   Step 1 — extractText(submission)
 *            • PDF  → pdf-parse (PDFParse.getText)
 *            • CPP  → read buffer as UTF-8 string (no PDF parsing)
 *   Step 2 — compare(extractedTarget, extractedSource) → similarity %
 *   Step 3 — report: aggregate rows + flags → comparison report
 *
 * Separate from autograding (TestCase / CodeExecutionService).
 */
const { PDFParse } = require('pdf-parse');
const { compareTwoStrings } = require('string-similarity');

class MatchResults {
  constructor() {
    /** @type {object | null} */
    this._lastReport = null;
  }

  // ---------------------------------------------------------------------------
  // Template Method — orchestrates Step 1 → Step 2 → Step 3
  // ---------------------------------------------------------------------------

  /**
   * @param {{ id: string|number; type: 'document'|'code'; fileName: string; buffer: Buffer }} targetSubmission
   * @param {Array<{ id: string|number; type: 'document'|'code'; fileName: string; buffer: Buffer }>} repository
   */
  async runAnalysis(targetSubmission, repository) {
    const targetText = await this.extractText(targetSubmission);
    /** @type {object[]} */
    const comparisonRows = [];

    for (const source of repository) {
      if (!this.shouldComparePair(targetSubmission, source)) continue;

      const sourceText = await this.extractText(source);
      const similarityPercentage = this.compare(targetText, sourceText);
      comparisonRows.push(
        this.buildComparisonRow(targetSubmission, source, similarityPercentage)
      );
    }

    this._lastReport = this.finalizeReport(targetSubmission, comparisonRows);
    return this._lastReport;
  }

  shouldComparePair(target, source) {
    if (String(source.id) === String(target.id)) return false;
    if (source.type !== target.type) return false;
    return true;
  }

  buildComparisonRow(target, source, similarityPercentage) {
    return {
      targetId: target.id,
      sourceId: source.id,
      similarityPercentage,
      flagged: this.generateFlagStatus(similarityPercentage),
    };
  }

  finalizeReport(targetSubmission, comparisonRows) {
    return {
      targetId: targetSubmission.id,
      generatedAt: new Date().toISOString(),
      comparisons: comparisonRows,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 1 — Extract text (PDF vs CPP vs fallback)
  // ---------------------------------------------------------------------------

  /**
   * @param {{ type: 'document'|'code'; fileName: string; buffer: Buffer }} submission
   * @returns {Promise<string>}
   */
  async extractText(submission) {
    const fileName = (submission.fileName || '').toLowerCase();

    if (this._isPdf(fileName)) {
      return this._extractPdfText(submission.buffer);
    }

    if (this._isCpp(fileName)) {
      return this._extractCppAsString(submission.buffer);
    }

    if (submission.type === 'document') {
      return this._normalizeWhitespace(submission.buffer.toString('utf8'));
    }

    if (submission.type === 'code') {
      return this._extractCppAsString(submission.buffer);
    }

    return this._normalizeWhitespace(submission.buffer.toString('utf8'));
  }

  /** @deprecated Use extractText — kept for callers that used the old name */
  async extract(submission) {
    return this.extractText(submission);
  }

  _isPdf(fileNameLower) {
    return fileNameLower.endsWith('.pdf');
  }

  _isCpp(fileNameLower) {
    return (
      fileNameLower.endsWith('.cpp') ||
      fileNameLower.endsWith('.cxx') ||
      fileNameLower.endsWith('.cc')
    );
  }

  /**
   * PDF: pdf-parse only (Step 1 branch for documents).
   * @param {Buffer} buffer
   */
  async _extractPdfText(buffer) {
    const parser = new PDFParse({ data: buffer });
    try {
      const data = await parser.getText();
      return this._normalizeWhitespace(data.text || '');
    } finally {
      await parser.destroy();
    }
  }

  /**
   * CPP: read file contents as a string (Step 1 branch for code).
   * No compilation — plain UTF-8 text for similarity comparison.
   * @param {Buffer} buffer
   */
  _extractCppAsString(buffer) {
    const raw = buffer.toString('utf8');
    return this._normalizeWhitespace(raw);
  }

  _normalizeWhitespace(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  // ---------------------------------------------------------------------------
  // Step 2 — Compare extracted strings
  // ---------------------------------------------------------------------------

  /**
   * @param {string} extractedTarget
   * @param {string} extractedSource
   * @returns {number} percentage 0–100
   */
  compare(extractedTarget, extractedSource) {
    return this.calculateSimilarityFromText(extractedTarget, extractedSource);
  }

  /**
   * Same as compare(); accepts raw buffers/strings for convenience.
   */
  calculateSimilarity(targetContent, sourceContent) {
    const a = Buffer.isBuffer(targetContent) ? targetContent.toString('utf8') : String(targetContent);
    const b = Buffer.isBuffer(sourceContent) ? sourceContent.toString('utf8') : String(sourceContent);
    return this.compare(a, b);
  }

  calculateSimilarityFromText(targetText, sourceText) {
    const A = (targetText || '').trim();
    const B = (sourceText || '').trim();
    if (!A.length && !B.length) return 0;
    const sim = compareTwoStrings(A, B);
    return Math.round(sim * 10000) / 100;
  }

  // ---------------------------------------------------------------------------
  // Step 3 — Flag threshold + expose report
  // ---------------------------------------------------------------------------

  generateFlagStatus(percentage) {
    return percentage > 30;
  }

  getComparisonReport() {
    if (!this._lastReport) {
      return { message: 'No plagiarism analysis has been executed yet.' };
    }
    return this._lastReport;
  }
}

module.exports = { MatchResults };
