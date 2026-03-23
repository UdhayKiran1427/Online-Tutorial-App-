// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadDashboardData();
    loadEnrollmentRequests();
    loadStudents();
    
    // Setup form event listeners
    setupCourseForms();
});

// URL validation helper function
function isValidUrl(string) {
    if (!string || string.trim() === '') {
        return true; // Empty string is valid (optional field)
    }
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function setupCourseForms() {
    // Add course form
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddCourse();
        });
    }
    
    // Edit course form
    const editCourseForm = document.getElementById('editCourseForm');
    if (editCourseForm) {
        editCourseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEditCourse();
        });
    }

    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProfileUpdate();
        });
    }
}

async function handleAddCourse() {
    const formData = new FormData(document.getElementById('addCourseForm'));
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        instructor: formData.get('instructor'),
        modules: parseInt(formData.get('modules')),
        durationHours: parseInt(formData.get('durationHours')),
        link: formData.get('link') || null
    };
    
    // Validation
    if (!courseData.title || !courseData.description || !courseData.instructor) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (courseData.modules < 1 || courseData.durationHours < 1) {
        showMessage('Modules and duration must be positive numbers', 'error');
        return;
    }
    
    // Validate URL if provided
    if (courseData.link && !isValidUrl(courseData.link)) {
        showMessage('Please enter a valid URL for the course link', 'error');
        return;
    }
    
    try {
        // Get auth token
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.token) {
            showMessage('Please login to add courses', 'error');
            return;
        }
        
        // Make API call to backend
        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(courseData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Course added successfully!', 'success');
            closeAddCourseModal();
            loadCoursesForManagement();
            loadDashboardData();
        } else {
            showMessage(result.message || 'Failed to add course', 'error');
        }
    } catch (error) {
        console.error('Error adding course:', error);
        showMessage('Failed to add course. Please try again.', 'error');
    }
}

