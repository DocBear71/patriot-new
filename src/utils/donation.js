// file: /src/utils/donation.js v1 - Donation processing and management utility

/**
 * Donation Utility
 * Handles donation form processing, validation, and payment integration
 */

// Donation state management
let donationState = {
    isProcessing: false,
    currentDonation: null,
    paymentMethod: null,
    donationHistory: [],
    recurringDonations: []
};

/**
 * Get base URL for API calls
 * @returns {string} Base URL
 */
function getBaseUrl() {
    return window.location.origin;
}

/**
 * Show loading state
 * @param {boolean} isLoading Whether to show loading state
 */
function setLoadingState(isLoading) {
    donationState.isProcessing = isLoading;

    const loadingElements = document.querySelectorAll('.donation-loading');
    const contentElements = document.querySelectorAll('.donation-content');

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
    console.error('Donation Error:', message);

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
    console.log('Donation Success:', message);

    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'success');
    } else if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Validate donation amount
 * @param {number} amount Donation amount
 * @returns {object} Validation result
 */
function validateDonationAmount(amount) {
    const errors = [];

    if (!amount || isNaN(amount)) {
        errors.push('Please enter a valid donation amount');
    } else {
        const numAmount = parseFloat(amount);

        if (numAmount < 1) {
            errors.push('Minimum donation amount is $1.00');
        }

        if (numAmount > 10000) {
            errors.push('Maximum donation amount is $10,000.00');
        }

        // Check for reasonable decimal places
        if ((numAmount * 100) % 1 !== 0) {
            errors.push('Please enter amount in dollars and cents only');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate donor information
 * @param {object} donorInfo Donor information
 * @returns {object} Validation result
 */
function validateDonorInfo(donorInfo) {
    const errors = [];

    // Required fields
    if (!donorInfo.firstName || donorInfo.firstName.trim() === '') {
        errors.push('First name is required');
    }

    if (!donorInfo.lastName || donorInfo.lastName.trim() === '') {
        errors.push('Last name is required');
    }

    if (!donorInfo.email || donorInfo.email.trim() === '') {
        errors.push('Email address is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(donorInfo.email)) {
            errors.push('Please enter a valid email address');
        }
    }

    // Optional phone validation
    if (donorInfo.phone && donorInfo.phone.trim() !== '') {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (!phoneRegex.test(donorInfo.phone)) {
            errors.push('Please enter a valid phone number');
        }
    }

    // Name length validation
    if (donorInfo.firstName && donorInfo.firstName.length > 50) {
        errors.push('First name must be less than 50 characters');
    }

    if (donorInfo.lastName && donorInfo.lastName.length > 50) {
        errors.push('Last name must be less than 50 characters');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Format currency amount for display
 * @param {number} amount Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Get donation amount suggestions
 * @returns {Array} Array of suggested amounts
 */
function getDonationSuggestions() {
    return [
        { amount: 10, label: '$10' },
        { amount: 25, label: '$25' },
        { amount: 50, label: '$50' },
        { amount: 100, label: '$100' },
        { amount: 250, label: '$250' },
        { amount: 500, label: '$500' }
    ];
}

/**
 * Extract donation data from form
 * @param {HTMLElement} form Donation form element
 * @returns {object} Donation data
 */
function extractDonationData(form) {
    const donationData = {
        amount: 0,
        donorInfo: {},
        paymentInfo: {},
        isRecurring: false,
        frequency: 'monthly',
        message: '',
        isAnonymous: false
    };

    // Extract amount
    const amountField = form.querySelector('[name="amount"], #amount');
    if (amountField) {
        donationData.amount = parseFloat(amountField.value) || 0;
    }

    // Extract donor information
    const donorFields = [
        'firstName', 'first_name', 'fname',
        'lastName', 'last_name', 'lname',
        'email', 'phone'
    ];

    donorFields.forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (field) {
            const value = field.value.trim();

            // Map field names to standard format
            if (['first_name', 'fname'].includes(fieldName)) {
                donationData.donorInfo.firstName = value;
            } else if (['last_name', 'lname'].includes(fieldName)) {
                donationData.donorInfo.lastName = value;
            } else {
                donationData.donorInfo[fieldName] = value;
            }
        }
    });

    // Extract recurring donation info
    const recurringField = form.querySelector('[name="recurring"], #recurring');
    if (recurringField) {
        donationData.isRecurring = recurringField.checked;
    }

    const frequencyField = form.querySelector('[name="frequency"], #frequency');
    if (frequencyField) {
        donationData.frequency = frequencyField.value;
    }

    // Extract optional message
    const messageField = form.querySelector('[name="message"], #message');
    if (messageField) {
        donationData.message = messageField.value.trim();
    }

    // Extract anonymous preference
    const anonymousField = form.querySelector('[name="anonymous"], #anonymous');
    if (anonymousField) {
        donationData.isAnonymous = anonymousField.checked;
    }

    return donationData;
}

/**
 * Create donation record
 * @param {object} donationData Donation data
 * @returns {Promise<object>} Created donation record
 */
async function createDonation(donationData) {
    try {
        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/donation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(donationData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // Update state
        donationState.currentDonation = data.donation;

        console.log('Donation record created:', data.donation._id);
        return data;
    } catch (error) {
        console.error('Error creating donation:', error);
        throw error;
    }
}

/**
 * Process donation payment
 * @param {object} donationData Donation data
 * @param {object} paymentData Payment data
 * @returns {Promise<object>} Payment result
 */
async function processDonationPayment(donationData, paymentData) {
    try {
        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/donation/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                donation: donationData,
                payment: paymentData
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Payment processing failed');
        }

        const data = await response.json();

        console.log('Payment processed successfully:', data.transactionId);
        return data;
    } catch (error) {
        console.error('Error processing payment:', error);
        throw error;
    }
}

/**
 * Handle successful donation
 * @param {object} donationResult Donation result
 * @param {object} paymentResult Payment result
 */
function handleDonationSuccess(donationResult, paymentResult) {
    // Store donation data for completion page
    const completionData = {
        donationId: donationResult.donation._id,
        transactionId: paymentResult.transactionId,
        amount: donationResult.donation.amount,
        email: donationResult.donation.donorInfo.email,
        timestamp: new Date().toISOString()
    };

    try {
        sessionStorage.setItem('donationData', JSON.stringify(completionData));
    } catch (error) {
        console.warn('Could not store donation data in session storage:', error);
    }

    // Add to donation history
    donationState.donationHistory.push({
        ...completionData,
        success: true
    });

    // Show success message
    showSuccess('Thank you for your donation! Redirecting to confirmation page...');

    // Redirect to completion page
    setTimeout(() => {
        window.location.href = `/completed?transaction_id=${paymentResult.transactionId}&amount=${donationResult.donation.amount}`;
    }, 2000);
}

/**
 * Handle donation error
 * @param {Error} error Error object
 */
function handleDonationError(error) {
    console.error('Donation processing error:', error);

    let errorMessage = 'There was a problem processing your donation. Please try again.';

    if (error.message.includes('payment')) {
        errorMessage = 'Payment processing failed. Please check your payment information and try again.';
    } else if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('amount')) {
        errorMessage = 'Invalid donation amount. Please enter a valid amount and try again.';
    }

    showError(errorMessage);
}

/**
 * Setup donation amount buttons
 * @param {HTMLElement} form Donation form
 */
function setupAmountButtons(form) {
    const amountButtons = form.querySelectorAll('.amount-btn, [data-amount]');
    const amountInput = form.querySelector('[name="amount"], #amount');

    if (!amountInput) return;

    amountButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const amount = this.dataset.amount || this.value;
            if (amount) {
                amountInput.value = amount;

                // Remove active class from other buttons
                amountButtons.forEach(btn => btn.classList.remove('active', 'selected'));

                // Add active class to clicked button
                this.classList.add('active', 'selected');

                // Trigger validation
                const event = new Event('input', { bubbles: true });
                amountInput.dispatchEvent(event);
            }
        });
    });

    // Handle custom amount input
    amountInput.addEventListener('input', function() {
        // Remove active class from all buttons when typing custom amount
        amountButtons.forEach(btn => btn.classList.remove('active', 'selected'));

        // Validate amount in real-time
        const amount = parseFloat(this.value);
        if (!isNaN(amount) && amount > 0) {
            this.classList.remove('is-invalid');
        }
    });
}

