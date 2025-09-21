// file: /src/utils/password-validation.js v1 - Password validation utility with real-time feedback

document.addEventListener('DOMContentLoaded', function() {
    console.log("Password validation script loaded");

    // Password matching validation
    const submitButton = document.getElementById('submit');
    if (submitButton) {
        submitButton.disabled = true;
    }

    // Get all the elements
    var myInput = document.getElementById("psw");
    var confirmInput = document.getElementById("psw_repeat");
    var messageBox = document.getElementById("message");

    // Password validation criteria elements
    var letter = document.getElementById("letter");
    var capital = document.getElementById("capital");
    var number = document.getElementById("number");
    var length = document.getElementById("length");
    var special = document.getElementById("special");
    var match = document.getElementById("match");

    // Exit if elements don't exist (we're not on the registration page)
    if (!myInput || !confirmInput || !messageBox) {
        console.log("Not on a page with password validation elements");
        return;
    }

    console.log("Password validation elements found");

    // Initially hide the match status
    if (match) {
        match.style.display = "none";
    }

    // Show all password requirements when password field is focused
    myInput.onfocus = function() {
        messageBox.style.display = "block";
        if (match) {
            match.style.display = "none"; // Hide match status when focusing on password
        }
    }

    // When the user clicks outside the password field, hide the message box
    myInput.onblur = function() {
        // Only hide if no validation errors exist
        if (checkAllCriteria()) {
            messageBox.style.display = "none";
        }
    }

    // When the user starts to type something inside the password field
    myInput.onkeyup = function() {
        updatePasswordValidation();
    }

    // Show confirm password requirements when confirm field is focused
    confirmInput.onfocus = function() {
        if (match) {
            match.style.display = "block";
        }
    }

    // Hide confirm password message when blurred (if valid)
    confirmInput.onblur = function() {
        if (match && match.classList.contains("valid")) {
            match.style.display = "none";
        }
    }

    // Function to update password validation
    function updatePasswordValidation() {
        var password = myInput.value;

        // Validate lowercase letters
        var lowerCaseLetters = /[a-z]/g;
        if (password.match(lowerCaseLetters) && letter) {
            letter.classList.remove("invalid");
            letter.classList.add("valid");
        } else if (letter) {
            letter.classList.remove("valid");
            letter.classList.add("invalid");
        }

        // Validate capital letters
        var upperCaseLetters = /[A-Z]/g;
        if (password.match(upperCaseLetters) && capital) {
            capital.classList.remove("invalid");
            capital.classList.add("valid");
        } else if (capital) {
            capital.classList.remove("valid");
            capital.classList.add("invalid");
        }

        // Validate numbers
        var numbers = /[0-9]/g;
        if (password.match(numbers) && number) {
            number.classList.remove("invalid");
            number.classList.add("valid");
        } else if (number) {
            number.classList.remove("valid");
            number.classList.add("invalid");
        }

        // Validate special characters
        var specialChars = /[!@#$%^&*(),.?":{}|<>]/g;
        if (password.match(specialChars) && special) {
            special.classList.remove("invalid");
            special.classList.add("valid");
        } else if (special) {
            special.classList.remove("valid");
            special.classList.add("invalid");
        }

        // Validate length
        if (password.length >= 8 && length) {
            length.classList.remove("invalid");
            length.classList.add("valid");
        } else if (length) {
            length.classList.remove("valid");
            length.classList.add("invalid");
        }

        // Update password match
        updatePasswordMatch();

        // Check if all criteria are met
        if (checkAllCriteria()) {
            if (submitButton) {
                submitButton.disabled = false;
            }
        } else {
            if (submitButton) {
                submitButton.disabled = true;
            }
        }
    }

    // Function to update password match status
    function updatePasswordMatch() {
        if (!match) return;

        var password = myInput.value;
        var confirmPassword = confirmInput.value;

        // Only check match if both fields have content
        if (password.length > 0 && confirmPassword.length > 0) {
            if (password === confirmPassword) {
                match.classList.remove("invalid");
                match.classList.add("valid");
            } else {
                match.classList.remove("valid");
                match.classList.add("invalid");
            }
        } else {
            // Reset match status if either field is empty
            match.classList.remove("valid");
            match.classList.remove("invalid");
        }

        // Enable/disable submit button based on all criteria
        if (checkAllCriteria()) {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    // Check password match when either field changes
    if (myInput && confirmInput) {
        myInput.addEventListener('keyup', updatePasswordMatch);
        confirmInput.addEventListener('keyup', updatePasswordMatch);
    }

    // Function to check if all criteria are met
    function checkAllCriteria() {
        if (!letter || !capital || !number || !special || !length || !match) {
            return false;
        }

        return letter.classList.contains("valid") &&
            capital.classList.contains("valid") &&
            number.classList.contains("valid") &&
            special.classList.contains("valid") &&
            length.classList.contains("valid") &&
            match.classList.contains("valid");
    }

    // Function to validate password - can be called from other scripts
    window.validatePassword = function(password) {
        // Validate lowercase letters
        var lowerCaseLetters = /[a-z]/g;
        var hasLower = lowerCaseLetters.test(password);

        // Validate capital letters
        var upperCaseLetters = /[A-Z]/g;
        var hasUpper = upperCaseLetters.test(password);

        // Validate numbers
        var numbers = /[0-9]/g;
        var hasNumber = numbers.test(password);

        // Validate special characters
        var specialChars = /[!@#$%^&*(),.?":{}|<>]/g;
        var hasSpecial = specialChars.test(password);

        // Validate length
        var hasLength = password.length >= 8;

        // Return validation object
        return {
            isValid: hasLower && hasUpper && hasNumber && hasSpecial && hasLength,
            criteria: {
                hasLower: hasLower,
                hasUpper: hasUpper,
                hasNumber: hasNumber,
                hasSpecial: hasSpecial,
                hasLength: hasLength
            }
        };
    };

    // Function to validate password match - can be called from other scripts
    window.validatePasswordMatch = function(password, confirmPassword) {
        return password === confirmPassword && password.length > 0;
    };

    // Function to get password strength score (0-5)
    window.getPasswordStrength = function(password) {
        var score = 0;

        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        if (password.length >= 8) score++;

        return score;
    };

    // Function to get password strength text
    window.getPasswordStrengthText = function(score) {
        switch(score) {
            case 0:
            case 1:
                return { text: "Very Weak", class: "text-danger" };
            case 2:
                return { text: "Weak", class: "text-warning" };
            case 3:
                return { text: "Fair", class: "text-info" };
            case 4:
                return { text: "Good", class: "text-primary" };
            case 5:
                return { text: "Strong", class: "text-success" };
            default:
                return { text: "Unknown", class: "text-muted" };
        }
    };

    // Export functions for module use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            validatePassword: window.validatePassword,
            validatePasswordMatch: window.validatePasswordMatch,
            getPasswordStrength: window.getPasswordStrength,
            getPasswordStrengthText: window.getPasswordStrengthText
        };
    }
});