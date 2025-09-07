// file: /src/app/api/user/route.js v1 - User profile management API for Next.js App Router

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';

const { ObjectId } = mongoose.Types;

/**
 * Helper to verify user authentication and get user from token
 */
async function getUserFromToken(request) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, status: 401, message: 'Authorization required' };
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patriot-thanks-secret-key');

        // Connect to database
        connectDB();

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
 * Helper to establish database connection
 */
async function connectDB() {
    try {
        await connectDB();
        console.log("✅ Database connection established");
        return { success: true };
    } catch (dbError) {
        console.error("❌ Database connection error:", dbError);
        return {
            success: false,
            error: dbError,
            message: 'Database connection error'
        };
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
    const dbConnection = await connectDB();
    if (!dbConnection.success) {
        return NextResponse.json(
            {
                message: dbConnection.message,
                error: dbConnection.error?.message
            },
            { status: 500 }
        );
    }

    try {
        switch (operation) {
            case 'profile':
                return await handleProfileGet(request, userId);
            case 'get':
                return await handleUserGet(request, userId);
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
    const dbConnection = await connectDB();
    if (!dbConnection.success) {
        return NextResponse.json(
            {
                message: dbConnection.message,
                error: dbConnection.error?.message
            },
            { status: 500 }
        );
    }

    try {
        switch (operation) {
            case 'update':
                return await handleUserUpdate(request);
            case 'password':
                return await handlePasswordUpdate(request);
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

        // Convert to plain object and remove password
        const userData = user.toObject ? user.toObject() : { ...user };
        delete userData.password;

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

        // Create a user object without the password
        const userData = user.toObject();
        delete userData.password;

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
async function handleUserUpdate(request) {
    console.log("👤 Updating user profile");

    try {
        // Extract user data from request body
        const userData = await request.json();

        // Basic validation
        if (!userData._id) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Find the user by ID to verify it exists
        const existingUser = await User.findOne({ _id: new ObjectId(userData._id) });

        if (!existingUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        console.log("👤 Updating user:", userData._id);

        // Remove sensitive fields that shouldn't be updated via this endpoint
        delete userData.password;
        delete userData.level;
        delete userData.isAdmin;
        delete userData.created_at;

        // Set updated timestamp
        userData.updated_at = new Date();

        // Update the user
        const updatedUser = await User.findOneAndUpdate(
            { _id: new ObjectId(userData._id) },
            { $set: userData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { message: 'Failed to update user' },
                { status: 500 }
            );
        }

        // Remove password from response
        const responseData = updatedUser.toObject();
        delete responseData.password;

        console.log("✅ User updated successfully");

        return NextResponse.json({
            message: 'User updated successfully',
            user: responseData,
            success: true
        });

    } catch (error) {
        console.error('❌ Error updating user:', error);

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

        return NextResponse.json(
            { message: 'Error updating user: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle PUT request for updating user password
 */
async function handlePasswordUpdate(request) {
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