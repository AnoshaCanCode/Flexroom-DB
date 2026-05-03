/**
 * SolutionKey (State pattern): controls visibility and download of official solution.
 */
const { LockedState, ReleasedState } = require('./SolutionKeyStates');

class SolutionKey {
  constructor({ fileName, buffer, mimeType = 'application/octet-stream' }) {
    this.fileName = fileName;
    this.buffer = buffer;
    this.mimeType = mimeType;
    /** @type {Date | null} */
    this.releaseDate = null;
    /** @type {any | null} */
    this.assessment = null;
    this._state = new LockedState();
  }

  /**
   * @param {any} assessment
   */
  attachToAssessment(assessment) {
    this.assessment = assessment;
  }

  /** @param {Date | string} dateTime */
  setReleaseDate(dateTime) {
    this.releaseDate = dateTime instanceof Date ? dateTime : new Date(dateTime);
    if (this._isPastRelease(new Date())) {
      this._state = new ReleasedState();
    } else {
      this._state = new LockedState();
    }
  }

  /**
   * Evaluator may force release (e.g. after marking), still subject to deadline rules in validateAccess.
   */
  releaseNow() {
    this._state = new ReleasedState();
  }

  _isPastRelease(now) {
    return this.releaseDate != null && now >= this.releaseDate;
  }

  /**
   * @param {number} userID
   * @param {Date} [now]
   */
  validateAccess(userID, now = new Date()) {
    if (!this.assessment) {
      return { allowed: false, userID, reason: 'Solution key is not linked to an assessment.' };
    }

    const due = this.assessment.dueDate ? new Date(this.assessment.dueDate) : null;
    if (due && now < due) {
      return {
        allowed: false,
        userID,
        reason: 'Solution key is only accessible after the assessment deadline.',
        dueDate: this.assessment.dueDate,
      };
    }

    if (!this._isPastRelease(now) && this._state.getName() !== 'released') {
      return {
        allowed: false,
        userID,
        reason: 'Solution key is locked until its release date.',
        releaseDate: this.releaseDate,
      };
    }

    if (this._state.getName() !== 'released') {
      return { allowed: false, userID, reason: 'Solution key has not been released yet.' };
    }

    return { allowed: true, userID };
  }

  downloadSolution(userID) {
    const gate = this.validateAccess(userID);
    if (!gate.allowed) {
      const err = new Error(gate.reason || 'Access denied');
      err.details = gate;
      throw err;
    }
    return this._state.downloadSolution({
      buffer: this.buffer,
      fileName: this.fileName,
      mimeType: this.mimeType,
    });
  }

  getStateName() {
    return this._state.getName();
  }
}

module.exports = { SolutionKey };
