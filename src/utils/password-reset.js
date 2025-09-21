// file: /src/utils/password-reset.js v1 - Password reset functionality with token validation

/**
 * Password Reset Utility
 * Handles forgot password and reset password functionality
 */

// State management
let passwordResetState = {
    isProcessing: false,
    token: null,
    email: null,
    validationErrors: {},
    lastRequest: null
};

/**
 * Get base URL for API calls
 * @returns {string} Base URL
 */
function getBaseUrl() {
    return window.location.hostname === "localhost" || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.host}`
        : window.location.origin;
}

/**
 * Show loading state on button
 * @param {HTMLElement} button Button element
 * @param {boolean} isLoading Whether to show loading state
 */
function setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;

        // Store original text
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.tagName === 'INPUT'
                ? button.value
                : button.textContent;
        }

        // Set loading text
        const loadingText = button.dataset.loadingText || 'Processing...';
        if (button.tagName === 'INPUT') {
            button.value = loadingText;
        } else {
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${loadingText}
            `;
        }
    } else {
        button.disabled = false;

        // Restore original text
        const originalText = button.dataset.originalText;
        if (originalText) {
            if (button.tagName === 'INPUT') {
                button.value = originalText;
            } else {
                button.textContent = originalText;
            }
        }
    }
}

/**
 * Show alert message
 * @param {string} message Message to display
 * @param {string} type Alert type (success, error, warning, info)
 */
function showAlert(message, type = 'info') {
    console.log(`Alert (${type}):`, message);

    // Try to use existing alert system
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
    } else if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        // Fallback to browser alert
        alert(message);
    }
}

/**
 * Show form validation error
 * @param {HTMLElement} field Form field element
 * @param {string} message Error message
 */
function showFieldError(field, message) {
    if (!field) return;

    // Add error class
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');

    // Find or create error message element
    let errorElement = field.parentNode.querySelector('.invalid-feedback');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        field.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * Clear form validation error
 * @param {HTMLElement} field Form field element
 */
function clearFieldError(field) {
    if (!field) return;

    field.classList.remove('is-invalid');
    const errorElement = field.parentNode.querySelector('.invalid-feedback');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
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
 * Validate password requirements
 * @param {string} password Password to validate
 * @returns {object} Validation result
 */
function validatePassword(password) {
    // Use global password validation function if available
    if (typeof window.validatePassword === 'function') {
        return window.validatePassword(password);
    }

    // Fallback validation
    const validation = {
        isValid: false,
        criteria: {
            hasLower: /[a-z]/.test(password),
            hasUpper: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            hasLength: password.length >= 8
        }
    };

    validation.isValid = Object.values(validation.criteria).every(criterion => criterion);
    return validation;
}

/**
 * Send forgot password request
 * @param {string} email Email address
 * @returns {Promise<object>} Request result
 */
async function sendForgotPasswordRequest(email) {
    passwordResetState.isProcessing = true;

    try {
        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/auth?operation=forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            // Store successful request
            passwordResetState.lastRequest = {
                email: email,
                timestamp: new Date().toISOString(),
                success: true
            };

            console.log('Forgot password request sent successfully');

            // Log reset link in development (for testing)
            if (data.resetLink) {
                console.log("Reset link:", data.resetLink);
            }

            return {
                success: true,
                message: data.message || 'If this email is registered, a reset link has been sent.'
            };
        } else {
            throw new Error(data.message || 'Server error occurred');
        }
    } catch (error) {
        console.error('Error sending forgot password request:', error);

        // Store failed request
        passwordResetState.lastRequest = {
            email: email,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
        };

        return {
            success: false,
            message: error.message || 'There was a problem sending the reset link. Please try again.'
        };
    } finally {
        passwordResetState.isProcessing = false;
    }
}

/**
 * Reset password with token
 * @param {string} token Reset token
 * @param {string} password New password
 * @returns {Promise<object>} Reset result
 */
async function resetPasswordWithToken(token, password) {
    passwordResetState.isProcessing = true;

    try {
        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/auth?operation=reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Password reset successfully');
            return {
                success: true,
                message: data.message || 'Your password has been reset successfully!'
            };
        } else {
            throw new Error(data.message || 'Password reset failed');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        return {
            success: false,
            message: error.message || 'There was a problem resetting your password. The link may be invalid or expired.'
        };
    } finally {
        passwordResetState.isProcessing = false;
    }
}

/**
 * Get reset token from URL
 * @returns {string|null} Reset token
 */
function getResetTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

/**
 * Setup forgot password form
 * @param {HTMLElement} form Forgot password form
 * @returns {boolean} True if setup successful
 */
function setupForgotPasswordForm(form) {
    if (!form) {
        console.warn('Forgot password form not found');
        return false;
    }

    console.log('Setting up forgot password form');

    const emailInput = form.querySelector('[name="email"], #email');
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

    // Email validation
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !validateEmail(email)) {
                showFieldError(this, 'Please enter a valid email address');
            } else {
                clearFieldError(this);
            }
        });

        emailInput.addEventListener('input', function() {
            clearFieldError(this);
        });
    }

    // Form submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        if (passwordResetState.isProcessing) {
            console.log('Request already in progress');
            return;
        }

        const email = emailInput ? emailInput.value.trim() : '';

        // Validate email
        if (!email) {
            showFieldError(emailInput, 'Email address is required');
            return;
        }

        if (!validateEmail(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
            return;
        }

        // Clear any errors
        clearFieldError(emailInput);

        try {
            // Set loading state
            if (submitButton) {
                submitButton.dataset.loadingText = 'Sending...';
                setButtonLoading(submitButton, true);
            }

            // Send request
            const result = await sendForgotPasswordRequest(email);

            if (result.success) {
                showAlert(result.message, 'success');
                form.reset();
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showAlert('An unexpected error occurred. Please try again.', 'error');
        } finally {
            // Reset loading state
            if (submitButton) {
                setButtonLoading(submitButton, false);
            }
        }
    });

    return true;
}

