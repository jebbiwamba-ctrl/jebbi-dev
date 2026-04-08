// Authentication Module for JEBBI GADGETS

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
});

// Register User Function
function registerUser(e) {
    e.preventDefault();
    
    // Clear all error messages first
    clearErrors();
    
    // Get form values
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    // Validation
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
    
    // Check if email already exists
    if (isValid && emailExists(email)) {
        showError('email-error', 'Email already registered');
        isValid = false;
    }
    
    if (isValid) {
        // Create user object
        const user = {
            id: generateUserId(),
            fullname: fullname,
            email: email,
            phone: phone,
            password: hashPassword(password),
            registeredAt: new Date().toISOString(),
            status: 'active'
        };
        
        // Get existing users from localStorage
        let users = JSON.parse(localStorage.getItem('jebbi_users')) || [];
        
        // Add new user
        users.push(user);
        
        // Save to localStorage
        localStorage.setItem('jebbi_users', JSON.stringify(users));
        
        // Show success message
        showToast('Registration successful! Redirecting to login...', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}

// Login User Function
function loginUser(e) {
    e.preventDefault();
    
    // Clear all error messages
    clearErrors();
    
    // Get form values
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validation
    let isValid = true;
    
    if (!isValidEmail(email)) {
        showError('login-email-error', 'Please enter a valid email');
        isValid = false;
    }
    
    if (password.length === 0) {
        showError('login-password-error', 'Please enter your password');
        isValid = false;
    }
    
    if (isValid) {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('jebbi_users')) || [];
        
        // Find user by email
        const user = users.find(u => u.email === email);
        
        if (user && user.password === hashPassword(password)) {
            // Login successful
            const session = {
                userId: user.id,
                email: user.email,
                fullname: user.fullname,
                phone: user.phone,
                loginTime: new Date().toISOString()
            };
            
            // Save session
            session.role = 'customer'; // Default, backend sets admin
            localStorage.setItem('jebbi_current_user', JSON.stringify(session));
            localStorage.setItem('jebbi_token', 'dummy-jwt-' + Date.now()); // Backend JWT
            
            // Remember me functionality
            if (rememberMe) {
                localStorage.setItem('jebbi_remember_me', email);
            } else {
                localStorage.removeItem('jebbi_remember_me');
            }
            
            showToast('Login successful! Redirecting...', 'success');
            
            // Redirect to home after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Login failed
            if (!user) {
                showError('login-email-error', 'Email not found');
            } else {
                showError('login-password-error', 'Incorrect password');
            }
            showToast('Login failed. Please check your credentials.', 'error');
        }
    }
}

// Logout User Function
function logoutUser() {
    localStorage.removeItem('jebbi_current_user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Check User Status and Update UI
function checkUserStatus() {
    const currentUser = JSON.parse(localStorage.getItem('jebbi_current_user'));
    const cartLink = document.getElementById('cart-link');
    
    if (currentUser) {
        // User is logged in
        const userSection = document.querySelector('.user-section');
        
        if (cartLink) {
            // Add user profile and logout button to header
            const navElement = document.querySelector('nav');
            if (navElement && !document.getElementById('user-profile-btn')) {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-section';
                userDiv.id = 'user-profile-btn';
                userDiv.innerHTML = `
                    <span class="user-name">${currentUser.fullname}</span>
                    <button class="btn-logout" onclick="logoutUser()">Logout</button>
                `;
                navElement.appendChild(userDiv);
            }
        }
    } else {
        // User is not logged in - update nav if on login/register pages
        const rememberEmail = localStorage.getItem('jebbi_remember_me');
        if (rememberEmail && document.getElementById('login-email')) {
            document.getElementById('login-email').value = rememberEmail;
        }
    }
}

// Password Strength Checker
function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthMeter = document.getElementById('strength-meter');
    
    if (!strengthMeter) return;
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthColors = ['#dc3545', '#fd7e14', '#ffc107', '#17a2b8', '#28a745', '#20c997'];
    
    if (password.length > 0) {
        strengthMeter.textContent = strengthTexts[strength];
        strengthMeter.style.color = strengthColors[strength];
        strengthMeter.style.display = 'block';
    } else {
        strengthMeter.style.display = 'none';
    }
}

// Utility Functions

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // Accept 10-15 digit phone numbers
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function emailExists(email) {
    const users = JSON.parse(localStorage.getItem('jebbi_users')) || [];
    return users.some(u => u.email === email);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    // Simple hash function (not secure for production - use bcrypt in real app)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Get current logged in user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('jebbi_current_user'));
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('jebbi_current_user') !== null;
}
