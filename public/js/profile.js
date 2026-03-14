// Profile page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadProfileData();
    setupEventListeners();
    updateNavigation();
});

function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) {
        showMessage('Please login to access profile', 'error');
        window.location.href = '/pages/login.html';
        return;
    }
    
    const user = JSON.parse(loggedInUser);
    if (!user || !user.role) {
        showMessage('Invalid user session', 'error');
        window.location.href = '/pages/login.html';
        return;
    }
}

function updateNavigation() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role) {
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) {
            if (currentUser.role === 'admin') {
                dashboardLink.href = '/pages/admin-dashboard.html';
            } else {
                dashboardLink.href = '/pages/student-dashboard.html';
            }
        }
    }
}

function setupEventListeners() {
    // Edit profile form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEditProfile();
        });
    }

    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleChangePassword();
        });
    }
}

async function loadProfileData() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Display basic profile information
        displayProfileInfo(currentUser);
        
        // Load additional data based on user role
        if (currentUser.role === 'student') {
            await loadStudentStatistics();
            await loadRecentActivity();
        } else if (currentUser.role === 'admin') {
            await loadAdminStatistics();
        }
        
    } catch (error) {
        console.error('Error loading profile data:', error);
        showMessage('Error loading profile data', 'error');
    }
}

function displayProfileInfo(user) {
    // Basic information
    document.getElementById('profileFullName').textContent = user.name || user.full_name || 'Not set';
    document.getElementById('profileEmail').textContent = user.email || 'Not set';
    document.getElementById('profileRole').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Not set';
    
    // Registration date
    const registrationDate = user.registration_date || user.created_at;
    if (registrationDate) {
        const date = new Date(registrationDate);
        document.getElementById('profileRegistrationDate').textContent = date.toLocaleDateString();
    } else {
        document.getElementById('profileRegistrationDate').textContent = 'Not available';
    }
    
    // Status
    const statusElement = document.getElementById('profileStatus');
    const accountStatusElement = document.getElementById('accountStatus');
    const status = user.status || 'active';
    
    if (status === 'active') {
        statusElement.className = 'status status-approved';
        statusElement.textContent = 'Active';
        accountStatusElement.className = 'status status-approved';
        accountStatusElement.textContent = 'Active';
    } else {
        statusElement.className = 'status status-rejected';
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        accountStatusElement.className = 'status status-rejected';
        accountStatusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

async function loadStudentStatistics() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/enrollments/student', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const enrollments = result.data;
            const enrolledCourses = enrollments.length;
            const completedCourses = enrollments.filter(e => e.status === 'completed' || e.progress_percentage === 100).length;
            const totalProgress = enrolledCourses > 0 
                ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrolledCourses)
                : 0;
            
            document.getElementById('enrolledCourses').textContent = enrolledCourses;
            document.getElementById('completedCourses').textContent = completedCourses;
            document.getElementById('totalProgress').textContent = totalProgress + '%';
        }
    } catch (error) {
        console.error('Error loading student statistics:', error);
        document.getElementById('enrolledCourses').textContent = '0';
        document.getElementById('completedCourses').textContent = '0';
        document.getElementById('totalProgress').textContent = '0%';
    }
}

async function loadAdminStatistics() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Load course statistics
        const coursesResponse = await fetch('/api/courses', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const coursesResult = await coursesResponse.json();
        
        // Load student statistics
        const studentsResponse = await fetch('/api/users/students', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const studentsResult = await studentsResponse.json();
        
        if (coursesResult.success && studentsResult.success) {
            document.getElementById('enrolledCourses').textContent = coursesResult.data.length;
            document.getElementById('completedCourses').textContent = studentsResult.data.length;
            document.getElementById('totalProgress').textContent = 'Admin';
        }
    } catch (error) {
        console.error('Error loading admin statistics:', error);
        document.getElementById('enrolledCourses').textContent = '0';
        document.getElementById('completedCourses').textContent = '0';
        document.getElementById('totalProgress').textContent = '0%';
    }
}

async function loadRecentActivity() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/enrollments/student', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const enrollments = result.data.slice(0, 5); // Show last 5 activities
            const activityContainer = document.getElementById('recentActivity');
            
            if (enrollments.length === 0) {
                activityContainer.innerHTML = '<p style="text-align: center; color: #666;">No recent activity</p>';
                return;
            }
            
            activityContainer.innerHTML = enrollments.map(enrollment => {
                const statusClass = enrollment.status === 'approved' ? 'status-approved' : 
                                  enrollment.status === 'pending' ? 'status-pending' : 'status-rejected';
                const requestDate = new Date(enrollment.request_date).toLocaleDateString();
                
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
                        <div>
                            <strong>${enrollment.course_title}</strong>
                            <div style="font-size: 0.9rem; color: #666;">Enrolled on ${requestDate}</div>
                        </div>
                        <div style="text-align: right;">
                            <span class="status ${statusClass}">${enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}</span>
                            <div style="font-size: 0.9rem; color: #666;">Progress: ${enrollment.progress_percentage || 0}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = '<p style="text-align: center; color: #666;">Unable to load recent activity</p>';
    }
}

function showEditProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Populate edit form with current data
    document.getElementById('editFullName').value = currentUser.name || currentUser.full_name || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editCurrentPassword').value = ''; // Clear password field
    
    // Show modal
    document.getElementById('editProfileModal').style.display = 'block';
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
    document.getElementById('editProfileForm').reset();
}

async function handleEditProfile() {
    const formData = new FormData(document.getElementById('editProfileForm'));
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    console.log('Current user from localStorage:', currentUser);
    
    const profileData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        currentPassword: formData.get('currentPassword')
    };
    
    console.log('Profile data being sent:', profileData);
    
    // Validation
    if (!profileData.fullName || !profileData.email) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (!profileData.currentPassword) {
        showMessage('Please enter your current password to verify your identity', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({
                ...profileData,
                newPassword: '' // Empty for profile info update (no password change)
            })
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.success) {
            // Update localStorage with new user data
            const updatedUser = {
                ...currentUser,
                name: profileData.fullName,
                full_name: profileData.fullName,
                email: profileData.email
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Update displayed information
            displayProfileInfo(updatedUser);
            
            showMessage('Profile updated successfully!', 'success');
            closeEditProfileModal();
        } else {
            showMessage(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    }
}

function showChangePassword() {
    document.getElementById('changePasswordModal').style.display = 'block';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

async function handleChangePassword() {
    const formData = new FormData(document.getElementById('changePasswordForm'));
    const passwordData = {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showMessage('Please fill in all password fields', 'error');
        return;
    }
    
    if (passwordData.newPassword.length < 6) {
        showMessage('New password must be at least 6 characters', 'error');
        return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        showMessage('New passwords do not match', 'error');
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
            body: JSON.stringify({
                id: currentUser.id,
                fullName: currentUser.name || currentUser.full_name,
                email: currentUser.email,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Password changed successfully!', 'success');
            closeChangePasswordModal();
        } else {
            showMessage(result.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('Error changing password', 'error');
    }
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
