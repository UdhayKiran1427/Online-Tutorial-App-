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
        const loggedInUser = localStorage.getItem('currentUser');
        let enrollments = [];
        
        // If user is logged in, get their enrollments
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            if (user.role === 'student') {
                try {
                    const enrollmentsResponse = await fetch('/api/enrollments/student', {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    });
                    const enrollmentsResult = await enrollmentsResponse.json();
                    if (enrollmentsResult.success) {
                        enrollments = enrollmentsResult.data;
                    }
                } catch (error) {
                    console.error('Error loading enrollments:', error);
                }
            }
        }
        
        const response = await fetch('/api/courses');
        const result = await response.json();
        
        if (result.success) {
            displayCourses(result.data, enrollments);
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

function manageCourse(courseId) {
    // This function will be implemented when admin course management is added
    showMessage('Course management feature coming soon!', 'info');
}

function continueCourse(courseId) {
    // Redirect to course content page
    window.location.href = `/pages/course-content.html?courseId=${courseId}`;
}

function displayCourses(courses, enrollments = []) {
    console.log('displayCourses called with:', { courses: courses.length, enrollments: enrollments.length });
    const courseGrid = document.querySelector('.course-grid');
    if (!courseGrid) {
        console.log('courseGrid not found');
        return;
    }
    
    courseGrid.innerHTML = courses.map(course => {
        // Check if student is enrolled in this course
        const enrollment = enrollments.find(e => e.course_id === course.id);
        console.log(`Course ${course.id}:`, enrollment ? `enrolled with status ${enrollment.status}` : 'not enrolled');
        
        let buttonHtml = '';
        
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            console.log('User logged in:', user.role);
            
            if (user.role === 'admin') {
                // Admin sees "Manage Course"
                buttonHtml = `<button class="btn" style="margin-top: 1rem; width: 100%;" onclick="manageCourse(${course.id})">Manage Course</button>`;
            } else if (user.role === 'student') {
                if (enrollment) {
                    if (enrollment.status === 'approved') {
                        // Student with approved enrollment sees "Continue"
                        console.log(`Course ${course.id} approved - showing Continue button`);
                        buttonHtml = `<button class="btn" style="margin-top: 1rem; width: 100%; background: #27ae60;" onclick="continueCourse(${course.id})">Continue</button>`;
                    } else if (enrollment.status === 'pending') {
                        // Student with pending enrollment sees "Pending"
                        console.log(`Course ${course.id} pending - showing Pending button`);
                        buttonHtml = `<button class="btn" style="margin-top: 1rem; width: 100%; background: #95a5a6;" disabled>Pending</button>`;
                    } else {
                        // Student with rejected enrollment can enroll again
                        console.log(`Course ${course.id} rejected - showing Enroll button`);
                        buttonHtml = `<button class="btn" style="margin-top: 1rem; width: 100%;" onclick="enrollCourse(${course.id})">Enroll Now</button>`;
                    }
                } else {
                    // Student not enrolled can enroll
                    console.log(`Course ${course.id} not enrolled - showing Enroll button`);
                    buttonHtml = `<button class="btn" style="margin-top: 1rem; width: 100%;" onclick="enrollCourse(${course.id})">Enroll Now</button>`;
                }
            }
        } else {
            // Not logged in sees "Enroll Now" (will redirect to login)
            console.log('User not logged in - showing Enroll button');
            buttonHtml = `<button class="btn" style="margin-top: 1rem; width: 100%;" onclick="enrollCourse(${course.id})">Enroll Now</button>`;
        }
        
        return `
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
                    ${buttonHtml}
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Course display complete');
    // Update buttons for admin users (fallback)
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