/**
 * Setup reset password form
 * @param {HTMLElement} form Reset password form
 * @returns {boolean} True if setup successful
 */
function setupResetPasswordForm(form) {
    if (!form) {
        console.warn('Reset password form not found');
        return false;
    }

    console.log('Setting up reset password form');

    const tokenInput = form.querySelector('[name="token"], #token, #reset-token');
    const passwordInput = form.querySelector('[name="password"], #password, #psw');
    const confirmPasswordInput = form.querySelector('[name="confirmPassword"], #confirmPassword, #psw_repeat');
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

    // Get token from URL and set it
    const urlToken = getResetTokenFromURL();
    if (urlToken) {
        passwordResetState.token = urlToken;
        if (tokenInput) {
            tokenInput.value = urlToken;
        }
    } else {
        showAlert('Reset token is missing. Please use the link from your email.', 'warning');
        return false;
    }

    // Password validation
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const validation = validatePassword(password);

            if (password.length > 0 && !validation.isValid) {
                let errorMsg = 'Password must contain: ';
                const missing = [];

                if (!validation.criteria.hasLower) missing.push('lowercase letter');
                if (!validation.criteria.hasUpper) missing.push('uppercase letter');
                if (!validation.criteria.hasNumber) missing.push('number');
                if (!validation.criteria.hasSpecial) missing.push('special character');
                if (!validation.criteria.hasLength) missing.push('at least 8 characters');

                errorMsg += missing.join(', ');
                showFieldError(this, errorMsg);
            } else {
                clearFieldError(this);
            }
        });
    }

    // Confirm password validation
    if (confirmPasswordInput && passwordInput) {
        function validatePasswordMatch() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (confirmPassword && password !== confirmPassword) {
                showFieldError(confirmPasswordInput, 'Passwords do not match');
            } else {
                clearFieldError(confirmPasswordInput);
            }
        }

        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        passwordInput.addEventListener('input', validatePasswordMatch);
    }

    // Form submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        if (passwordResetState.isProcessing) {
            console.log('Reset already in progress');
            return;
        }

        const token = passwordResetState.token || (tokenInput ? tokenInput.value : '');
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        // Validation
        if (!token) {
            showAlert('Reset token is missing. Please use the link from your email.', 'error');
            return;
        }

        if (!password) {
            showFieldError(passwordInput, 'Password is required');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return;
        }

        if (password !== confirmPassword) {
            showFieldError(confirmPasswordInput, 'Passwords do not match');
            return;
        }

        // Clear any errors
        clearFieldError(passwordInput);
        clearFieldError(confirmPasswordInput);

        try {
            // Set loading state
            if (submitButton) {
                submitButton.dataset.loadingText = 'Resetting...';
                setButtonLoading(submitButton, true);
            }

            // Reset password
            const result = await resetPasswordWithToken(token, password);

            if (result.success) {
                showAlert(result.message, 'success');

                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = '../../auth/signin?message=password-reset-success';
                }, 2000);
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showAlert('An unexpected error occurred. Please try again.', 'error');
        } finally {
            // Reset loading state
            if (submitButton) {
                setButtonLoading(submitButton, false);
            }
        }
    });

    return true;
}

