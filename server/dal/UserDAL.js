//This file's only job is to execute the Stored Procedures we just made
const { ConnectionManager } = require('../singleton/ConnectionManager');
const sql = require('mssql');

class UserDAL {
    /** Calls sp_SignupUser */
    async createUser(name, email, hashedPassword, role) {
        const pool = await ConnectionManager.getInstance().getPool();
        return await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('Email', sql.NVarChar, email)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('UserRole', sql.NVarChar, role)
            .execute('sp_SignupUser'); 
    }

    /** Calls sp_LoginUser or fetches user by email for AuthService to verify */
    async getUserByEmail(email) {
        const pool = await ConnectionManager.getInstance().getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email'); // Or use a proc if you prefer
        return result.recordset[0];
    }
}

module.exports = new UserDAL();