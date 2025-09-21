// file: /src/utils/admin-users.js v1 - User management utility for admin dashboard

/**
 * Admin Users Management Utility
 * Handles CRUD operations for users in the admin dashboard
 */

// State management
let userState = {
    users: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalUsers: 0,
    isLoading: false,
    filters: {
        search: '',
        status: '',
        level: '',
        dateRange: ''
    },
    sortBy: 'lastName',
    sortOrder: 'asc',
    editingUserId: null
};

/**
 * Get authentication token
 * @returns {string|null} Auth token
 */
function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('patriotThanksToken');
}

/**
 * Get base URL for API calls
 * @returns {string} Base URL
 */
function getBaseUrl() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.host}`
        : window.location.origin;
}

/**
 * Show loading state
 * @param {boolean} isLoading Whether to show loading state
 */
function setLoadingState(isLoading) {
    userState.isLoading = isLoading;
    const loadingElements = document.querySelectorAll('.users-loading');
    const contentElements = document.querySelectorAll('.users-content');

    loadingElements.forEach(el => {
        el.style.display = isLoading ? 'block' : 'none';
    });

    contentElements.forEach(el => {
        el.style.display = isLoading ? 'none' : 'block';
    });
}

/**
 * Display error message
 * @param {string} message Error message to display
 */
function showError(message) {
    console.error('Users Admin Error:', message);

    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'error');
    } else if (typeof window.showToast === 'function') {
        window.showToast(message, 'error');
    } else {
        alert('Error: ' + message);
    }
}

/**
 * Display success message
 * @param {string} message Success message to display
 */
function showSuccess(message) {
    console.log('Users Admin Success:', message);

    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'success');
    } else if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Check admin access
 * @returns {Promise<boolean>} True if user has admin access
 */
async function checkAdminAccess() {
    try {
        if (typeof window.AdminAccess?.checkAdminStatus === 'function') {
            const result = await window.AdminAccess.checkAdminStatus();
            return result.isAdmin;
        }

        const token = getAuthToken();
        if (!token) return false;

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/admin-access`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            return data.isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin access:', error);
        return false;
    }
}

/**
 * Load users from the server
 * @param {object} options Loading options
 * @returns {Promise<object>} User data
 */