/**
 * Setup recurring donation options
 * @param {HTMLElement} form Donation form
 */
function setupRecurringOptions(form) {
    const recurringCheckbox = form.querySelector('[name="recurring"], #recurring');
    const frequencySelect = form.querySelector('[name="frequency"], #frequency');
    const frequencyContainer = form.querySelector('.frequency-container, .recurring-options');

    if (!recurringCheckbox) return;

    function toggleFrequencyOptions() {
        const isRecurring = recurringCheckbox.checked;

        if (frequencyContainer) {
            frequencyContainer.style.display = isRecurring ? 'block' : 'none';
        }

        if (frequencySelect) {
            frequencySelect.disabled = !isRecurring;
        }
    }

    recurringCheckbox.addEventListener('change', toggleFrequencyOptions);

    // Initialize on page load
    toggleFrequencyOptions();
}

/**
 * Setup donation form validation
 * @param {HTMLElement} form Donation form
 */
function setupDonationFormValidation(form) {
    const amountInput = form.querySelector('[name="amount"], #amount');
    const emailInput = form.querySelector('[name="email"], #email');

    // Amount validation
    if (amountInput) {
        amountInput.addEventListener('blur', function() {
            const amount = parseFloat(this.value);
            const validation = validateDonationAmount(amount);

            if (!validation.isValid) {
                this.classList.add('is-invalid');

                let feedback = this.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    this.parentNode.appendChild(feedback);
                }
                feedback.textContent = validation.errors[0];
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    }

    // Email validation
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (email && !emailRegex.test(email)) {
                this.classList.add('is-invalid');

                let feedback = this.parentNode.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    this.parentNode.appendChild(feedback);
                }
                feedback.textContent = 'Please enter a valid email address';
            } else if (email) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    }
}

