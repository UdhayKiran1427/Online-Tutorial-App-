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

// Get all enrollments (Admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [enrollments] = await pool.query(`
            SELECT 
                e.id,
                e.student_id,
                e.course_id,
                e.status,
                e.request_date,
                e.approved_date,
                e.rejected_date,
                e.progress_percentage,
                u.full_name as student_name,
                u.email as student_email,
                c.title as course_title
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN courses c ON e.course_id = c.id
            ORDER BY e.request_date DESC
        `);

        res.json({
            success: true,
            data: enrollments
        });

    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching enrollments'
        });
    }
});

// Get enrollments for a specific student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        const [enrollments] = await pool.query(`
            SELECT 
                e.id,
                e.student_id,
                e.course_id,
                e.status,
                e.request_date,
                e.approved_date,
                e.rejected_date,
                e.progress_percentage,
                c.title as course_title,
                c.modules,
                c.duration_hours
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ?
            ORDER BY e.request_date DESC
        `, [studentId]);

        res.json({
            success: true,
            data: enrollments
        });

    } catch (error) {
        console.error('Get student enrollments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student enrollments'
        });
    }
});

// Create new enrollment request (Student only)
router.post('/', authenticateToken, [
    body('studentId').isInt({ min: 1 }).withMessage('Valid student ID required'),
    body('courseId').isInt({ min: 1 }).withMessage('Valid course ID required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { studentId, courseId } = req.body;

        // Check if student exists
        const [students] = await pool.query('SELECT id, role FROM users WHERE id = ?', [studentId]);
        if (students.length === 0 || students[0].role !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'Invalid student'
            });
        }

        // Check if course exists and is active
        const [courses] = await pool.query('SELECT id, title FROM courses WHERE id = ? AND status = "active"', [courseId]);
        if (courses.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or inactive course'
            });
        }

        // Check if already enrolled
        const [existingEnrollments] = await pool.query(
            'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
            [studentId, courseId]
        );

        if (existingEnrollments.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course'
            });
        }

        // Create enrollment request
        const [result] = await pool.query(
            'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, "pending")',
            [studentId, courseId]
        );

        res.status(201).json({
            success: true,
            message: 'Enrollment request sent successfully',
            data: {
                id: result.insertId,
                studentId,
                courseId,
                status: 'pending',
                courseTitle: courses[0].title
            }
        });

    } catch (error) {
        console.error('Create enrollment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating enrollment'
        });
    }
});

// Approve enrollment (Admin only)
router.put('/:id/approve', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const enrollmentId = req.params.id;

        // Check if enrollment exists and is pending
        const [enrollments] = await pool.query(
            'SELECT id FROM enrollments WHERE id = ? AND status = "pending"',
            [enrollmentId]
        );

        if (enrollments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending enrollment not found'
            });
        }

        // Approve enrollment
        const [result] = await pool.query(
            'UPDATE enrollments SET status = "approved", approved_date = CURRENT_TIMESTAMP WHERE id = ?',
            [enrollmentId]
        );

        res.json({
            success: true,
            message: 'Enrollment approved successfully'
        });

    } catch (error) {
        console.error('Approve enrollment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while approving enrollment'
        });
    }
});

// Reject enrollment (Admin only)
router.put('/:id/reject', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const enrollmentId = req.params.id;

        // Check if enrollment exists and is pending
        const [enrollments] = await pool.query(
            'SELECT id FROM enrollments WHERE id = ? AND status = "pending"',
            [enrollmentId]
        );

        if (enrollments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pending enrollment not found'
            });
        }

        // Reject enrollment
        const [result] = await pool.query(
            'UPDATE enrollments SET status = "rejected", rejected_date = CURRENT_TIMESTAMP WHERE id = ?',
            [enrollmentId]
        );

        res.json({
            success: true,
            message: 'Enrollment rejected successfully'
        });

    } catch (error) {
        console.error('Reject enrollment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while rejecting enrollment'
        });
    }
});

// Update enrollment progress
router.put('/:id/progress', [
    body('progressPercentage').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const enrollmentId = req.params.id;
        const { progressPercentage } = req.body;

        // Check if enrollment exists and is approved
        const [enrollments] = await pool.query(
            'SELECT id FROM enrollments WHERE id = ? AND status = "approved"',
            [enrollmentId]
        );

        if (enrollments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Approved enrollment not found'
            });
        }

        // Update progress
        const [result] = await pool.query(
            'UPDATE enrollments SET progress_percentage = ? WHERE id = ?',
            [progressPercentage, enrollmentId]
        );

        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: {
                progressPercentage
            }
        });

    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating progress'
        });
    }
});

module.exports = router;