async function loadUsers(options = {}) {
    const {
        page = userState.currentPage,
        limit = userState.itemsPerPage,
        search = userState.filters.search,
        status = userState.filters.status,
        level = userState.filters.level,
        dateRange = userState.filters.dateRange,
        sortBy = userState.sortBy,
        sortOrder = userState.sortOrder
    } = options;

    setLoadingState(true);

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
        });

        // Add filters if they have values
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (level) params.append('level', level);
        if (dateRange) params.append('dateRange', dateRange);

        const response = await fetch(`${baseURL}/api/admin-users?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // Update state
        userState.users = data.users || [];
        userState.currentPage = data.currentPage || 1;
        userState.totalPages = data.totalPages || 1;
        userState.totalUsers = data.totalUsers || 0;

        console.log(`Loaded ${userState.users.length} users`);
        return data;
    } catch (error) {
        console.error('Error loading users:', error);
        showError(error.message);
        return { users: [], totalUsers: 0 };
    } finally {
        setLoadingState(false);
    }
}

/**
 * Create a new user
 * @param {object} userData User data to create
 * @returns {Promise<object>} Created user data
 */
async function createUser(userData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/admin-users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('User created successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Create User', {
                userId: data.user._id,
                userEmail: userData.email
            });
        }

        return data;
    } catch (error) {
        console.error('Error creating user:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Update an existing user
 * @param {string} userId User ID to update
 * @param {object} updates User data to update
 * @returns {Promise<object>} Updated user data
 */
async function updateUser(userId, updates) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/admin-users`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, ...updates })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('User updated successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Update User', {
                userId: userId,
                updates: Object.keys(updates)
            });
        }

        return data;
    } catch (error) {
        console.error('Error updating user:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Delete a user
 * @param {string} userId User ID to delete
 * @returns {Promise<object>} Deletion result
 */
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return { cancelled: true };
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        // Prevent deleting self
        const currentUser = getCurrentUser();
        if (currentUser && currentUser._id === userId) {
            throw new Error('You cannot delete your own account');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/admin-users`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('User deleted successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Delete User', {
                userId: userId
            });
        }

        return data;
    } catch (error) {
        console.error('Error deleting user:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Get current logged-in user
 * NOTE: This function is deprecated for NextAuth
 * In React components, use useSession() hook instead
 * For utility functions, pass user data as parameters
 * @returns {object|null} Current user data
 */
function getCurrentUser() {
    console.warn('getCurrentUser is deprecated - use useSession() hook in components or pass user data as parameter');

    // Try to get from old admin token system (different from NextAuth)
    try {
        const token = getAuthToken();
        if (token) {
            // Return minimal info - full user data should come from NextAuth in components
            return { fromLegacyToken: true };
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

/**
 * Get user status options
 * @returns {Array} Array of status options
 */
function getUserStatuses() {
    return [
        { value: 'AC', label: 'Active' },
        { value: 'IN', label: 'Inactive' },
        { value: 'PE', label: 'Pending' },
        { value: 'SU', label: 'Suspended' },
        { value: 'AD', label: 'Admin' }
    ];
}

/**
 * Get membership level options
 * @returns {Array} Array of membership level options
 */
function getMembershipLevels() {
    return [
        { value: 'Veteran', label: 'Veteran' },
        { value: 'Active Duty', label: 'Active Duty' },
        { value: 'National Guard', label: 'National Guard' },
        { value: 'Reserves', label: 'Reserves' },
        { value: 'First Responder', label: 'First Responder' },
        { value: 'Spouse', label: 'Spouse' },
        { value: 'Family Member', label: 'Family Member' },
        { value: 'Business Owner', label: 'Business Owner' },
        { value: 'Admin', label: 'Admin' },
        { value: 'Other', label: 'Other' }
    ];
}

/**
 * Get status label from code
 * @param {string} status Status code
 * @returns {string} Status label
 */
function getStatusLabel(status) {
    const statuses = getUserStatuses();
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
}

/**
 * Validate user data
 * @param {object} userData User data to validate
 * @param {boolean} isEdit Whether this is an edit operation
 * @returns {object} Validation result
 */
function validateUserData(userData, isEdit = false) {
    const errors = [];

    // Required fields
    if (!userData.firstname || userData.firstname.trim() === '') {
        errors.push('First name is required');
    }

    if (!userData.lastname || userData.lastname.trim() === '') {
        errors.push('Last name is required');
    }

    if (!userData.email || userData.email.trim() === '') {
        errors.push('Email is required');
    } else if (!validateEmail(userData.email)) {
        errors.push('Please enter a valid email address');
    }

    if (!userData.status) {
        errors.push('Status is required');
    }

    if (!userData.level) {
        errors.push('Membership level is required');
    }

    // Password validation (only if adding new user or changing password)
    if (!isEdit || (isEdit && userData.password)) {
        // For new users, a password is required
        if (!isEdit && !userData.password) {
            errors.push('Password is required for new users');
        }

        // If a password is provided, validate it
        if (userData.password) {
            if (userData.password !== userData.confirmPassword) {
                errors.push('Passwords do not match');
            }

            // Use the existing password validation if available
            if (typeof window.validatePassword === 'function') {
                const validation = window.validatePassword(userData.password);

                if (!validation.isValid) {
                    let message = 'Password must contain:\n';
                    const criteria = validation.criteria;

                    if (!criteria.hasLower) message += '- At least one lowercase letter\n';
                    if (!criteria.hasUpper) message += '- At least one uppercase letter\n';
                    if (!criteria.hasNumber) message += '- At least one number\n';
                    if (!criteria.hasSpecial) message += '- At least one special character (!@#$%^&*)\n';
                    if (!criteria.hasLength) message += '- At least 8 characters\n';

                    errors.push(message.trim());
                }
            } else {
                // Basic password validation fallback
                if (userData.password.length < 8) {
                    errors.push('Password must be at least 8 characters long');
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate email format
 * @param {string} email Email to validate
 * @returns {boolean} True if valid email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Format user data for display
 * @param {object} user User data
 * @returns {object} Formatted user data
 */
function formatUserData(user) {
    return {
        ...user,
        fullName: `${user.firstname} ${user.lastname}`,
        statusLabel: getStatusLabel(user.status),
        createdDateFormatted: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        updatedDateFormatted: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '',
        lastLoginFormatted: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    };
}

/**
 * Apply filters to user list
 * @param {object} filters Filter criteria
 */
async function applyFilters(filters) {
    userState.filters = { ...userState.filters, ...filters };
    userState.currentPage = 1; // Reset to first page
    await loadUsers();
}

/**
 * Clear all filters
 */
async function clearFilters() {
    userState.filters = {
        search: '',
        status: '',
        level: '',
        dateRange: ''
    };
    userState.currentPage = 1;
    await loadUsers();
}

/**
 * Change page
 * @param {number} page Page number
 */
async function changePage(page) {
    if (page >= 1 && page <= userState.totalPages) {
        userState.currentPage = page;
        await loadUsers();
    }
}

/**
 * Change sorting
 * @param {string} sortBy Field to sort by
 * @param {string} sortOrder Sort order (asc/desc)
 */
async function changeSorting(sortBy, sortOrder = 'asc') {
    userState.sortBy = sortBy;
    userState.sortOrder = sortOrder;
    userState.currentPage = 1; // Reset to first page
    await loadUsers();
}

/**
 * Reset password for a user
 * @param {string} userId User ID
 * @param {string} newPassword New password
 * @returns {Promise<object>} Reset result
 */
async function resetUserPassword(userId, newPassword) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        // Validate new password
        if (typeof window.validatePassword === 'function') {
            const validation = window.validatePassword(newPassword);
            if (!validation.isValid) {
                throw new Error('Password does not meet security requirements');
            }
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/admin-users/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, newPassword })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Password reset successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Reset User Password', {
                userId: userId
            });
        }

        return data;
    } catch (error) {
        console.error('Error resetting password:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Setup form validation for user forms
 */
function setupUserFormValidation() {
    const userForm = document.getElementById('user-form');
    if (!userForm) return;

    // Real-time email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !validateEmail(email)) {
                this.classList.add('is-invalid');

                let feedback = this.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    this.parentNode.appendChild(feedback);
                }
                feedback.textContent = 'Please enter a valid email address';
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }

    // Password confirmation validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    if (passwordInput && confirmPasswordInput) {
        function validatePasswordMatch() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (confirmPassword && password !== confirmPassword) {
                confirmPasswordInput.classList.add('is-invalid');

                let feedback = confirmPasswordInput.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    confirmPasswordInput.parentNode.appendChild(feedback);
                }
                feedback.textContent = 'Passwords do not match';
            } else {
                confirmPasswordInput.classList.remove('is-invalid');
            }
        }

        passwordInput.addEventListener('input', validatePasswordMatch);
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

/**
 * Initialize the user management utility
 * @returns {Promise<boolean>} True if initialization successful
 */
async function init() {
    console.log('Initializing Admin Users Manager...');

    // Check admin access first
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
        console.error('Admin access denied');
        if (typeof window.AdminAccess?.enforceAdminAccess === 'function') {
            await window.AdminAccess.enforceAdminAccess();
        }
        return false;
    }

    console.log('Admin access confirmed');

    // Setup form validation
    setupUserFormValidation();

    // Load users
    await loadUsers();

    return true;
}

// Export public API
window.AdminUsers = {
    // Data operations
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,

    // Utility functions
    validateUserData,
    validateEmail,
    formatUserData,
    getUserStatuses,
    getMembershipLevels,
    getStatusLabel,
    getCurrentUser,

    // Filter and pagination
    applyFilters,
    clearFilters,
    changePage,
    changeSorting,

    // Initialization
    init,
    setupUserFormValidation,

    // State access
    getState: () => ({ ...userState }),

    // UI helpers
    showError,
    showSuccess,
    setLoadingState
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Users utility loaded');

    // Check if we're on the admin users page
    if (document.getElementById('users-table-body') || document.getElementById('user-form')) {
        init();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AdminUsers;
}