require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const config = require('./dbconfig');
const rateLimit = require('express-rate-limit');
// 1. Import the routes
const gradingRoutes = require('./routes/gradingRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes'); 

// ... other middleware like app.use(express.json()) ...

const app = express();
const PORT = 5000;

// Middleware
// Standard JSON parser for simple requests
app.use(require('cors')()) // This allows the frontend to talk to the backend
app.use(express.json({ limit: '10mb' }));

// 2. Register the routes
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/grading', gradingRoutes); // This will now handle the multipart assessments

// Rate Limiter
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

app.get('/api/message', messageLimiter, async (req, res) => {
    let responseData = {
        backendMsg: "Hello from the Flexroom Backend!",
        sqlMsg: "Loading SQL data..."
    };
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT TOP 1 welcomeMessage FROM Settings");
        if (result.recordset.length > 0) {
            responseData.sqlMsg = result.recordset[0].welcomeMessage;
        } else {
            responseData.sqlMsg = "Settings table is empty.";
        }
    } catch (err) {
        console.error("SQL Error: ", err);
        responseData.sqlMsg = "Database connection failed.";
    }
    res.json(responseData);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});