async function handleEditCourse() {
    const formData = new FormData(document.getElementById('editCourseForm'));
    const courseData = {
        id: parseInt(formData.get('id')),
        title: formData.get('title'),
        description: formData.get('description'),
        instructor: formData.get('instructor'),
        modules: parseInt(formData.get('modules')),
        durationHours: parseInt(formData.get('durationHours')),
        link: formData.get('link') || null
    };
    
    // Validation
    if (!courseData.title || !courseData.description || !courseData.instructor) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (courseData.modules < 1 || courseData.durationHours < 1) {
        showMessage('Modules and duration must be positive numbers', 'error');
        return;
    }
    
    // Validate URL if provided
    if (courseData.link && !isValidUrl(courseData.link)) {
        showMessage('Please enter a valid URL for the course link', 'error');
        return;
    }
    
    try {
        // Get auth token
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.token) {
            showMessage('Please login to update courses', 'error');
            return;
        }
        
        // Make API call to backend
        const response = await fetch(`/api/courses/${courseData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(courseData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Course updated successfully!', 'success');
            closeEditCourseModal();
            loadCoursesForManagement();
        } else {
            showMessage(result.message || 'Failed to update course', 'error');
        }
    } catch (error) {
        console.error('Error updating course:', error);
        showMessage('Failed to update course. Please try again.', 'error');
    }
}

function checkAuthentication() {
    const loggedInUser = localStorage.getItem('currentUser');
    if (!loggedInUser) {
        showMessage('Please login to access dashboard', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const user = JSON.parse(loggedInUser);
    if (user.role !== 'admin') {
        showMessage('Access denied. Admin dashboard only.', 'error');
        window.location.href = 'login.html';
        return;
    }
}

async function loadDashboardData() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Load students count from API
        const studentsResponse = await fetch('/api/users/students', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        const studentsResult = await studentsResponse.json();
        const students = studentsResult.success ? studentsResult.data : [];
        
        // Load enrollments from API
        const enrollmentsResponse = await fetch('/api/enrollments', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        const enrollmentsResult = await enrollmentsResponse.json();
        const enrollments = enrollmentsResult.success ? enrollmentsResult.data : [];
        
        // Load courses from API
        const coursesResponse = await fetch('/api/courses', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        const coursesResult = await coursesResponse.json();
        const courses = coursesResult.success ? coursesResult.data : [];
        
        const pendingRequests = enrollments.filter(e => e.status === 'pending');
        const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
        
        // Update dashboard stats
        updateDashboardStats({
            totalStudents: students.length,
            totalCourses: courses.length,
            pendingRequests: pendingRequests.length,
            approvedEnrollments: approvedEnrollments.length
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to localStorage if API fails
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        
        const students = users.filter(u => u.role === 'student');
        const pendingRequests = enrollments.filter(e => e.status === 'pending');
        const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
        
        updateDashboardStats({
            totalStudents: students.length,
            totalCourses: 6, // Fallback count
            pendingRequests: pendingRequests.length,
            approvedEnrollments: approvedEnrollments.length
        });
    }
}

function updateDashboardStats(stats) {
    // Update dashboard statistics
    const elements = {
        totalStudents: document.querySelector('.dashboard-card:nth-child(1) div:first-child'),
        totalCourses: document.querySelector('.dashboard-card:nth-child(2) div:first-child'),
        pendingRequests: document.querySelector('.dashboard-card:nth-child(3) div:first-child'),
        approvedEnrollments: document.querySelector('.dashboard-card:nth-child(4) div:first-child')
    };
    
    if (elements.totalStudents) elements.totalStudents.textContent = stats.totalStudents;
    if (elements.totalCourses) elements.totalCourses.textContent = stats.totalCourses;
    if (elements.pendingRequests) elements.pendingRequests.textContent = stats.pendingRequests;
    if (elements.approvedEnrollments) elements.approvedEnrollments.textContent = stats.approvedEnrollments;
}

async function loadEnrollmentRequests() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/enrollments', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayEnrollmentRequests(result.data);
        } else {
            showMessage('Failed to load enrollment requests', 'error');
        }
    } catch (error) {
        console.error('Error loading enrollment requests:', error);
        showMessage('Error loading enrollment requests', 'error');
    }
}

function displayEnrollmentRequests(enrollments) {
    const requestsTable = document.getElementById('enrollmentRequests');
    
    if (!requestsTable) return;
    
    const pendingRequests = enrollments.filter(e => e.status === 'pending');
    const approvedRequests = enrollments.filter(e => e.status === 'approved').slice(0, 2); // Show some approved
    
    const allRequests = [...pendingRequests, ...approvedRequests];
    
    if (allRequests.length === 0) {
        requestsTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    No enrollment requests found.
                </td>
            </tr>
        `;
        return;
    }
    
    requestsTable.innerHTML = allRequests.map(request => {
        const statusClass = request.status === 'approved' ? 'status-approved' : 'status-pending';
        const statusText = request.status.charAt(0).toUpperCase() + request.status.slice(1);
        const requestDate = new Date(request.request_date).toLocaleDateString();
        
        return `
            <tr id="request-${request.id}">
                <td>${request.student_name || 'Student'}</td>
                <td>${request.student_email || 'student@example.com'}</td>
                <td>${request.course_title || 'Course'}</td>
                <td>${requestDate}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    ${request.status === 'pending' 
                        ? `
                            <button class="btn" style="padding: 5px 10px; margin-right: 5px; font-size: 0.875rem; background: #27ae60;" onclick="approveEnrollment(${request.id})">Approve</button>
                            <button class="btn" style="padding: 5px 10px; font-size: 0.875rem; background: #e74c3c;" onclick="rejectEnrollment(${request.id})">Reject</button>
                        `
                        : `<span style="color: #27ae60; font-weight: bold;">Approved</span>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function loadStudents() {
    // This function is now handled by loadStudentsForManagement() which uses API
    // Keeping this for backward compatibility
    loadStudentsForManagement();
}

async function approveEnrollment(requestId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch(`/api/enrollments/${requestId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Enrollment approved successfully!', 'success');
            loadEnrollmentRequests();
            loadDashboardData();
        } else {
            showMessage(result.message || 'Failed to approve enrollment', 'error');
        }
    } catch (error) {
        console.error('Error approving enrollment:', error);
        showMessage('Error approving enrollment', 'error');
    }
}

async function rejectEnrollment(requestId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch(`/api/enrollments/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Enrollment rejected successfully!', 'success');
            loadEnrollmentRequests();
            loadDashboardData();
        } else {
            showMessage(result.message || 'Failed to reject enrollment', 'error');
        }
    } catch (error) {
        console.error('Error rejecting enrollment:', error);
        showMessage('Error rejecting enrollment', 'error');
    }
}

function viewStudentDetails(studentId) {
    // This function will show detailed student information
    showMessage(`Student details for ID: ${studentId} - Feature coming soon!`, 'info');
}

function viewStudents() {
    // Hide other sections and show student management
    const courseManagementSection = document.getElementById('courseManagementSection');
    const studentManagementSection = document.getElementById('studentManagementSection');
    
    if (courseManagementSection) courseManagementSection.style.display = 'none';
    if (studentManagementSection) studentManagementSection.style.display = 'block';
    
    loadStudentsForManagement();
}

function showManageStudents() {
    const studentManagementSection = document.getElementById('studentManagementSection');
    if (studentManagementSection) {
        studentManagementSection.style.display = 'block';
        loadStudentsForManagement();
    }
}

async function loadStudentsForManagement() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/users/students', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayStudentsForManagement(result.data);
        } else {
            showMessage('Failed to load students', 'error');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        showMessage('Error loading students', 'error');
    }
}

