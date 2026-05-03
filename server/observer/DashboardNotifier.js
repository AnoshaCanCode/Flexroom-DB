/**
 * Observer pattern: notify subscribers when autograding completes
 * so student dashboards (or future websocket layer) can refresh.
 */

/** @typedef {{ assessmentId: string; studentId: string; summary: object; at: string }} AutogradeCompleteEvent */

class StudentDashboardObserver {
  /** @param {string} studentId */
  constructor(studentId) {
    this.studentId = studentId;
    /** @type {AutogradeCompleteEvent[]} */
    this.inbox = [];
  }

  /**
   * @param {AutogradeCompleteEvent} event
   */
  onAutogradeComplete(event) {
    if (event.studentId === this.studentId) {
      this.inbox.push(event);
    }
  }

  getNotifications() {
    return [...this.inbox];
  }
}

class AutogradeSubject {
  constructor() {
    /** @type {Set<StudentDashboardObserver>} */
    this._observers = new Set();
  }

  /** @param {StudentDashboardObserver} observer */
  subscribe(observer) {
    this._observers.add(observer);
  }

  /** @param {StudentDashboardObserver} observer */
  unsubscribe(observer) {
    this._observers.delete(observer);
  }

  /**
   * @param {AutogradeCompleteEvent} event
   */
  notifyAutogradeComplete(event) {
    for (const observer of this._observers) {
      observer.onAutogradeComplete(event);
    }
  }
}

/** Process-wide subject (could be moved behind ConnectionManager if you prefer one mega-singleton). */
const globalAutogradeSubject = new AutogradeSubject();

module.exports = {
  StudentDashboardObserver,
  AutogradeSubject,
  globalAutogradeSubject,
};
