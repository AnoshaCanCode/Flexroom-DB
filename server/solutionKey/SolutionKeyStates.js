/**
 * State pattern for SolutionKey visibility (Locked vs Released).
 */

class SolutionKeyState {
  getName() {
    return 'base';
  }

  // eslint-disable-next-line no-unused-vars
  downloadSolution(_context) {
    throw new Error('downloadSolution not available in this state');
  }
}

class LockedState extends SolutionKeyState {
  getName() {
    return 'locked';
  }

  downloadSolution() {
    throw new Error('Solution key is locked. It will be available after release.');
  }
}

class ReleasedState extends SolutionKeyState {
  getName() {
    return 'released';
  }

  /**
   * @param {{ buffer: Buffer; fileName: string }} context
   */
  downloadSolution(context) {
    return {
      fileName: context.fileName,
      buffer: context.buffer,
      mimeType: context.mimeType || 'application/octet-stream',
    };
  }
}

module.exports = {
  SolutionKeyState,
  LockedState,
  ReleasedState,
};
