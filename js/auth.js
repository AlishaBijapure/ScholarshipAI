const API_BASE_URL = 'https://scholarshipai.onrender.com/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        return true;
    }
    return false;
}

// Redirect if not authenticated. Returns true when authenticated.
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Set auth token
function setToken(token) {
    localStorage.setItem('token', token);
}

// Clear auth
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Signup
async function signup(fullName, email, password) {
    try {
        const response = await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ fullName, email, password })
        });

        setToken(response.token);
        setCurrentUser(response.user);
        return response;
    } catch (error) {
        throw error;
    }
}

// Login
async function login(email, password) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        setToken(response.token);
        setCurrentUser(response.user);
        return response;
    } catch (error) {
        throw error;
    }
}

// Logout
function logout() {
    clearAuth();
    window.location.href = 'index.html';
}
