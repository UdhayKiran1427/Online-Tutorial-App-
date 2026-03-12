const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use(express.static(path.join(__dirname, 'public'))); // Also serve from root

// Import routes
const authRoutes = require('./backend/routes/auth');
const courseRoutes = require('./backend/routes/courses');
const enrollmentRoutes = require('./backend/routes/enrollments');
const userRoutes = require('./backend/routes/users');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'pages', page);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Page not found');
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Initialize database and create tables
const { initializeDatabase, testConnection } = require('./backend/config/database');

// Test database connection and initialize tables
testConnection().then(() => {
    initializeDatabase().then(() => {
        console.log('🗄️ Database initialized successfully');
    }).catch(err => {
        console.error('❌ Database initialization failed:', err);
    });
}).catch(err => {
    console.error('❌ Database connection failed:', err);
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});

module.exports = app;