/**
 * Check if reset token is valid
 * @param {string} token Reset token
 * @returns {Promise<boolean>} True if token is valid
 */
async function validateResetToken(token) {
    if (!token) return false;

    try {
        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/auth?operation=validate-reset-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        if (response.ok) {
            const data = await response.json();
            return data.valid === true;
        }
        return false;
    } catch (error) {
        console.error('Error validating reset token:', error);
        return false;
    }
}

/**
 * Handle expired or invalid token
 */
function handleInvalidToken() {
    const container = document.querySelector('main, .container, body');
    if (container) {
        const alertHTML = `
            <div class="alert alert-warning" role="alert">
                <h4 class="alert-heading">Invalid or Expired Link</h4>
                <p>This password reset link is invalid or has expired. Password reset links are only valid for 1 hour for security reasons.</p>
                <hr>
                <p class="mb-0">
                    Please <a href="/forgot-password" class="alert-link">request a new password reset link</a> 
                    or <a href="/contact" class="alert-link">contact support</a> if you continue to have issues.
                </p>
            </div>
        `;

        // Insert at the beginning of the container
        container.insertAdjacentHTML('afterbegin', alertHTML);
    }
}

/**
 * Initialize password reset functionality
 */
function initializePasswordReset() {
    console.log('Initializing password reset functionality');

    // Check for forgot password form
    const forgotPasswordForm = document.querySelector(
        '#forgot-password-form, .forgot-password-form, form[data-forgot-password]'
    );

    if (forgotPasswordForm) {
        setupForgotPasswordForm(forgotPasswordForm);
    }

    // Check for reset password form
    const resetPasswordForm = document.querySelector(
        '#reset-password-form, .reset-password-form, form[data-reset-password]'
    );

    if (resetPasswordForm) {
        // Check if we have a valid token first
        const token = getResetTokenFromURL();
        if (token) {
            // Validate token asynchronously
            validateResetToken(token).then(isValid => {
                if (isValid) {
                    setupResetPasswordForm(resetPasswordForm);
                } else {
                    console.log('Invalid or expired reset token');
                    handleInvalidToken();

                    // Disable the form
                    const inputs = resetPasswordForm.querySelectorAll('input, button');
                    inputs.forEach(input => {
                        input.disabled = true;
                    });
                }
            });
        } else {
            console.log('No reset token found in URL');
            handleInvalidToken();
        }
    }
}

/**
 * Get password reset state
 * @returns {object} Current state
 */
function getPasswordResetState() {
    return { ...passwordResetState };
}

/**
 * Reset the utility state
 */
function resetState() {
    passwordResetState.isProcessing = false;
    passwordResetState.token = null;
    passwordResetState.email = null;
    passwordResetState.validationErrors = {};
    passwordResetState.lastRequest = null;
}

/**
 * Get last request information
 * @returns {object|null} Last request data
 */
function getLastRequest() {
    return passwordResetState.lastRequest;
}

/**
 * Check if currently processing a request
 * @returns {boolean} True if processing
 */
function isProcessing() {
    return passwordResetState.isProcessing;
}

// Export public API
window.PasswordReset = {
    // Core functions
    sendForgotPasswordRequest,
    resetPasswordWithToken,
    validateResetToken,

    // Setup functions
    setupForgotPasswordForm,
    setupResetPasswordForm,
    initializePasswordReset,

    // Validation functions
    validateEmail,
    validatePassword,

    // Utility functions
    getResetTokenFromURL,
    handleInvalidToken,

    // State management
    getPasswordResetState,
    getLastRequest,
    resetState,
    isProcessing,

    // UI helpers
    showAlert,
    showFieldError,
    clearFieldError,
    setButtonLoading
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Password Reset utility loaded');
    initializePasswordReset();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.PasswordReset;
}