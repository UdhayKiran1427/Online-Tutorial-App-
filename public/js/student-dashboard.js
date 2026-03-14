// Student dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadStudentData();
    loadEnrollments();
    
    // Profile form event listener
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProfileUpdate();
        });
    }
});

function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) {
        showMessage('Please login to access dashboard', 'error');
        window.location.href = '/pages/login.html';
        return;
    }
    
    const user = JSON.parse(loggedInUser);
    if (user.role !== 'student') {
        showMessage('Access denied. Student dashboard only.', 'error');
        window.location.href = '/index.html';
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
    console.log('Loading enrollments for user:', user);
    
    try {
        const response = await fetch('/api/enrollments/student', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        console.log('Enrollments response status:', response.status);
        const result = await response.json();
        console.log('Enrollments API result:', result);
        
        if (result.success) {
            displayEnrollments(result.data);
        } else {
            console.log('Enrollments API failed:', result.message);
            showMessage('Failed to load enrollments', 'error');
        }
    } catch (error) {
        console.error('Error loading enrollments:', error);
        showMessage('Error loading enrollments', 'error');
    }
}

function displayEnrollments(enrollments) {
    console.log('displayEnrollments called with data:', enrollments);
    const enrollmentsTable = document.getElementById('enrollmentsTable');
    if (!enrollmentsTable) {
        console.log('enrollmentsTable not found');
        return;
    }
    
    if (enrollments.length === 0) {
        console.log('No enrollments found');
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
        console.log('Processing enrollment:', enrollment);
        const progress = enrollment.status === 'approved' ? Math.floor(Math.random() * 80) + 10 : 0;
        const statusClass = enrollment.status === 'approved' ? 'status-approved' : 'status-pending';
        const statusText = enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1);
        
        console.log('Enrollment status:', enrollment.status, 'Button will be:', enrollment.status === 'approved' ? 'Continue' : 'Waiting');
        
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
        window.location.href = '/';
    }, 1000);
}

function showProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showMessage('Please login to view profile', 'error');
        return;
    }
    
    // Populate profile form with current user data
    document.getElementById('profileId').value = currentUser.id;
    document.getElementById('profileFullName').value = currentUser.name || currentUser.full_name || '';
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profileCurrentPassword').value = '';
    document.getElementById('profileNewPassword').value = '';
    
    // Show modal
    document.getElementById('profileModal').style.display = 'block';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('profileForm').reset();
}

async function handleProfileUpdate() {
    const formData = new FormData(document.getElementById('profileForm'));
    const profileData = {
        id: parseInt(formData.get('id')),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword')
    };
    
    // Validation
    if (!profileData.fullName || !profileData.email) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (!profileData.currentPassword) {
        showMessage('Please enter your current password to verify your identity', 'error');
        return;
    }
    
    if (profileData.newPassword && profileData.newPassword.length < 6) {
        showMessage('New password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update localStorage with new user data
            const updatedUser = {
                ...currentUser,
                name: profileData.fullName,
                full_name: profileData.fullName,
                email: profileData.email
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Update student name in dashboard
            const studentNameElement = document.getElementById('studentName');
            if (studentNameElement) {
                studentNameElement.textContent = profileData.fullName;
            }
            
            showMessage('Profile updated successfully!', 'success');
            closeProfileModal();
        } else {
            showMessage(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    }
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
