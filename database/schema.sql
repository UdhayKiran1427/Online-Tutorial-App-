-- Online Tutorial Platform Database Schema
-- MySQL Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS tutorial_platform;
USE tutorial_platform;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    modules INT DEFAULT 0,
    duration_hours INT DEFAULT 0,
    instructor VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL,
    rejected_date TIMESTAMP NULL,
    progress_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- Insert sample courses
INSERT INTO courses (title, description, modules, duration_hours, instructor) VALUES
('Complete Web Development Bootcamp', 'Learn HTML, CSS, JavaScript, Node.js, and modern web development frameworks from scratch.', 12, 40, 'John Doe'),
('Python for Data Science', 'Master Python programming and data analysis with pandas, NumPy, and machine learning basics.', 10, 35, 'Jane Smith'),
('SQL & Database Management', 'Learn database design, SQL queries, and database administration with MySQL and PostgreSQL.', 8, 25, 'Mike Johnson'),
('Modern React Development', 'Build modern web applications with React, Redux, hooks, and the latest React ecosystem.', 9, 30, 'Sarah Wilson'),
('UI/UX Design Fundamentals', 'Learn user interface and user experience design principles with Figma and modern design tools.', 7, 20, 'Emily Brown'),
('React Native Mobile Apps', 'Build cross-platform mobile applications for iOS and Android using React Native.', 11, 38, 'David Lee');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Create a default admin user (password: admin123)
-- Note: In production, you should hash this password properly
INSERT INTO users (full_name, email, password, role) VALUES
('System Administrator', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Create a sample student user (password: student123)
INSERT INTO users (full_name, email, password, role) VALUES
('John Student', 'student@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');
