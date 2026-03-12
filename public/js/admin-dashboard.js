// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadDashboardData();
    loadEnrollmentRequests();
    loadStudents();
    
    // Setup form event listeners
    setupCourseForms();
});

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
}

async function handleAddCourse() {
    const formData = new FormData(document.getElementById('addCourseForm'));
    const courseData = {
        title: formData.get('title'),
        description: formData.get('description'),
        instructor: formData.get('instructor'),
        modules: parseInt(formData.get('modules')),
        durationHours: parseInt(formData.get('durationHours'))
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
        durationHours: parseInt(formData.get('durationHours'))
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

function loadDashboardData() {
    // Load dashboard statistics
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    
    const students = users.filter(u => u.role === 'student');
    const pendingRequests = enrollments.filter(e => e.status === 'pending');
    const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
    
    // Update dashboard stats
    updateDashboardStats({
        totalStudents: students.length,
        totalCourses: 6, // Mock data
        pendingRequests: pendingRequests.length,
        approvedEnrollments: approvedEnrollments.length
    });
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
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    
    const studentsTable = document.querySelector('.dashboard-card:last-child tbody');
    if (!studentsTable) return;
    
    studentsTable.innerHTML = students.map(student => {
        const studentEnrollments = enrollments.filter(e => e.studentEmail === student.email);
        const registrationDate = new Date(student.registrationDate).toLocaleDateString();
        
        return `
            <tr>
                <td>${student.fullName}</td>
                <td>${student.email}</td>
                <td>${registrationDate}</td>
                <td>${studentEnrollments.length} courses</td>
                <td><button class="btn" style="padding: 5px 10px; font-size: 0.875rem;" onclick="viewStudentDetails('${student.email}')">View</button></td>
            </tr>
        `;
    }).join('');
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

function viewStudentDetails(studentEmail) {
    // This function will be enhanced when detailed student view is implemented
    showMessage(`Student details for ${studentEmail} coming soon!`, 'info');
}

function viewStudents() {
    // Scroll to students section
    const studentsSection = document.querySelector('.dashboard-card:last-child');
    if (studentsSection) {
        studentsSection.scrollIntoView({ behavior: 'smooth' });
    }
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

function loadCoursesForManagement() {
    // Mock data for now - will be replaced with API call
    const courses = [
        { id: 1, title: 'Complete Web Development Bootcamp', instructor: 'John Doe', modules: 12, duration_hours: 40, status: 'active' },
        { id: 2, title: 'Python for Data Science', instructor: 'Jane Smith', modules: 10, duration_hours: 35, status: 'active' },
        { id: 3, title: 'SQL & Database Management', instructor: 'Mike Johnson', modules: 8, duration_hours: 25, status: 'active' },
        { id: 4, title: 'Modern React Development', instructor: 'Sarah Wilson', modules: 9, duration_hours: 30, status: 'active' },
        { id: 5, title: 'UI/UX Design Fundamentals', instructor: 'Emily Brown', modules: 7, duration_hours: 20, status: 'active' },
        { id: 6, title: 'React Native Mobile Apps', instructor: 'David Lee', modules: 11, duration_hours: 38, status: 'active' }
    ];

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

function editCourse(courseId) {
    const courses = [
        { id: 1, title: 'Complete Web Development Bootcamp', description: 'Learn HTML, CSS, JavaScript, Node.js, and modern web development frameworks from scratch.', instructor: 'John Doe', modules: 12, duration_hours: 40 },
        { id: 2, title: 'Python for Data Science', description: 'Master Python programming and data analysis with pandas, NumPy, and machine learning basics.', instructor: 'Jane Smith', modules: 10, duration_hours: 35 },
        { id: 3, title: 'SQL & Database Management', description: 'Learn database design, SQL queries, and database administration with MySQL and PostgreSQL.', instructor: 'Mike Johnson', modules: 8, duration_hours: 25 },
        { id: 4, title: 'Modern React Development', description: 'Build modern web applications with React, Redux, hooks, and latest React ecosystem.', instructor: 'Sarah Wilson', modules: 9, duration_hours: 30 },
        { id: 5, title: 'UI/UX Design Fundamentals', description: 'Learn user interface and user experience design principles with Figma and modern design tools.', instructor: 'Emily Brown', modules: 7, duration_hours: 20 },
        { id: 6, title: 'React Native Mobile Apps', description: 'Build cross-platform mobile applications for iOS and Android using React Native.', instructor: 'David Lee', modules: 11, duration_hours: 38 }
    ];

    const course = courses.find(c => c.id === courseId);
    if (!course) {
        showMessage('Course not found', 'error');
        return;
    }

    // Populate edit form
    document.getElementById('editCourseId').value = course.id;
    document.getElementById('editCourseTitle').value = course.title;
    document.getElementById('editCourseDescription').value = course.description;
    document.getElementById('editCourseInstructor').value = course.instructor;
    document.getElementById('editCourseModules').value = course.modules;
    document.getElementById('editCourseDuration').value = course.duration_hours;

    // Show modal
    document.getElementById('editCourseModal').style.display = 'block';
}

function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
       
        showMessage('Course deleted successfully!', 'success');
        loadCoursesForManagement();
        loadDashboardData(); // Refresh stats
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '../';
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
