const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ConnectionManager } = require('./ConnectionManager');
const sql = require('mssql');

class AuthService {
    static #instance = null;

    static getInstance() {
        if (!AuthService.#instance) AuthService.#instance = new AuthService();
        return AuthService.#instance;
    }

    /** Hash password for registration */
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    /** Login & Generate JWT */
    async login(email, password) {
        const pool = await ConnectionManager.getInstance().getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        const user = result.recordset[0];
        if (!user) throw new Error('User not found');

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) throw new Error('Invalid credentials');

        // Sign the token with their Role
        const token = jwt.sign(
            { userId: user.UserID, role: user.UserRole, name: user.Name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return { token, user: { id: user.UserID, name: user.Name, role: user.UserRole } };
    }

    /** Middleware: Verify JWT and Role */
    authorize(roles = []) {
        return (req, res, next) => {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'Access denied' });

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;

                if (roles.length && !roles.includes(decoded.role)) {
                    return res.status(403).json({ error: 'Unauthorized role' });
                }
                next();
            } catch (err) {
                res.status(401).json({ error: 'Invalid token' });
            }
        };
    }
}

module.exports = { AuthService };