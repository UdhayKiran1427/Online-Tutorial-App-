// Course Content JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadCourseContent();
});

function checkAuthentication() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) {
        showMessage('Please login to access course content', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(loggedInUser);
    if (user.role !== 'student') {
        showMessage('Access denied. Course content only for students.', 'error');
        window.location.href = 'login.html';
        return;
    }
}

function loadCourseContent() {
    // Get course ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    
    if (!courseId) {
        showMessage('Course ID not provided', 'error');
        window.location.href = 'student-dashboard.html';
        return;
    }
    
    // Mock course data - will be replaced with API call
    const courses = {
        1: {
            title: 'Complete Web Development Bootcamp',
            description: 'Learn HTML, CSS, JavaScript, Node.js, and modern web development frameworks from scratch.',
            progress: 45,
            modules: [
                {
                    id: 1,
                    title: 'Introduction to Web Development',
                    lessons: [
                        { id: 1, title: 'What is Web Development?', duration: '15 min', completed: true },
                        { id: 2, title: 'Setting Up Your Environment', duration: '20 min', completed: true },
                        { id: 3, title: 'Basic Web Concepts', duration: '25 min', completed: false }
                    ]
                },
                {
                    id: 2,
                    title: 'HTML Fundamentals',
                    lessons: [
                        { id: 4, title: 'HTML Structure and Tags', duration: '30 min', completed: true },
                        { id: 5, title: 'Forms and Input Elements', duration: '25 min', completed: true },
                        { id: 6, title: 'Semantic HTML5', duration: '20 min', completed: false }
                    ]
                },
                {
                    id: 3,
                    title: 'CSS Styling',
                    lessons: [
                        { id: 7, title: 'CSS Basics and Selectors', duration: '35 min', completed: false },
                        { id: 8, title: 'Layout with Flexbox', duration: '40 min', completed: false },
                        { id: 9, title: 'Responsive Design', duration: '45 min', completed: false }
                    ]
                }
            ]
        },
        2: {
            title: 'Python for Data Science',
            description: 'Master Python programming and data analysis with pandas, NumPy, and machine learning basics.',
            progress: 30,
            modules: [
                {
                    id: 1,
                    title: 'Python Basics',
                    lessons: [
                        { id: 1, title: 'Introduction to Python', duration: '20 min', completed: true },
                        { id: 2, title: 'Variables and Data Types', duration: '25 min', completed: true },
                        { id: 3, title: 'Control Flow', duration: '30 min', completed: false }
                    ]
                },
                {
                    id: 2,
                    title: 'Data Structures',
                    lessons: [
                        { id: 4, title: 'Lists and Tuples', duration: '35 min', completed: false },
                        { id: 5, title: 'Dictionaries and Sets', duration: '30 min', completed: false },
                        { id: 6, title: 'Working with Files', duration: '25 min', completed: false }
                    ]
                }
            ]
        }
    };
    
    const course = courses[courseId];
    if (!course) {
        showMessage('Course not found', 'error');
        window.location.href = 'student-dashboard.html';
        return;
    }
    
    // Update course information
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseDescription').textContent = course.description;
    document.getElementById('courseProgress').style.width = course.progress + '%';
    document.getElementById('progressText').textContent = course.progress + '% Complete';
    
    // Load modules
    loadModules(course.modules);
    
    // Show first module by default
    if (course.modules.length > 0) {
        showModule(course.modules[0]);
    }
}

function loadModules(modules) {
    const modulesList = document.getElementById('modulesList');
    if (!modulesList) return;
    
    modulesList.innerHTML = modules.map((module, index) => `
        <div class="module-item ${index === 0 ? 'active' : ''}" onclick="showModule(${JSON.stringify(module).replace(/"/g, '&quot;')})">
            <strong>Module ${module.id}: ${module.title}</strong>
            <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                ${module.lessons.length} lessons
            </div>
        </div>
    `).join('');
}

function showModule(module) {
    // Update active module in sidebar
    document.querySelectorAll('.module-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.module-item').classList.add('active');
    
    // Show module content
    const moduleContent = document.getElementById('moduleContent');
    if (!moduleContent) return;
    
    moduleContent.innerHTML = `
        <h2>Module ${module.id}: ${module.title}</h2>
        <div style="margin: 2rem 0;">
            <h3>Lessons</h3>
            ${module.lessons.map(lesson => `
                <div class="lesson-item">
                    <div>
                        <strong>${lesson.title}</strong>
                        <div style="font-size: 0.875rem; color: #666;">Duration: ${lesson.duration}</div>
                    </div>
                    <div>
                        <span class="lesson-status ${lesson.completed ? 'completed' : ''}">
                            ${lesson.completed ? '✅ Completed' : '⏳ Not Started'}
                        </span>
                        <button class="btn" style="padding: 5px 10px; margin-left: 1rem; font-size: 0.875rem;" onclick="startLesson(${lesson.id})">
                            ${lesson.completed ? 'Review' : 'Start'}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function startLesson(lessonId) {
    // This function will open the actual lesson content
    // For now, we'll show a message
    showMessage(`Starting lesson ${lessonId}...`, 'info');
    
    // In a real implementation, this would:
    // 1. Load lesson content (video, text, exercises)
    // 2. Track progress
    // 3. Mark as completed when finished
    
    // Mock lesson content
    const moduleContent = document.getElementById('moduleContent');
    if (moduleContent) {
        moduleContent.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h2>Lesson Content</h2>
                <p style="margin: 2rem 0; color: #666;">This is where the lesson content would be displayed.</p>
                <div style="background: #f8f9fa; padding: 2rem; border-radius: 10px; margin: 2rem 0;">
                    <h3>Lesson Features:</h3>
                    <ul style="text-align: left; max-width: 500px; margin: 0 auto;">
                        <li>📹 Video lectures</li>
                        <li>📝 Reading materials</li>
                        <li>💻 Interactive coding exercises</li>
                        <li>📊 Progress tracking</li>
                        <li>✅ Quizzes and assessments</li>
                    </ul>
                </div>
                <button class="btn" onclick="loadCourseContent()">Back to Course</button>
            </div>
        `;
    }
}

function completeLesson(lessonId) {
    // Mark lesson as completed
    // This would update the database in a real implementation
    showMessage('Lesson marked as completed!', 'success');
    
    // Reload course content to update progress
    loadCourseContent();
}

function logout() {
    localStorage.removeItem('currentUser');
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// Helper function to show messages
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}
