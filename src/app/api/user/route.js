// file: /src/app/api/user/route.js v3 - every operation needs a NextAuth session and acts only on
//   the signed-in user; update whitelists fields and status values; responses whitelisted
//   (no password or tokens)
// v2 - no hardcoded JWT secret fallback; missing JWT_SECRET
//   returns a 500 instead of a misleading 401
// v1 - User profile management API for Next.js App Router

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

const { ObjectId } = mongoose.Types;


// Fields a user may change on their own profile
const EDITABLE_FIELDS = ['fname', 'lname', 'address1', 'address2', 'city', 'state', 'zip', 'status'];
// Must match statusOptions on /profile
const ALLOWED_STATUS = ['VT', 'AD', 'FR', 'SP', 'BO', 'VBO', 'SU'];
// Fields returned to the profile page; never password or tokens
const PUBLIC_PROFILE_FIELDS = ['_id', 'fname', 'lname', 'email', 'address1', 'address2',
    'city', 'state', 'zip', 'status', 'level'];

function toPublicProfile(user) {
    const src = user.toObject ? user.toObject() : user;
    const out = {};
    for (const field of PUBLIC_PROFILE_FIELDS) {
        if (src[field] !== undefined) out[field] = src[field];
    }
    return out;
}

// The signed-in user's id from the NextAuth session cookie, or null
async function getSessionUserId() {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
}

/**
 * Helper to verify user authentication and get user from token
 */
async function getUserFromToken(request) {
    // Checked before the try: its catch reports every error as a 401
    // "Invalid or expired token", which would hide a server misconfiguration.
    if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET is not set in the environment');
        return { success: false, status: 500, message: 'Server misconfigured: JWT_SECRET is not set' };
    }
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, status: 401, message: 'Authorization required' };
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Connect to database
        await connectDB();

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return { success: false, status: 404, message: 'User not found' };
        }

        return { success: true, user, userId: decoded.userId };

    } catch (error) {
        console.error("Token verification error:", error);
        return { success: false, status: 401, message: 'Invalid or expired token' };
    }
}

/**
 * Handle GET requests - User profile operations
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const userId = searchParams.get('userId') || searchParams.get('id');

    console.log("👤 USER API: Processing GET request, operation:", operation);

    // Connect to database
    try {
        await connectDB();
    } catch (error) {
        return NextResponse.json(
            { message: 'Database connection error: ' + error.message },
            { status: 500 }
        );
    }

    // Must be signed in, and may only read their own record. The query's
    // userId is checked against the session, never trusted on its own.
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
        return NextResponse.json(
            { message: 'Sign in required' },
            { status: 401 }
        );
    }
    if (userId && userId !== sessionUserId) {
        return NextResponse.json(
            { message: 'You can only view your own profile' },
            { status: 403 }
        );
    }

    try {
        switch (operation) {
            case 'profile':
                return await handleProfileGet(request, sessionUserId);
            case 'get':
                return await handleUserGet(request, sessionUserId);
            default:
                // Default response - list available operations
                return NextResponse.json({
                    message: 'User API is available',
                    operations: ['profile', 'get', 'update', 'password']
                });
        }
    } catch (error) {
        console.error('❌ Error in user GET operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle PUT requests - User profile updates
 */
