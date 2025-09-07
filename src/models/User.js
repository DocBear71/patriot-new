// src/models/User.js - Fixed for Next.js compatibility
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    // Preserve your existing fields exactly
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    // Address fields (preserve existing structure)
    address1: String,
    address2: String,
    city: String,
    state: String,
    zip: String,

    // Status field - Based on your data: "VT", "AD", "FR", "SP", "BO", "SU" OR "active"/"inactive"
    status: {
        type: String,
        default: 'SU'
    },

    // Level field - Based on your data: "Admin", "Free", etc.
    level: {
        type: String,
        default: 'Free'
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    // Terms acceptance (preserve existing)
    termsAccepted: {
        type: Boolean,
        default: false
    },
    termsAcceptedDate: Date,
    termsVersion: {
        type: String,
        default: "May 14, 2025"
    },

    // Password reset (preserve existing)
    resetToken: String,
    resetTokenExpires: Date,

    // NEW: Additional fields (optional)
    serviceType: String, // Maps to status for new registrations
    militaryBranch: String, // Optional

    // Enhanced location for mobile features
    location: {
        coordinates: {
            lat: Number,
            lng: Number
        }
    },

    // User preferences
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        searchRadius: {
            type: Number,
            default: 25
        },
        favoriteCategories: [String]
    },

    // Modern authentication fields
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: {
        type: Date,
        default: null
    },
    emailVerifiedAt: {
        type: Date,
        default: null
    },

    // Preserve your timestamp pattern
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp
UserSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.verificationToken;
    delete userObject.resetToken;
    return userObject;
};

// FIXED: Better model compilation for Next.js
let User;
try {
    // Try to get existing model
    User = mongoose.models.User;
} catch (error) {
    // Model doesn't exist yet
    User = null;
}

// If model doesn't exist, create it
if (!User) {
    User = mongoose.model('User', UserSchema, 'users');
}

export default User;