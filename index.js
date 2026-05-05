require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const config = require('./dbconfig');
const rateLimit = require('express-rate-limit');
const gradingRoutes = require('./routes/gradingRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');

if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Set it in .env for production.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(require('cors')());

app.use('/api/users', userRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/files', fileRoutes);

/** Single source of truth for deadline comparisons (ISO timestamp) */
app.get('/api/time', (req, res) => {
    res.json({ currentTime: new Date().toISOString() });
});

const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

app.get('/api/message', messageLimiter, async (req, res) => {
    const responseData = {
        backendMsg: 'Hello from the Flexroom Backend!',
        sqlMsg: 'Loading SQL data...',
    };
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT TOP 1 welcomeMessage FROM Settings');
        if (result.recordset.length > 0) {
            responseData.sqlMsg = result.recordset[0].welcomeMessage;
        } else {
            responseData.sqlMsg = 'Settings table is empty.';
        }
    } catch (err) {
        console.error('SQL Error: ', err);
        responseData.sqlMsg = 'Database connection failed.';
    }
    res.json(responseData);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
