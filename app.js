const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const corsOptions = {
    origin: '*',
    credentials: false,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ]
};

app.use(cors(corsOptions));
app.use(express.json(
    { limit: '50mb' }
));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((err, req, res, next) => {
    // Set CORS headers on error responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    
    if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({ message: 'Only PDF files are allowed' });
    }
    
    res.status(500).json({ message: err.message });
});



app.use('/api/', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/analysis-results', require('./routes/analysis_result_routes'));
app.use('/api/app-settings', require('./routes/app_setting.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
