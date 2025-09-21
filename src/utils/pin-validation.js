// file: /src/utils/pin-validation.js v1 - Admin PIN verification with MongoDB integration

// Store the last selected option to revert back if pin verification fails
let lastValidSelection = "";
let isAdminVerified = false;

// Export the verification status for form-validator.js to use
window.isAdminVerified = function() {
    console.log("IsAdminVerified function called, returning: ", isAdminVerified);
    return isAdminVerified;
};

// Initialize the global adminVerified flag that form-validator.js is checking
window.adminVerified = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log("Pin validation loaded!");

    // Get membership level select element
    const membershipSelect = document.getElementById('membership-level');

    // Only proceed if the membership select exists (on registration/profile pages)
    if (!membershipSelect) {
        console.log("Membership level select not found - pin validation not needed on this page");
        return;
    }

    // Add change event listener to check for restricted options
    membershipSelect.addEventListener('change', function() {
        checkRestrictedOption(this);
    });

    // Add event listener for the verify button
    const verifyPinBtn = document.getElementById('verifyPinBtn');
    if (verifyPinBtn) {
        verifyPinBtn.addEventListener('click', function() {
            const pinInput = document.getElementById('adminPinCode').value;
            const pinError = document.getElementById('pinError');
            const membershipSelect = document.getElementById('membership-level');

            // validate input
            if (!pinInput || pinInput.trim() === '') {
                pinError.style.display = 'block';
                pinError.textContent = 'Please enter an admin access code';
                return; // Exit the function early
            }

            console.log("Verifying pin:", pinInput);

            // get user ID from session if available
            const userId = null;

            // Determine the base URL
            const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? `http://${window.location.host}`
                : window.location.origin;

            // Prepare verification data
            const verificationData = {
                code: pinInput,
                userId: userId // include, if available
            };

            // show loading state
            const verifyBtn = document.getElementById('verifyPinBtn');
            const originalBtnText = verifyBtn.textContent;
            verifyBtn.textContent = 'Verifying...';
            verifyBtn.disabled = true;

            // Call the admin verification API
            fetch(`${baseURL}/api/auth?operation=verify-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify(verificationData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Verification failed');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.access) {
                        // PIN correct - update select to Admin
                        membershipSelect.value = "Admin";
                        lastValidSelection = "Admin"; // Update last valid selection
                        isAdminVerified = true;

                        // Set global flag for other scripts - this is what form-validator.js checks
                        window.adminVerified = true;

                        // Hide modal
                        hideAdminModal();

                        console.log("Admin access verified successfully!");
                        showSuccessMessage(data.message || "Admin access verified successfully!");

                        // update user status if verification included user update
                        updateUserStatusIfNeeded(userId);
                    } else {
                        // Show error message
                        pinError.style.display = 'block';
                        pinError.textContent = data.message || 'Invalid admin access code';
                        console.log("Invalid admin code entered");
                    }
                })
                .catch(error => {
                    console.error("Admin verification error:", error);
                    pinError.style.display = 'block';
                    pinError.textContent = 'Error verifying admin code: ' + error.message;
                })
                .finally(() => {
                    // reset the state of the button
                    verifyBtn.textContent = originalBtnText;
                    verifyBtn.disabled = false;
                });
        });
    }

    // check if selected option is restricted
    function checkRestrictedOption(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];

        // if any restricted option, such as Admin
        if (selectedOption.dataset.restricted === 'true') {
            console.log('Restricted option selected: ', selectedOption.value);

            // show the PIN modal
            showAdminModal();

            // reset pin input and error message
            const pinInput = document.getElementById('adminPinCode');
            const pinError = document.getElementById('pinError');

            if (pinInput) pinInput.value = '';
            if (pinError) pinError.style.display = 'none';

            // remember the last valid selection to revert back if needed
            if (lastValidSelection === "") {
                // default to the first option if no previous selection
                lastValidSelection = selectElement.options[0].value;
            }

            // temporarily revert back to previous selection until pin is verified
            selectElement.value = lastValidSelection;
        } else {
            // update the last valid selection
            lastValidSelection = selectElement.value;

            // reset admin verification status if not admin option
            if (selectedOption.value !== "Admin") {
                isAdminVerified = false;
                window.adminVerified = false; // Make sure to update both variables
            }
        }
    }

    // Helper function to show admin modal
    function showAdminModal() {
        // Try Bootstrap 5 method first
        const modalElement = document.getElementById('adminAccessModal');
        if (modalElement) {
            // Check if Bootstrap 5 is available
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
            // Fallback to Bootstrap 4/jQuery
            else if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#adminAccessModal').modal('show');
            }
            // Fallback to manual display
            else {
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
                document.body.classList.add('modal-open');

                // Add backdrop
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                backdrop.id = 'admin-modal-backdrop';
                document.body.appendChild(backdrop);
            }
        }
    }

    // Helper function to hide admin modal
    function hideAdminModal() {
        const modalElement = document.getElementById('adminAccessModal');
        if (modalElement) {
            // Check if Bootstrap 5 is available
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            // Fallback to Bootstrap 4/jQuery
            else if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#adminAccessModal').modal('hide');
            }
            // Fallback to manual hide
            else {
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
                document.body.classList.remove('modal-open');

                // Remove backdrop
                const backdrop = document.getElementById('admin-modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
        }
    }

    // Helper function to show success message
    function showSuccessMessage(message) {
        // Try to show an alert or toast
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'success');
        } else if (typeof window.showAlert === 'function') {
            window.showAlert(message, 'success');
        } else {
            // Fallback to browser alert
            alert(message);
        }
    }

    // Helper function to get user ID from session
    function getUserIdFromSession() {
        console.warn("getUserIdFromSession is deprecated - pass userId as parameter instead");
        return null;
    }

    // Function to update user status - NOW HANDLED BY NEXTAUTH SESSION UPDATE
    function updateUserStatusIfNeeded(userId) {
        if (!userId) return;

        console.log("User admin status verified - NextAuth will handle session update on next request");

    }
});

// Public API for other scripts
window.PinValidation = {
    // Check if admin is verified
    isAdminVerified: function() {
        return isAdminVerified;
    },

    // Reset admin verification status
    resetAdminStatus: function() {
        isAdminVerified = false;
        window.adminVerified = false;
        lastValidSelection = "";
        console.log("Admin verification status reset");
    },

    // Manually verify admin (for programmatic use)
    verifyAdmin: async function(code, userId = null) {
        const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `http://${window.location.host}`
            : window.location.origin;

        const verificationData = {
            code: code,
            userId: userId // NextAuth handles user identification server-side
        };

        try {
            const response = await fetch(`${baseURL}/api/auth?operation=verify-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify(verificationData)
            });

            if (!response.ok) {
                throw new Error('Verification failed');
            }

            const data = await response.json();

            if (data.access) {
                isAdminVerified = true;
                window.adminVerified = true;
                updateUserStatusIfNeeded(verificationData.userId);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || 'Invalid admin access code' };
            }
        } catch (error) {
            console.error("Admin verification error:", error);
            return { success: false, message: error.message };
        }
    }
};