// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadStudentData();
    loadEnrollments();
});

function checkAuthentication() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) {
        showMessage('Please login to access dashboard', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(loggedInUser);
    if (user.role !== 'student') {
        showMessage('Access denied. Student dashboard only.', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Update student name
    const studentNameElement = document.getElementById('studentName');
    if (studentNameElement) {
        studentNameElement.textContent = user.name;
    }
}

function loadStudentData() {
    // Load student-specific data
    // This will be enhanced when backend is connected
    console.log('Loading student data...');
}

async function loadEnrollments() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) return;
    
    const user = JSON.parse(loggedInUser);
    
    try {
        const response = await fetch('/api/enrollments/student', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayEnrollments(result.data);
        } else {
            showMessage('Failed to load enrollments', 'error');
        }
    } catch (error) {
        console.error('Error loading enrollments:', error);
        showMessage('Error loading enrollments', 'error');
    }
}

function displayEnrollments(enrollments) {
    const enrollmentsTable = document.getElementById('enrollmentsTable');
    if (!enrollmentsTable) return;
    
    if (enrollments.length === 0) {
        enrollmentsTable.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem;">
                    You haven't enrolled in any courses yet. 
                    <a href="/pages/courses.html" style="color: #667eea;">Browse Courses</a>
                </td>
            </tr>
        `;
        return;
    }
    
    enrollmentsTable.innerHTML = enrollments.map(enrollment => {
        const progress = enrollment.status === 'approved' ? Math.floor(Math.random() * 80) + 10 : 0;
        const statusClass = enrollment.status === 'approved' ? 'status-approved' : 'status-pending';
        const statusText = enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1);
        
        return `
            <tr>
                <td>${enrollment.course_title || 'Course'}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>${progress}%</td>
                <td>
                    ${enrollment.status === 'approved' 
                        ? `<button class="btn" style="padding: 5px 10px; font-size: 0.875rem;" onclick="continueCourse(${enrollment.course_id})">Continue</button>`
                        : `<button class="btn" style="padding: 5px 10px; font-size: 0.875rem;" disabled>Waiting</button>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function continueCourse(courseId) {
    // Redirect to course content page
    window.location.href = `/pages/course-content.html?courseId=${courseId}`;
}

function logout() {
    localStorage.removeItem('currentUser');
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/index.html';
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

// Update dashboard stats
function updateDashboardStats() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) return;
    
    const user = JSON.parse(loggedInUser);
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    const studentEnrollments = enrollments.filter(e => e.studentEmail === user.email);
    
    // Update stats (mock data for now)
    const stats = {
        totalEnrollments: studentEnrollments.length,
        approvedEnrollments: studentEnrollments.filter(e => e.status === 'approved').length,
        hoursLearned: Math.floor(Math.random() * 50) + 10,
        modulesCompleted: Math.floor(Math.random() * 20) + 5
    };
    
    // Update DOM elements if they exist
    const hoursElement = document.querySelector('.dashboard-card:nth-child(3) div:first-child');
    const modulesElement = document.querySelector('.dashboard-card:nth-child(3) div:nth-child(2)');
    
    if (hoursElement) hoursElement.textContent = stats.hoursLearned;
    if (modulesElement) modulesElement.textContent = stats.modulesCompleted;
}
