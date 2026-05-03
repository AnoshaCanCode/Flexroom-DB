const express = require('express'); // 1. Load Express
const sql = require('mssql');       // 2. Load SQL Driver
const config = require('./dbconfig'); // 3. Load your DB Config
const rateLimit = require('express-rate-limit');
const gradingRoutes = require('./routes/gradingRoutes');

const app = express();               // 4. THIS IS THE MISSING LINE
const PORT = 5000;

app.use(express.json({ limit: '10mb' }));
app.use('/api/grading', gradingRoutes);

// Configure rate limiter for /api/message route
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

// NOW you can define your routes
// index.js (Main folder)

app.get('/api/message', messageLimiter, async (req, res) => {
    let responseData = {
        backendMsg: "Hello from the Flexroom Backend!",
        sqlMsg: "Loading SQL data..."
    };

    try {
        let pool = await sql.connect(config);
        
        // CHANGE: query 'Settings' instead of 'USERS'
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