export async function PUT(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("👤 USER API: Processing PUT request, operation:", operation);

    // Connect to database
    try {
        await connectDB();
    } catch (error) {
        return NextResponse.json(
            { message: 'Database connection error: ' + error.message },
            { status: 500 }
        );
    }

    // Must be signed in; handlers act only on this user
    const sessionUserId = await getSessionUserId();
    if (!sessionUserId) {
        return NextResponse.json(
            { message: 'Sign in required' },
            { status: 401 }
        );
    }

    try {
        switch (operation) {
            case 'update':
                return await handleUserUpdate(request, sessionUserId);
            case 'password':
                return await handlePasswordUpdate(request, sessionUserId);
            default:
                return NextResponse.json(
                    { message: 'Invalid operation for PUT request' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('❌ Error in user PUT operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
    return NextResponse.json(
        { message: 'CORS preflight successful' },
        {
            status: 200,
            headers: {
                'Allow': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        }
    );
}

/**
 * Handle GET request for user profile
 */
async function handleProfileGet(request, userId) {
    console.log("👤 Getting user profile for ID:", userId);

    if (!userId) {
        return NextResponse.json(
            { message: 'User ID is required' },
            { status: 400 }
        );
    }

    try {
        // Find the user
        let user;
        try {
            user = await User.findOne({ _id: new ObjectId(userId) });
        } catch (error) {
            console.log("Trying with string ID after ObjectId error:", error.message);
            // Try with string ID if ObjectId fails
            user = await User.findOne({ _id: userId });
        }

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Whitelisted fields only (no password, resetToken, verificationToken)
        const userData = toPublicProfile(user);

        console.log("✅ Returning user profile data");

        return NextResponse.json({
            user: userData,
            success: true
        });

    } catch (error) {
        console.error('❌ Error getting user profile:', error);
        return NextResponse.json(
            { message: 'Error retrieving user profile: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle GET request for user by ID
 */
async function handleUserGet(request, userId) {
    console.log("👤 Getting user by ID:", userId);

    if (!userId) {
        return NextResponse.json(
            { message: 'User ID is required' },
            { status: 400 }
        );
    }

    try {
        // Find the user
        const user = await User.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Whitelisted fields only (no password, resetToken, verificationToken)
        const userData = toPublicProfile(user);

        console.log("✅ User data retrieved successfully");

        return NextResponse.json({
            user: userData,
            success: true
        });

    } catch (error) {
        console.error('❌ Error getting user:', error);
        return NextResponse.json(
            { message: 'Error retrieving user: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle PUT request for updating user profile
 */
async function handleUserUpdate(request, sessionUserId) {
    console.log("👤 Updating user profile");

    try {
        // Extract user data from request body
        const userData = await request.json();
        console.log("Received userData:", JSON.stringify(userData, null, 2));

        // Basic validation
        if (!userData._id) {
            console.error("❌ No user ID provided");
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Only the signed-in user's own profile can be updated here
        if (String(userData._id) !== sessionUserId) {
            return NextResponse.json(
                { message: 'You can only update your own profile' },
                { status: 403 }
            );
        }

        console.log("Looking for user with ID:", userData._id);

        // Find the user - try both ObjectId and string
        let existingUser;
        try {
            // First try with ObjectId
            existingUser = await User.findById(userData._id);
            console.log("Found user with findById");
        } catch (error) {
            console.log("FindById failed, trying alternative method:", error.message);
            // Try alternative query methods
            existingUser = await User.findOne({ _id: userData._id });
            console.log("Found user with findOne");
        }

        if (!existingUser) {
            console.error("❌ User not found with ID:", userData._id);
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        console.log("✅ Found existing user:", existingUser._id);

        // Whitelist: only these fields can change here. Email has its own
        // verified flow (/api/auth/update-email); level, isAdmin, isVerified,
        // tokens and veteranBusinessOwner are never user-writable.
        const updates = {};
        for (const field of EDITABLE_FIELDS) {
            if (userData[field] !== undefined) updates[field] = userData[field];
        }
        if (updates.status !== undefined && !ALLOWED_STATUS.includes(updates.status)) {
            return NextResponse.json(
                { message: 'Invalid status value' },
                { status: 400 }
            );
        }
        updates.updated_at = new Date();

        console.log("Updating with data:", JSON.stringify(updates, null, 2));

        // Update the user using the existing user's _id
        const updatedUser = await User.findByIdAndUpdate(
            existingUser._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error("❌ Update operation returned null");
            return NextResponse.json(
                { message: 'Failed to update user' },
                { status: 500 }
            );
        }

        console.log("✅ User updated successfully");

        // Remove password from response
        const responseData = toPublicProfile(updatedUser);

        return NextResponse.json({
            message: 'User updated successfully',
            user: responseData,
            success: true
        });

    } catch (error) {
        console.error('❌ Error updating user:', error);
        console.error('Error stack:', error.stack);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                {
                    message: 'Validation error: ' + error.message,
                    errors: error.errors
                },
                { status: 400 }
            );
        }

        // Handle cast errors (invalid ObjectId)
        if (error.name === 'CastError') {
            return NextResponse.json(
                {
                    message: 'Invalid user ID format: ' + error.message
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                message: 'Error updating user: ' + error.message,
                errorType: error.name
            },
            { status: 500 }
        );
    }
}

/**
 * Handle PUT request for updating user password
 */
async function handlePasswordUpdate(request, sessionUserId) {
    console.log("🔐 Updating user password");

    try {
        // Extract password data from request body
        const { userId, currentPassword, newPassword } = await request.json();

        // Basic validation
        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json(
                { message: 'User ID, current password, and new password are required' },
                { status: 400 }
            );
        }

        // Only the signed-in user's own password can be changed here
        if (userId !== sessionUserId) {
            return NextResponse.json(
                { message: 'You can only change your own password' },
                { status: 403 }
            );
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: 'New password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Find the user
        const user = await User.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { message: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password
        const updatedUser = await User.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    password: hashedNewPassword,
                    updated_at: new Date()
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { message: 'Failed to update password' },
                { status: 500 }
            );
        }

        console.log("✅ Password updated successfully for user:", userId);

        return NextResponse.json({
            message: 'Password updated successfully',
            success: true
        });

    } catch (error) {
        console.error('❌ Error updating password:', error);
        return NextResponse.json(
            { message: 'Error updating password: ' + error.message },
            { status: 500 }
        );
    }
}