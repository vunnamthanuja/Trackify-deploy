// API Configuration
// Use the local backend during development and the same-origin /api path in production.
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : `${window.location.origin}/api`;

// API Endpoints
const API_ENDPOINTS = {
    // Auth
    sendOTP: `${API_BASE_URL}/auth/send-otp`,
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,

    // Visitors
    checkVisitor: (phoneNumber) => `${API_BASE_URL}/visitors/check/${phoneNumber}`,
    registerVisitor: `${API_BASE_URL}/visitors/register`,
    visitorCheckIn: `${API_BASE_URL}/visitors/check-in`,
    visitorCheckOut: `${API_BASE_URL}/visitors/check-out`,
    getAllVisitors: `${API_BASE_URL}/visitors`,

    // Staff
    checkStaff: (phoneNumber) => `${API_BASE_URL}/staff/check/${phoneNumber}`,
    staffCheckOut: `${API_BASE_URL}/staff/check-out`,
    staffCheckIn: `${API_BASE_URL}/staff/check-in`,
    getAllStaff: `${API_BASE_URL}/staff`,
    getStaffLogs: (staffId) => `${API_BASE_URL}/staff/logs/${staffId}`,

    // Receptionist
    pendingVisits: `${API_BASE_URL}/receptionist/pending-visits`,
    processVisit: `${API_BASE_URL}/receptionist/process-visit`,
    allVisits: `${API_BASE_URL}/receptionist/all-visits`,
    todayVisits: `${API_BASE_URL}/receptionist/today-visits`,
    receptionistStats: `${API_BASE_URL}/receptionist/stats`,

    // Security
    securityVisitorVisits: `${API_BASE_URL}/security/visitor-visits`,
    securityStaffLogs: `${API_BASE_URL}/security/staff-logs`,
    securityStats: `${API_BASE_URL}/security/stats`,
    activeVisitors: `${API_BASE_URL}/security/active-visitors`,

    // Principal
    dailyReport: `${API_BASE_URL}/principal/daily-report`,
    reportRange: `${API_BASE_URL}/principal/report-range`,
    principalStats: `${API_BASE_URL}/principal/stats`,
    dailySummary: `${API_BASE_URL}/principal/daily-summary`
};

// Utility Functions
function showMessage(message, type = 'info') {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `message-box ${type} show`;

    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 5000);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Local Storage Functions
function setUserData(userData) {
    localStorage.setItem('trackify_user', JSON.stringify(userData));
}

function getUserData() {
    const data = localStorage.getItem('trackify_user');
    return data ? JSON.parse(data) : null;
}

function clearUserData() {
    localStorage.removeItem('trackify_user');
}

function getAuthToken() {
    const userData = getUserData();
    return userData ? userData.token : null;
}

// Check if user is logged in
function checkAuth() {
    const userData = getUserData();
    if (!userData || !userData.token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    const userData = getUserData();
    
    if (userData) {
        // Call logout API
        fetch(API_ENDPOINTS.logout, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber: userData.user.phoneNumber,
                userType: userData.user.role
            })
        }).catch(err => console.error('Logout error:', err));
    }

    clearUserData();
    window.location.href = 'index.html';
}

// HTTP Request Helper
async function apiRequest(url, options = {}) {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}
