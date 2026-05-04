const path = require('path');
const sql = require('mssql');

const config = require(path.join(__dirname, '..', '..', '..', '..', 'dbconfig'));

let poolPromise;

/**
 * Returns a shared connection pool (mssql).
 * Uses the same env-driven config as the main Flexroom backend.
 */
function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(config).catch((err) => {
            poolPromise = null;
            throw err;
        });
    }
    return poolPromise;
}

module.exports = { sql, getPool };
