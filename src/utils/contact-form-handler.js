// file: /src/utils/contact-form-handler.js v1 - Contact form validation and submission handler

/**
 * Contact Form Handler Utility
 * Handles validation and submission of contact forms throughout the application
 */

// Form state management
let contactFormState = {
    isSubmitting: false,
    lastSubmission: null,
    validationErrors: {},
    formData: {}
};

/**
 * Get base URL for API calls
 * @returns {string} Base URL
 */
function getBaseUrl() {
    return window.location.origin;
}

/**
 * Show loading state on submit button
 * @param {HTMLElement} submitButton Submit button element
 * @param {boolean} isLoading Whether to show loading state
 */
function setSubmitButtonLoading(submitButton, isLoading) {
    if (!submitButton) return;

    contactFormState.isSubmitting = isLoading;

    if (isLoading) {
        submitButton.disabled = true;

        // Store original text
        if (!submitButton.dataset.originalText) {
            submitButton.dataset.originalText = submitButton.tagName === 'INPUT'
                ? submitButton.value
                : submitButton.textContent;
        }

        // Set loading text
        const loadingText = 'Sending...';
        if (submitButton.tagName === 'INPUT') {
            submitButton.value = loadingText;
        } else {
            submitButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${loadingText}
            `;
        }
    } else {
        submitButton.disabled = false;

        // Restore original text
        const originalText = submitButton.dataset.originalText;
        if (originalText) {
            if (submitButton.tagName === 'INPUT') {
                submitButton.value = originalText;
            } else {
                submitButton.textContent = originalText;
            }
        }
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
    field.classList.add('is-valid');

    const errorElement = field.parentNode.querySelector('.invalid-feedback');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Clear all form validation errors
 * @param {HTMLElement} form Form element
 */
function clearAllErrors(form) {
    const fields = form.querySelectorAll('.form-control, .form-select');
    fields.forEach(field => {
        field.classList.remove('is-invalid', 'is-valid');
    });

    const errorElements = form.querySelectorAll('.invalid-feedback');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });

    contactFormState.validationErrors = {};
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
 * Validate phone number format
 * @param {string} phone Phone number to validate
 * @returns {boolean} True if valid phone number
 */
function validatePhone(phone) {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
}

/**
 * Validate contact form data
 * @param {object} formData Form data to validate
 * @returns {object} Validation result
 */
function validateContactForm(formData) {
    const errors = {};

    // Required fields validation
    if (!formData.firstname || formData.firstname.trim() === '') {
        errors.firstname = 'First name is required';
    }

    if (!formData.lastname || formData.lastname.trim() === '') {
        errors.lastname = 'Last name is required';
    }

    if (!formData.email || formData.email.trim() === '') {
        errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
    }

    if (!formData.subject || formData.subject.trim() === '') {
        errors.subject = 'Subject is required';
    }

    if (!formData.message || formData.message.trim() === '') {
        errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
        errors.message = 'Message must be at least 10 characters long';
    } else if (formData.message.trim().length > 2000) {
        errors.message = 'Message must be less than 2000 characters';
    }

    // Optional phone validation
    if (formData.phone && formData.phone.trim() !== '' && !validatePhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
    }

    // Name length validation
    if (formData.firstname && formData.firstname.length > 50) {
        errors.firstname = 'First name must be less than 50 characters';
    }

    if (formData.lastname && formData.lastname.length > 50) {
        errors.lastname = 'Last name must be less than 50 characters';
    }

    // Subject length validation
    if (formData.subject && formData.subject.length > 100) {
        errors.subject = 'Subject must be less than 100 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

/**
 * Extract form data from form element
 * @param {HTMLElement} form Form element
 * @returns {object} Form data object
 */
function extractFormData(form) {
    const formData = {};
    const fields = [
        'firstname', 'fname', 'first_name',
        'lastname', 'lname', 'last_name',
        'email', 'email_address',
        'phone', 'phone_number',
        'subject',
        'message', 'comments'
    ];

    fields.forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field) {
            const value = field.value.trim();

            // Map field names to standard format
            if (['fname', 'first_name'].includes(fieldName)) {
                formData.firstname = value;
            } else if (['lname', 'last_name'].includes(fieldName)) {
                formData.lastname = value;
            } else if (['email_address'].includes(fieldName)) {
                formData.email = value;
            } else if (['phone_number'].includes(fieldName)) {
                formData.phone = value;
            } else if (['comments'].includes(fieldName)) {
                formData.message = value;
            } else {
                formData[fieldName] = value;
            }
        }
    });

    return formData;
}

/**
 * Display validation errors on form
 * @param {HTMLElement} form Form element
 * @param {object} errors Validation errors
 */
function displayValidationErrors(form, errors) {
    // Clear existing errors first
    clearAllErrors(form);

    // Display new errors
    Object.keys(errors).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field) {
            showFieldError(field, errors[fieldName]);
        }
    });

    contactFormState.validationErrors = errors;
}

/**
 * Submit contact form data to server
 * @param {object} formData Form data to submit
 * @returns {Promise<object>} Submission result
 */
async function submitContactForm(formData) {
    try {
        const baseURL = getBaseUrl();
        const apiUrl = `${baseURL}/api/contact`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Store successful submission
        contactFormState.lastSubmission = {
            timestamp: new Date().toISOString(),
            data: formData,
            success: true
        };

        console.log('Contact form submitted successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error submitting contact form:', error);

        // Store failed submission
        contactFormState.lastSubmission = {
            timestamp: new Date().toISOString(),
            data: formData,
            success: false,
            error: error.message
        };

        throw error;
    }
}

/**
 * Handle successful form submission
 * @param {HTMLElement} form Form element
 * @param {object} formData Submitted form data
 */
function handleSubmissionSuccess(form, formData) {
    // Store form data in session storage for thank you page
    try {
        sessionStorage.setItem('contactFormData', JSON.stringify(formData));
    } catch (error) {
        console.warn('Could not store form data in session storage:', error);
    }

    // Clear the form
    form.reset();
    clearAllErrors(form);

    // Show success message
    if (typeof window.showAlert === 'function') {
        window.showAlert('Message sent successfully! Redirecting to thank you page...', 'success');
    }

    // Redirect to thank you page after short delay
    setTimeout(() => {
        window.location.href = '/thank-you';
    }, 1500);
}

/**
 * Handle form submission error
 * @param {HTMLElement} form Form element
 * @param {Error} error Error object
 */
function handleSubmissionError(form, error) {
    console.error('Form submission error:', error);

    // Show error message
    let errorMessage = 'There was a problem sending your message. Please try again.';

    if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('400')) {
        errorMessage = 'Please check your form data and try again.';
    } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
    }

    if (typeof window.showAlert === 'function') {
        window.showAlert(errorMessage, 'error');
    } else {
        alert(errorMessage);
    }
}

/**
 * Setup real-time validation for form fields
 * @param {HTMLElement} form Form element
 */
function setupRealTimeValidation(form) {
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
        // Clear error on focus
        field.addEventListener('focus', () => {
            clearFieldError(field);
        });

        // Validate on blur for most fields
        field.addEventListener('blur', () => {
            const formData = extractFormData(form);
            const validation = validateContactForm(formData);

            if (validation.errors[field.name] || validation.errors[field.id]) {
                const errorMessage = validation.errors[field.name] || validation.errors[field.id];
                showFieldError(field, errorMessage);
            } else if (field.value.trim() !== '') {
                clearFieldError(field);
            }
        });

        // Special handling for email field
        if (field.type === 'email' || field.name === 'email' || field.id === 'email') {
            field.addEventListener('input', () => {
                const email = field.value.trim();
                if (email.length > 0 && !validateEmail(email)) {
                    showFieldError(field, 'Please enter a valid email address');
                } else {
                    clearFieldError(field);
                }
            });
        }

        // Special handling for message field (character count)
        if (field.name === 'message' || field.id === 'message') {
            field.addEventListener('input', () => {
                const message = field.value.trim();
                const charCount = message.length;

                // Find or create character counter
                let counter = form.querySelector('.char-counter');
                if (!counter) {
                    counter = document.createElement('div');
                    counter.className = 'char-counter text-muted small';
                    field.parentNode.appendChild(counter);
                }

                counter.textContent = `${charCount}/2000 characters`;

                if (charCount > 2000) {
                    counter.classList.add('text-danger');
                    showFieldError(field, 'Message must be less than 2000 characters');
                } else if (charCount < 10 && charCount > 0) {
                    counter.classList.remove('text-danger');
                    showFieldError(field, 'Message must be at least 10 characters long');
                } else {
                    counter.classList.remove('text-danger');
                    clearFieldError(field);
                }
            });
        }
    });
}

/**
 * Setup contact form handler
 * @param {HTMLElement} form Form element
 * @returns {boolean} True if setup successful
 */
function setupContactForm(form) {
    if (!form) {
        console.warn('Contact form element not found');
        return false;
    }

    console.log('Setting up contact form handler');

    // Setup real-time validation
    setupRealTimeValidation(form);

    // Handle form submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Prevent double submission
        if (contactFormState.isSubmitting) {
            console.log('Form submission already in progress');
            return;
        }

        console.log('Processing contact form submission');

        // Extract form data
        const formData = extractFormData(form);
        contactFormState.formData = formData;

        // Validate form data
        const validation = validateContactForm(formData);

        if (!validation.isValid) {
            console.log('Form validation failed:', validation.errors);
            displayValidationErrors(form, validation.errors);
            return;
        }

        // Clear any existing errors
        clearAllErrors(form);

        // Get submit button
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

        try {
            // Show loading state
            setSubmitButtonLoading(submitButton, true);

            // Submit form
            await submitContactForm(formData);

            // Handle success
            handleSubmissionSuccess(form, formData);
        } catch (error) {
            // Handle error
            handleSubmissionError(form, error);
        } finally {
            // Reset loading state
            setSubmitButtonLoading(submitButton, false);
        }
    });

    return true;
}

/**
 * Initialize contact form handlers on the page
 */
function initializeContactForms() {
    console.log('Initializing contact form handlers');

    // Find all contact forms on the page
    const contactForms = document.querySelectorAll(
        '#contact-form, .contact-form, form[data-contact-form]'
    );

    if (contactForms.length === 0) {
        console.log('No contact forms found on this page');
        return;
    }

    let setupCount = 0;
    contactForms.forEach(form => {
        if (setupContactForm(form)) {
            setupCount++;
        }
    });

    console.log(`Contact form handlers set up for ${setupCount} form(s)`);
}

/**
 * Get form submission history
 * @returns {object} Last submission data
 */
function getSubmissionHistory() {
    return contactFormState.lastSubmission;
}

/**
 * Reset form state
 */
function resetFormState() {
    contactFormState.isSubmitting = false;
    contactFormState.lastSubmission = null;
    contactFormState.validationErrors = {};
    contactFormState.formData = {};
}

/**
 * Check if form is currently being submitted
 * @returns {boolean} True if submitting
 */
function isSubmitting() {
    return contactFormState.isSubmitting;
}

/**
 * Manually trigger form validation
 * @param {HTMLElement} form Form element
 * @returns {object} Validation result
 */
function validateForm(form) {
    const formData = extractFormData(form);
    const validation = validateContactForm(formData);

    if (!validation.isValid) {
        displayValidationErrors(form, validation.errors);
    } else {
        clearAllErrors(form);
    }

    return validation;
}

/**
 * Pre-fill form with data
 * @param {HTMLElement} form Form element
 * @param {object} data Data to pre-fill
 */
function prefillForm(form, data) {
    Object.keys(data).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field && data[fieldName]) {
            field.value = data[fieldName];
        }
    });
}

/**
 * Get current form state
 * @returns {object} Current form state
 */
function getFormState() {
    return { ...contactFormState };
}

// Export public API
window.ContactFormHandler = {
    // Setup and initialization
    setupContactForm,
    initializeContactForms,

    // Validation functions
    validateContactForm,
    validateForm,
    validateEmail,
    validatePhone,

    // Form manipulation
    extractFormData,
    prefillForm,
    clearAllErrors,

    // State management
    getFormState,
    getSubmissionHistory,
    resetFormState,
    isSubmitting,

    // Manual submission (for programmatic use)
    submitContactForm,

    // Utility functions
    showFieldError,
    clearFieldError,
    setSubmitButtonLoading
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Contact Form Handler utility loaded');
    initializeContactForms();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ContactFormHandler;
}