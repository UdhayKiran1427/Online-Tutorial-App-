const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Get all courses
router.get('/', async (req, res) => {
    try {
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE status = "active" ORDER BY title'
        );

        res.json({
            success: true,
            data: courses
        });

    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching courses'
        });
    }
});

// Get course by ID
router.get('/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE id = ? AND status = "active"',
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: courses[0]
        });

    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching course'
        });
    }
});

// Add new course (Admin only)
router.post('/', authenticateToken, [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('modules').isInt({ min: 1 }).withMessage('Modules must be at least 1'),
    body('durationHours').isInt({ min: 1 }).withMessage('Duration must be at least 1 hour'),
    body('instructor').trim().isLength({ min: 3 }).withMessage('Instructor name must be at least 3 characters'),
    body('link').optional().isURL().withMessage('Link must be a valid URL')
], async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { title, description, modules, durationHours, instructor, link } = req.body;

        const [result] = await pool.query(
            'INSERT INTO courses (title, description, modules, duration_hours, instructor, link) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, modules, durationHours, instructor, link || null]
        );

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: {
                id: result.insertId,
                title,
                description,
                modules,
                duration_hours: durationHours,
                instructor,
                link: link || null
            }
        });

    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating course'
        });
    }
});

// Update course (Admin only)
router.put('/:id', authenticateToken, [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('modules').isInt({ min: 1 }).withMessage('Modules must be at least 1'),
    body('durationHours').isInt({ min: 1 }).withMessage('Duration must be at least 1 hour'),
    body('instructor').trim().isLength({ min: 3 }).withMessage('Instructor name must be at least 3 characters'),
    body('link').optional().isURL().withMessage('Link must be a valid URL')
], async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const courseId = req.params.id;
        const { title, description, modules, durationHours, instructor, link } = req.body;

        // Check if course exists
        const [existingCourses] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
        
        if (existingCourses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const [result] = await pool.query(
            'UPDATE courses SET title = ?, description = ?, modules = ?, duration_hours = ?, instructor = ?, link = ? WHERE id = ?',
            [title, description, modules, durationHours, instructor, link || null, courseId]
        );

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: {
                id: parseInt(courseId),
                title,
                description,
                modules,
                durationHours,
                instructor,
                link: link || null
            }
        });

    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating course'
        });
    }
});

// Delete course (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const courseId = req.params.id;

        // Check if course exists
        const [existingCourses] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
        
        if (existingCourses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Soft delete by setting status to inactive
        const [result] = await pool.query(
            'UPDATE courses SET status = "inactive" WHERE id = ?',
            [courseId]
        );

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });

    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting course'
        });
    }
});

module.exports = router;
