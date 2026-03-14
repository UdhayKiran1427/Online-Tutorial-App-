const express = require('express');
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

// Get all students (Admin only)
router.get('/students', authenticateToken, async (req, res) => {
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
router.get('/students/:id', authenticateToken, async (req, res) => {
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


router.put('/users/:id/deactivate', async (req, res) => {
    try {
        const userId = req.params.id;

       
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

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [users] = await pool.query(
            'SELECT id, full_name, email, role, registration_date, status FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user'
        });
    }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const { fullName, email, password } = req.body;

        // Check if user exists
        const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already used by another user
        if (email) {
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }

        // Build update query
        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        let updateParams = [];
        
        if (fullName) {
            updateQuery += ', full_name = ?';
            updateParams.push(fullName);
        }
        
        if (email) {
            updateQuery += ', email = ?';
            updateParams.push(email);
        }
        
        if (password) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            updateParams.push(hashedPassword);
        }
        
        updateQuery += ' WHERE id = ?';
        updateParams.push(userId);

        await pool.query(updateQuery, updateParams);

        res.json({
            success: true,
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user'
        });
    }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
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

        // Prevent deletion of admin users
        if (users[0].role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Delete user's enrollments first
            await connection.query('DELETE FROM enrollments WHERE student_id = ?', [userId]);
            
            // Delete user
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            
            await connection.commit();
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting user'
        });
    }
});

// Update user profile (authenticated user)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Get user ID from token (corrected from req.user.id)
        const { fullName, email, currentPassword, newPassword } = req.body;

        console.log('Updating profile for user ID:', userId);

        // Check if user exists
        const [users] = await pool.query('SELECT id, password, email FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if email is already used by another user
        if (email && email !== users[0].email) {
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }

        // Build update query
        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        let updateParams = [];
        
        if (fullName) {
            updateQuery += ', full_name = ?';
            updateParams.push(fullName);
        }
        
        if (email) {
            updateQuery += ', email = ?';
            updateParams.push(email);
        }
        
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateQuery += ', password = ?';
            updateParams.push(hashedPassword);
        }
        
        updateQuery += ' WHERE id = ?';
        updateParams.push(userId);

        await pool.query(updateQuery, updateParams);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

module.exports = router;
