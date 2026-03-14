// Main JavaScript file for the Online Tutorial Platform

// Global variables
let currentUser = null;
let isLoggedIn = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        isLoggedIn = true;
        updateNavigation();
    }
}

function checkLoginStatus() {
    // This function will be expanded when backend is connected
    console.log('Checking login status...');
}

function updateNavigation() {
    console.log('updateNavigation called, isLoggedIn:', isLoggedIn, 'currentUser:', currentUser);
    
    if (isLoggedIn && currentUser) {
        // Update navigation based on user role
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            console.log('Found navLinks, current items:', navLinks.children.length);
            
            // Check if navigation already has dashboard/profile/logout (to avoid duplicates)
            const hasDashboard = Array.from(navLinks.children).some(li => 
                li.textContent.includes('Dashboard')
            );
            const hasProfile = Array.from(navLinks.children).some(li => 
                li.textContent.includes('Profile')
            );
            const hasLogout = Array.from(navLinks.children).some(li => 
                li.textContent.includes('Logout')
            );
            
            console.log('Navigation already has - Dashboard:', hasDashboard, 'Profile:', hasProfile, 'Logout:', hasLogout);
            
            // If already updated, don't update again
            if (hasDashboard && hasProfile && hasLogout) {
                console.log('Navigation already updated, skipping');
                return;
            }
            
            // Add dashboard link based on role
            const dashboardLink = currentUser.role === 'admin' 
                ? '<li><a href="/pages/admin-dashboard.html">Dashboard</a></li>'
                : '<li><a href="/pages/student-dashboard.html">Dashboard</a></li>';
            
            // Add profile link
            const profileLink = '<li><a href="/pages/profile.html">Profile</a></li>';
            
            // Add logout link
            const logoutLink = '<li><a href="#" onclick="logout()">Logout</a></li>';
            
            // Remove login/register links and add dashboard/profile/logout
            const loginLink = navLinks.querySelector('li:nth-child(3)');
            const registerLink = navLinks.querySelector('li:nth-child(4)');
            
            console.log('Removing login/register links...');
            if (loginLink) loginLink.remove();
            if (registerLink) registerLink.remove();
            
            console.log('Adding new navigation links...');
            navLinks.insertAdjacentHTML('beforeend', dashboardLink);
            navLinks.insertAdjacentHTML('beforeend', profileLink);
            navLinks.insertAdjacentHTML('beforeend', logoutLink);
            
            console.log('Navigation update complete');
        }
    }
    
    // Update active states based on current page
    updateActiveStates();
}

function updateActiveStates() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        // Remove existing active classes
        link.classList.remove('active');
        
        // Add active class based on current path
        if (currentPath === '/' && link.getAttribute('href') === '/') {
            link.classList.add('active');
        } else if (currentPath.includes('/pages/courses.html') && link.getAttribute('href') === '/pages/courses.html') {
            link.classList.add('active');
        } else if (currentPath.includes('/pages/admin-dashboard.html') && link.getAttribute('href') === '/pages/admin-dashboard.html') {
            link.classList.add('active');
        } else if (currentPath.includes('/pages/student-dashboard.html') && link.getAttribute('href') === '/pages/student-dashboard.html') {
            link.classList.add('active');
        } else if (currentPath.includes('/pages/profile.html') && link.getAttribute('href') === '/pages/profile.html') {
            link.classList.add('active');
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    isLoggedIn = false;
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 1000);
}

function showMessage(message, type = 'info') {
    // Create a simple message display (can be enhanced with toast notifications)
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

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Utility function to make API calls (will be used when backend is connected)
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    if (currentUser && currentUser.token) {
        options.headers.Authorization = `Bearer ${currentUser.token}`;
    }
    
    try {
        // This will be replaced with actual API endpoint when backend is ready
        console.log('API Call:', endpoint, options);
        return { success: true, data: {} };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// Course enrollment function
function enrollCourse(courseId) {
    if (!isLoggedIn) {
        showMessage('Please login to enroll in courses', 'error');
        window.location.href = 'pages/login.html';
        return;
    }
    
    if (currentUser.role !== 'student') {
        showMessage('Only students can enroll in courses', 'error');
        return;
    }
    
    // For now, show a success message
    showMessage('Enrollment request sent to admin!', 'success');
    
    // This will be connected to backend when ready
    console.log('Enrollment request for course:', courseId);
}

// Format date function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Get course by ID (mock data for now)
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
