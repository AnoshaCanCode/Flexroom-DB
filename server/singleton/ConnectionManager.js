/**
 * Singleton: single shared access point for database pool configuration
 * and filesystem roots used by uploads / temp compilation (FlexRoom).
 */
const path = require('path');
const fs = require('fs');
const sql = require('mssql');
const dbConfig = require('../../dbconfig');

class ConnectionManager {
  /** @type {ConnectionManager | null} */
  static #instance = null;

  /** @type {import('mssql').ConnectionPool | null} */
  #pool = null;

  /** @type {string} */
  #uploadRoot;

  /** @type {string} */
  #tempRoot;

  constructor() {
    this.#uploadRoot = path.join(process.cwd(), 'uploads');
    this.#tempRoot = path.join(process.cwd(), 'uploads', 'tmp');
    this.#ensureDirs();
  }

  static getInstance() {
    if (!ConnectionManager.#instance) {
      ConnectionManager.#instance = new ConnectionManager();
    }
    return ConnectionManager.#instance;
  }

  #ensureDirs() {
    for (const dir of [this.#uploadRoot, this.#tempRoot]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Lazy SQL Server pool (mssql). Callers should try/catch — DB may be offline in dev.
   * @returns {Promise<import('mssql').ConnectionPool>}
   */
  async getPool() {
    if (this.#pool && this.#pool.connected) {
      return this.#pool;
    }
    this.#pool = await sql.connect(dbConfig);
    return this.#pool;
  }

  /** Root directory for persisted uploads (submissions, keys). */
  getUploadRoot() {
    return this.#uploadRoot;
  }

  /** Temp directory for C++ compile/run artifacts. */
  getTempRoot() {
    return this.#tempRoot;
  }

  /**
   * Optional: resolve path under upload root safely.
   * @param {string} relativePath
   */
  resolveUploadPath(relativePath) {
    const resolved = path.resolve(this.#uploadRoot, relativePath);
    if (!resolved.startsWith(path.resolve(this.#uploadRoot))) {
      throw new Error('Invalid upload path');
    }
    return resolved;
  }
}

module.exports = { ConnectionManager };
