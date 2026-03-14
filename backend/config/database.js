const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tutorial_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Initialize database and create tables
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.changeUser({ database: dbConfig.database });
        
        // Create users table
        await connection.query(`
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
            )
        `);
        
        // Create courses table
        await connection.query(`
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
            )
        `);
        
        // Create enrollments table
        await connection.query(`
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
            )
        `);
        
        const [courseCount] = await connection.query('SELECT COUNT(*) as count FROM courses');
        if (courseCount[0].count === 0) {
            await connection.query(`
                INSERT INTO courses (title, description, modules, duration_hours, instructor) VALUES
                ('Complete Web Development Bootcamp', 'Learn HTML, CSS, JavaScript, Node.js, and modern web development frameworks from scratch.', 12, 40, 'John Doe'),
                ('Python for Data Science', 'Master Python programming and data analysis with pandas, NumPy, and machine learning basics.', 10, 35, 'Jane Smith'),
                ('SQL & Database Management', 'Learn database design, SQL queries, and database administration with MySQL and PostgreSQL.', 8, 25, 'Mike Johnson'),
                ('Modern React Development', 'Build modern web applications with React, Redux, hooks, and the latest React ecosystem.', 9, 30, 'Sarah Wilson'),
                ('UI/UX Design Fundamentals', 'Learn user interface and user experience design principles with Figma and modern design tools.', 7, 20, 'Emily Brown'),
                ('React Native Mobile Apps', 'Build cross-platform mobile applications for iOS and Android using React Native.', 11, 38, 'David Lee')
            `);
            console.log('📚 Sample courses inserted');
        }
        
        connection.release();
        console.log('🗄️ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase
};