/**
 * Setup donation form handler
 * @param {HTMLElement} form Donation form element
 * @returns {boolean} True if setup successful
 */
function setupDonationForm(form) {
    if (!form) {
        console.warn('Donation form element not found');
        return false;
    }

    console.log('Setting up donation form handler');

    // Setup form components
    setupAmountButtons(form);
    setupRecurringOptions(form);
    setupDonationFormValidation(form);

    // Handle form submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Prevent double submission
        if (donationState.isProcessing) {
            console.log('Donation already being processed');
            return;
        }

        console.log('Processing donation submission');

        // Extract donation data
        const donationData = extractDonationData(form);

        // Validate donation amount
        const amountValidation = validateDonationAmount(donationData.amount);
        if (!amountValidation.isValid) {
            showError(amountValidation.errors[0]);
            return;
        }

        // Validate donor information
        const donorValidation = validateDonorInfo(donationData.donorInfo);
        if (!donorValidation.isValid) {
            showError(donorValidation.errors[0]);
            return;
        }

        try {
            // Set loading state
            setLoadingState(true);

            // Create donation record
            const donationResult = await createDonation(donationData);

            // For now, simulate payment processing
            // In a real implementation, you would integrate with a payment processor
            const mockPaymentResult = {
                success: true,
                transactionId: 'TXN_' + Date.now(),
                amount: donationData.amount,
                status: 'completed'
            };

            // Handle successful donation
            handleDonationSuccess(donationResult, mockPaymentResult);

        } catch (error) {
            handleDonationError(error);
        } finally {
            setLoadingState(false);
        }
    });

    return true;
}

/**
 * Initialize donation forms on the page
 */
function initializeDonationForms() {
    console.log('Initializing donation form handlers');

    const donationForms = document.querySelectorAll(
        '#donation-form, .donation-form, form[data-donation-form]'
    );

    if (donationForms.length === 0) {
        console.log('No donation forms found on this page');
        return;
    }

    let setupCount = 0;
    donationForms.forEach(form => {
        if (setupDonationForm(form)) {
            setupCount++;
        }
    });

    console.log(`Donation form handlers set up for ${setupCount} form(s)`);
}

/**
 * Get donation history
 * @returns {Array} Array of donation records
 */
function getDonationHistory() {
    return [...donationState.donationHistory];
}

/**
 * Get current donation state
 * @returns {object} Current donation state
 */
function getDonationState() {
    return { ...donationState };
}

// Export public API
window.DonationHandler = {
    // Setup and initialization
    setupDonationForm,
    initializeDonationForms,

    // Data extraction and validation
    extractDonationData,
    validateDonationAmount,
    validateDonorInfo,

    // Processing functions
    createDonation,
    processDonationPayment,

    // Utility functions
    formatCurrency,
    getDonationSuggestions,

    // State management
    getDonationState,
    getDonationHistory,

    // UI helpers
    showError,
    showSuccess,
    setLoadingState
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Donation Handler utility loaded');
    initializeDonationForms();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.DonationHandler;
}