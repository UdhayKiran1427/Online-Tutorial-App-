const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all students (Admin only)
router.get('/students', async (req, res) => {
    try {
        const [students] = await pool.query(`
            SELECT 
                id,
                full_name,
                email,
                registration_date,
                status,
                (SELECT COUNT(*) FROM enrollments WHERE student_id = users.id) as enrollment_count
            FROM users 
            WHERE role = 'student'
            ORDER BY registration_date DESC
        `);

        res.json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching students'
        });
    }
});

// Get student details with enrollments
router.get('/students/:id', async (req, res) => {
    try {
        const studentId = req.params.id;
        
        // Get student details
        const [students] = await pool.query(
            'SELECT id, full_name, email, registration_date, status FROM users WHERE id = ? AND role = "student"',
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get student enrollments
        const [enrollments] = await pool.query(`
            SELECT 
                e.id,
                e.status,
                e.request_date,
                e.approved_date,
                e.progress_percentage,
                c.title as course_title,
                c.modules,
                c.duration_hours
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ?
            ORDER BY e.request_date DESC
        `, [studentId]);

        const student = students[0];
        student.enrollments = enrollments;

        res.json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student details'
        });
    }
});

// Get dashboard statistics (Admin only)
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Get total students
        const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
        
        // Get total courses
        const [courseCount] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = "active"');
        
        // Get pending enrollments
        const [pendingCount] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE status = "pending"');
        
        // Get approved enrollments
        const [approvedCount] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE status = "approved"');

        const stats = {
            totalStudents: studentCount[0].count,
            totalCourses: courseCount[0].count,
            pendingRequests: pendingCount[0].count,
            approvedEnrollments: approvedCount[0].count
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard statistics'
        });
    }
});

// Get student dashboard statistics
router.get('/student/dashboard/stats', async (req, res) => {
    try {
        // This would typically use authentication middleware to get the student ID
        // For now, we'll assume it's passed as a query parameter
        const studentId = req.query.studentId;
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID required'
            });
        }

        // Get student enrollments
        const [enrollments] = await pool.query(`
            SELECT 
                COUNT(*) as total_enrollments,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_enrollments,
                AVG(progress_percentage) as avg_progress
            FROM enrollments 
            WHERE student_id = ?
        `, [studentId]);

        const stats = {
            totalEnrollments: enrollments[0].total_enrollments || 0,
            approvedEnrollments: enrollments[0].approved_enrollments || 0,
            avgProgress: Math.round(enrollments[0].avg_progress || 0)
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get student dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student dashboard statistics'
        });
    }
});

// Deactivate user (Admin only)
router.put('/users/:id/deactivate', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deactivating admin users
        if (users[0].role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate admin users'
            });
        }

        // Deactivate user
        const [result] = await pool.query(
            'UPDATE users SET status = "inactive" WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deactivating user'
        });
    }
});

// Activate user (Admin only)
router.put('/users/:id/activate', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Activate user
        const [result] = await pool.query(
            'UPDATE users SET status = "active" WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'User activated successfully'
        });

    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while activating user'
        });
    }
});

module.exports = router;
