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

    /** Fetches user by email for AuthService to verify */
    async getUserByEmail(email) {
        const pool = await ConnectionManager.getInstance().getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');
        return result.recordset[0];
    }

    /** Create a new class in the DB (Mapping to your IDENTITY(1,1) schema) */
    async createClass(className, classCode, date) {
        try {
            const pool = await ConnectionManager.getInstance().getPool();
            
            return await pool.request()
                .input('className', sql.NVarChar, className)
                .input('classCode', sql.Int, classCode)
                .input('genDate', sql.NVarChar, date)
                .query(`
                    INSERT INTO CourseClass (className, classCode, generatedDate, numStudents) 
                    VALUES (@className, @classCode, @genDate, 0)
                `);
        } catch (err) {
            console.error("SQL Error in createClass:", err.message);
            throw err;
        }
    }

    /** Fetch all classes */
    async getAllClasses() {
        try {
            const pool = await ConnectionManager.getInstance().getPool();
            const result = await pool.request().query('SELECT * FROM CourseClass');
            return result.recordset;
        } catch (err) {
            console.error("SQL Error in getAllClasses:", err.message);
            throw err;
        }
    }

    async enrollStudentInClass(userId, classId) {
        try {
            const pool = await ConnectionManager.getInstance().getPool();
            
            // 1. Insert the enrollment record
            await pool.request()
                .input('uid', sql.Int, userId)
                .input('cid', sql.Int, classId)
                .query(`
                    INSERT INTO StudentClasses (userID, classID) 
                    VALUES (@uid, @cid)
                `);
    
            // 2. Update the student count in the main class table
            await pool.request()
                .input('cid', sql.Int, classId)
                .query(`
                    UPDATE CourseClass 
                    SET numStudents = numStudents + 1 
                    WHERE classID = @cid
                `);
                
            return true;
        } catch (err) {
            if (err.message.includes('UQ_Student_Class')) {
                throw new Error("You are already enrolled in this class.");
            }
            throw err;
        }
    }

    async getStudentClasses(userId) {
        const pool = await ConnectionManager.getInstance().getPool();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT c.* FROM CourseClass c
                JOIN StudentClasses sc ON c.classID = sc.classID
                WHERE sc.userID = @uid
            `);
        return result.recordset;
    }

    
}

module.exports = new UserDAL();