function displayStudentsForManagement(students) {
    const studentsTable = document.getElementById('studentsManagementTable');
    if (!studentsTable) return;

    studentsTable.innerHTML = students.map(student => {
        const registrationDate = new Date(student.created_at).toLocaleDateString();
        const statusClass = student.status === 'active' ? 'status-approved' : 'status-rejected';
        const statusText = student.status.charAt(0).toUpperCase() + student.status.slice(1);
        
        return `
            <tr>
                <td>${student.full_name}</td>
                <td>${student.email}</td>
                <td>${registrationDate}</td>
                <td>${student.enrollment_count || 0} courses</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn" style="padding: 5px 10px; font-size: 0.875rem; background: #3498db;" onclick="viewStudentDetails(${student.id})">View Details</button>
                </td>
            </tr>
        `;
    }).join('');
}

function manageCourses() {
    // This function will be implemented when course management is added
    showMessage('Course management feature coming soon!', 'info');
}

function showManageCourses() {
    const courseManagementSection = document.getElementById('courseManagementSection');
    if (courseManagementSection) {
        courseManagementSection.style.display = 'block';
        loadCoursesForManagement();
    }
}

function showAddCourseForm() {
    document.getElementById('addCourseModal').style.display = 'block';
}

function closeAddCourseModal() {
    document.getElementById('addCourseModal').style.display = 'none';
    document.getElementById('addCourseForm').reset();
}

function closeEditCourseModal() {
    document.getElementById('editCourseModal').style.display = 'none';
    document.getElementById('editCourseForm').reset();
}

async function loadCoursesForManagement() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch('/api/courses', {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCoursesForManagement(result.data);
        } else {
            showMessage('Failed to load courses', 'error');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showMessage('Error loading courses', 'error');
    }
}

function displayCoursesForManagement(courses) {
    const coursesTable = document.getElementById('coursesManagementTable');
    if (!coursesTable) return;

    coursesTable.innerHTML = courses.map(course => {
        const statusClass = course.status === 'active' ? 'status-approved' : 'status-rejected';
        const statusText = course.status.charAt(0).toUpperCase() + course.status.slice(1);
        
        return `
            <tr>
                <td>${course.title}</td>
                <td>${course.instructor}</td>
                <td>${course.modules}</td>
                <td>${course.duration_hours} hours</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn" style="padding: 5px 10px; margin-right: 5px; font-size: 0.875rem; background: #3498db;" onclick="editCourse(${course.id})">Edit</button>
                    <button class="btn" style="padding: 5px 10px; font-size: 0.875rem; background: #e74c3c;" onclick="deleteCourse(${course.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function editCourse(courseId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const response = await fetch(`/api/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const course = result.data;
            
            // Populate edit form
            document.getElementById('editCourseId').value = course.id;
            document.getElementById('editCourseTitle').value = course.title;
            document.getElementById('editCourseDescription').value = course.description;
            document.getElementById('editCourseInstructor').value = course.instructor;
            document.getElementById('editCourseModules').value = course.modules;
            document.getElementById('editCourseDuration').value = course.duration_hours;
            document.getElementById('editCourseLink').value = course.link || '';

            // Show modal
            document.getElementById('editCourseModal').style.display = 'block';
        } else {
            showMessage('Course not found', 'error');
        }
    } catch (error) {
        console.error('Error loading course details:', error);
        showMessage('Error loading course details', 'error');
    }
}

async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('Course deleted successfully!', 'success');
                loadCoursesForManagement();
                loadDashboardData(); // Refresh stats
            } else {
                showMessage(result.message || 'Failed to delete course', 'error');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            showMessage('Error deleting course', 'error');
        }
    }
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
