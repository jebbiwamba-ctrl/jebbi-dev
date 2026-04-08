// ============================================================
// JEBBI GADGETS - Backend API Integration Module
// ============================================================

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================================
// AUTHENTICATION MODULE - Connects to Backend
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
});

// Register User - Sends to Backend
function registerUser(e) {
    e.preventDefault();
    clearErrors();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    let isValid = true;
    
    if (fullname.length < 3) {
        showError('fullname-error', 'Full name must be at least 3 characters');
        isValid = false;
    }
    
    if (!isValidEmail(email)) {
        showError('email-error', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!isValidPhone(phone)) {
        showError('phone-error', 'Please enter a valid phone number');
        isValid = false;
    }
    
    if (password.length < 6) {
        showError('password-error', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showError('confirm-error', 'Passwords do not match');
        isValid = false;
    }
    
    if (!termsAccepted) {
        showToast('Please accept the terms and conditions', 'error');
        isValid = false;
    }
    
    if (isValid) {
        // Send to Backend
        fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName: fullname,
                email: email,
                phone: phone,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success || data.token) {
                showToast('Registration successful! Redirecting to verify email...', 'success');
                setTimeout(() => {
                    window.location.href = 'verify-email.html';
                }, 2000);
            } else {
                showError('email-error', data.message || 'Registration failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('email-error', 'Registration failed. Please try again.');
        });
    }
}

// Login User - Sends to Backend
function loginUser(e) {
    e.preventDefault();
    clearErrors();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }
    
    // Show loading state
    const loginBtn = document.querySelector('button[type="submit"]');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    // Send to Backend
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Store tokens and user info in localStorage
            localStorage.setItem('accessToken', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showToast('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError('email-error', data.message || 'Login failed');
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('email-error', 'Login failed. Please try again.');
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    });
}

// Logout User
function logoutUser() {
    // Get token for logout request
    const token = localStorage.getItem('accessToken');
    
    if (token) {
        fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .catch(err => console.log('Logout API error:', err));
    }
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    
    // Redirect to home
    window.location.href = 'index.html';
}

// Check User Status and Display Login/Logout
function checkUserStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('accessToken');
    const authBtn = document.getElementById('auth-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (authBtn) {
        if (user && token) {
            // User is logged in
            authBtn.textContent = `${user.fullName}`;
            authBtn.href = '#';
            authBtn.onclick = function(e) {
                e.preventDefault();
                if (userMenu) userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
            };
            
            // Show logout option
            if (userMenu) {
                userMenu.innerHTML = `
                    <a href="profile.html">My Profile</a>
                    <a href="orders.html">My Orders</a>
                    <a href="settings.html">Settings</a>
                    <button onclick="logoutUser()" style="background: none; border: none; color: #e74c3c; cursor: pointer; padding: 10px 0; font-size: 14px;">Logout</button>
                `;
            }
        } else {
            // User not logged in
            authBtn.textContent = 'Login / Register';
            authBtn.href = 'login.html';
        }
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^\d{10,}$/.test(phone.replace(/\D/g, ''));
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('[id$="-error"]').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-in-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// REFRESH TOKEN HELPER
// ============================================================

async function getValidToken() {
    let token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token && refreshToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('accessToken', data.token);
                token = data.token;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            logoutUser();
        }
    }
    
    return token;
}
