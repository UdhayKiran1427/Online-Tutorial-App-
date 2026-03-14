// Courses page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Let main.js handle initialization and navigation
    // Just run course-specific functionality
    checkLoginStatus();
    loadCourses();
});

function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        if (user.role === 'admin') {
            // Update enroll buttons to "Manage" for admin
            updateButtonsForAdmin();
        }
    }
}

function updateButtonsForAdmin() {
    const enrollButtons = document.querySelectorAll('button[onclick^="enrollCourse"]');
    enrollButtons.forEach(button => {
        button.textContent = 'Manage Course';
        button.setAttribute('onclick', 'manageCourse(this)');
    });
}

async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        const result = await response.json();
        
        if (result.success) {
            displayCourses(result.data);
        } else {
            showMessage('Failed to load courses', 'error');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showMessage('Error loading courses', 'error');
    }
}

async function enrollCourse(courseId) {
    const loggedInUser = localStorage.getItem('currentUser');
    
    if (!loggedInUser) {
        showMessage('Please login to enroll in courses', 'error');
        window.location.href = '/pages/login.html';
        return;
    }
    
    const user = JSON.parse(loggedInUser);
    
    try {
        const response = await fetch('/api/enrollments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                courseId: courseId,
                studentId: user.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Enrollment request sent successfully!', 'success');
            // Update button to show pending status
            const button = document.querySelector(`button[onclick="enrollCourse(${courseId})"]`);
            if (button) {
                button.textContent = 'Pending';
                button.disabled = true;
                button.style.background = '#95a5a6';
            }
        } else {
            showMessage(result.message || 'Failed to enroll', 'error');
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        showMessage('Error enrolling in course', 'error');
    }
}

function manageCourse(button) {
    // This function will be implemented when admin course management is added
    showMessage('Course management feature coming soon!', 'info');
}

function displayCourses(courses) {
    const courseGrid = document.querySelector('.course-grid');
    if (!courseGrid) return;
    
    courseGrid.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-image">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 200px; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                    📚
                </div>
            </div>
            <div class="course-content">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="course-meta">
                    <span>👨‍🏫 ${course.instructor}</span>
                    <span>📚 ${course.modules} modules</span>
                    <span>⏱️ ${course.duration_hours} hours</span>
                </div>
                <button class="btn" style="margin-top: 1rem; width: 100%;" onclick="enrollCourse(${course.id})">Enroll Now</button>
            </div>
        </div>
    `).join('');
    
    // Update buttons for admin users
    checkLoginStatus();
}

function getCourseById(courseId) {
    const courses = {
        1: { name: 'Complete Web Development Bootcamp', modules: 12, hours: 40 },
        2: { name: 'Python for Data Science', modules: 10, hours: 35 },
        3: { name: 'SQL & Database Management', modules: 8, hours: 25 },
        4: { name: 'Modern React Development', modules: 9, hours: 30 },
        5: { name: 'UI/UX Design Fundamentals', modules: 7, hours: 20 },
        6: { name: 'React Native Mobile Apps', modules: 11, hours: 38 }
    };
    return courses[courseId] || { name: 'Unknown Course', modules: 0, hours: 0 };
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
