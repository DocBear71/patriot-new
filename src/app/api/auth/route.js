// file: src/app/api/auth/route.js v2 - Migrated to NextAuth sessions (keeping all existing functionality)

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import User from '../../../models/User.js';
import AdminCode from '../../../models/AdminCode.js';
import Business from '../../../models/Business.js';
import Incentive from '../../../models/Incentive.js';
import { getSession, isAdmin } from '../../../lib/auth-helpers';

const { ObjectId } = mongoose.Types;

// Initialize Resend (replace nodemailer)
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper to verify admin access using NextAuth session
 */
async function verifyAdminAccess() {
    try {
        const session = await getSession();

        if (!session || !session.user) {
            return { success: false, status: 401, message: 'Authentication required' };
        }

        if (!session.user.isAdmin) {
            return { success: false, status: 403, message: 'Admin access required' };
        }

        console.log('✅ Admin access verified for:', session.user.email);
        return { success: true, userId: session.user.id, user: session.user };

    } catch (error) {
        console.error("❌ Admin verification error:", error);
        return { success: false, status: 401, message: 'Session verification failed' };
    }
}

/**
 * Helper to verify any authenticated user
 */
async function verifyUserAccess() {
    try {
        const session = await getSession();

        if (!session || !session.user) {
            return { success: false, status: 401, message: 'Authentication required' };
        }

        return { success: true, userId: session.user.id, user: session.user };

    } catch (error) {
        console.error("❌ User verification error:", error);
        return { success: false, status: 401, message: 'Session verification failed' };
    }
}

/**
 * Handle GET requests
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("🔐 AUTH API: Processing GET request, operation:", operation);

    try {
        await connectDB();

        switch (operation) {
            case 'verify-session':
                return await handleVerifySession();
            case 'list-users':
                return await handleListUsers(request);
            case 'dashboard-stats':
            case 'admin-stats':
                return await handleDashboardStats(request);
            default:
                // Default information response
                return NextResponse.json({
                    message: 'NextAuth Authentication API is available',
                    operations: [
                        'verify-session', 'list-users', 'update-user', 'delete-user',
                        'dashboard-stats', 'admin-stats', 'forgot-password', 'reset-password',
                        'update-terms-acceptance', 'verify-admin'
                    ]
                });
        }
    } catch (error) {
        console.error('❌ Error in auth GET operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle POST requests
 */
export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("🔐 AUTH API: Processing POST request, operation:", operation);

    try {
        await connectDB();

        switch (operation) {
            case 'register':
                return await handleRegister(request);
            case 'verify-admin':
                return await handleVerifyAdmin(request);
            case 'forgot-password':
                return await handleForgotPassword(request);
            case 'reset-password':
                return await handleResetPassword(request);
            case 'update-terms-acceptance':
                return await handleUpdateTermsAcceptance(request);
            case 'resend-verification':
                return await handleResendVerification(request);
            default:
                return NextResponse.json(
                    { message: 'Invalid operation for POST request' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('❌ Error in auth POST operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle PUT requests
 */
export async function PUT(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("🔐 AUTH API: Processing PUT request, operation:", operation);

    try {
        await connectDB();

        switch (operation) {
            case 'update-user':
                return await handleUpdateUser(request);
            default:
                return NextResponse.json(
                    { message: 'Invalid operation for PUT request' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('❌ Error in auth PUT operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle DELETE requests
 */
export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("🔐 AUTH API: Processing DELETE request, operation:", operation);

    try {
        await connectDB();

        switch (operation) {
            case 'delete-user':
                return await handleDeleteUser(request);
            default:
                return NextResponse.json(
                    { message: 'Invalid operation for DELETE request' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('❌ Error in auth DELETE operations:', error);
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
                'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        }
    );
}

/**
 * Handle session verification (replaces token verification)
 */
async function handleVerifySession() {
    console.log("🔍 Verifying NextAuth session");

    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'No active session' },
                { status: 401 }
            );
        }

        console.log("✅ Session verified successfully");

        return NextResponse.json({
            isValid: true,
            userId: session.user.id,
            isAdmin: session.user.isAdmin || false,
            level: session.user.level,
            name: `${session.user.fname} ${session.user.lname}`,
            email: session.user.email
        });

    } catch (error) {
        console.error('❌ Session verification error:', error);
        return NextResponse.json(
            { message: 'Session verification failed', error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle user registration (keep existing functionality)
 */
async function handleRegister(request) {
    console.log("👤 Processing user registration");

    try {
        const userData = await request.json();

        // Basic validation
        if (!userData.email || (!userData.password && !userData.psw)) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (userData.termsAccepted !== true) {
            return NextResponse.json(
                { message: 'You must accept the Terms of Use to register' },
                { status: 400 }
            );
        }

        // Normalize email to lowercase for case-insensitive matching
        userData.email = userData.email.toLowerCase();
        console.log("Normalized email for registration:", userData.email);

        // Check if user already exists - use case-insensitive search
        const existingUser = await User.findOne({
            email: { $regex: new RegExp(`^${userData.email}$`, 'i') }
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Add timestamp fields
        userData.created_at = new Date();
        userData.updated_at = new Date();
        userData.termsAccepted = true;
        userData.termsAcceptedDate = new Date();
        userData.termsVersion = userData.termsVersion || "August 18, 2025";

        // Check if Admin level and set isAdmin flag
        if (userData.level === 'Admin') {
            userData.isAdmin = true;
        }

        // Remove password repeat field before storing
        if (userData.psw_repeat) delete userData.psw_repeat;

        // Rename password field if necessary
        if (userData.psw && !userData.password) {
            userData.password = userData.psw;
            delete userData.psw;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        userData.password = hashedPassword;

        console.log("Inserting user data...");
        // Insert user data using mongoose
        const newUser = new User(userData);
        const result = await newUser.save();
        console.log("✅ User inserted successfully:", result._id);

        return NextResponse.json({
            message: 'User registered successfully',
            userId: result._id
        }, { status: 201 });

    } catch (error) {
        console.error('❌ User creation failed:', error);
        return NextResponse.json(
            { message: 'Server error during user creation: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle admin code verification (keep existing functionality)
 */
async function handleVerifyAdmin(request) {
    console.log("🔐 Verifying admin code");

    try {
        const { code, userId } = await request.json();

        // Basic validation
        if (!code) {
            return NextResponse.json(
                { message: 'Access code is required' },
                { status: 400 }
            );
        }

        // Find the code in the admin_codes collection
        const adminCode = await AdminCode.findOne({ code: code });

        if (!adminCode) {
            return NextResponse.json(
                { message: 'Invalid admin access code' },
                { status: 401 }
            );
        }

        // Check if code is expired
        if (adminCode.expiration && new Date() > new Date(adminCode.expiration)) {
            return NextResponse.json(
                { message: 'Admin access code has expired' },
                { status: 401 }
            );
        }

        // If userId is provided, update the user's status to Admin
        if (userId) {
            await User.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { level: 'Admin', isAdmin: true, updated_at: new Date() } }
            );
        }

        console.log("✅ Admin access verified successfully");

        return NextResponse.json({
            message: 'Admin access verified successfully',
            description: adminCode.description,
            access: true
        });

    } catch (error) {
        console.error('❌ Admin verification error:', error);
        return NextResponse.json(
            { message: 'Server error during admin verification: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle updating terms acceptance (session-based)
 */
async function handleUpdateTermsAcceptance(request) {
    console.log("📋 Updating terms acceptance");

    try {
        // Verify user session
        const userAccess = await verifyUserAccess();
        if (!userAccess.success) {
            return NextResponse.json(
                { message: userAccess.message },
                { status: userAccess.status }
            );
        }

        const { userId, termsAccepted, termsAcceptedDate, termsVersion } = await request.json();

        // Use session user ID if not provided
        const targetUserId = userId || userAccess.userId;

        // Basic validation
        if (!targetUserId || termsAccepted === undefined) {
            return NextResponse.json(
                { message: 'User ID and terms acceptance are required' },
                { status: 400 }
            );
        }

        // Update the user
        const result = await User.updateOne(
            { _id: new ObjectId(targetUserId) },
            {
                $set: {
                    termsAccepted: termsAccepted,
                    termsAcceptedDate: termsAcceptedDate || new Date(),
                    termsVersion: termsVersion || "August 18, 2025",
                    updated_at: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        console.log("✅ Terms acceptance updated successfully");

        return NextResponse.json({
            message: 'Terms acceptance updated successfully',
            success: true
        });

    } catch (error) {
        console.error('❌ Error updating terms acceptance:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle listing users for the admin dashboard (admin access required)
 */
async function handleListUsers(request) {
    console.log("📋 Admin listing users");

    try {
        // Verify admin access
        const adminAccess = await verifyAdminAccess();
        if (!adminAccess.success) {
            return NextResponse.json(
                { message: adminAccess.message },
                { status: adminAccess.status }
            );
        }

        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        // Search filter (search by name or email)
        if (searchParams.get('search')) {
            const searchRegex = new RegExp(searchParams.get('search'), 'i');
            filter.$or = [
                { fname: searchRegex },
                { lname: searchRegex },
                { email: searchRegex }
            ];
        }

        // Status filter
        if (searchParams.get('status')) {
            filter.status = searchParams.get('status');
        }

        // Level filter
        if (searchParams.get('level')) {
            filter.level = searchParams.get('level');
        }

        console.log("User filter:", filter);

        // Get total count
        const total = await User.countDocuments(filter);

        // Get users
        const users = await User.find(filter)
            .select('-password') // Exclude password
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        console.log(`✅ Found ${users.length} users (total: ${total})`);

        return NextResponse.json({
            users,
            total,
            totalUsers: total, // Add this for compatibility
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('❌ Error getting users:', error);
        return NextResponse.json(
            { message: 'Error retrieving users', error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle user updates (admin functionality)
 */
async function handleUpdateUser(request) {
    console.log("✏️ Admin updating user");

    // Verify admin access
    const adminAccess = await verifyAdminAccess();
    if (!adminAccess.success) {
        return NextResponse.json(
            { message: adminAccess.message },
            { status: adminAccess.status }
        );
    }

    try {
        const userData = await request.json();
        const userId = userData.userId;

        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Remove userId from update data
        delete userData.userId;

        // Add timestamp
        userData.updated_at = new Date();

        // Hash password if provided
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 12);
        } else {
            // Don't update password if not provided
            delete userData.password;
        }

        // Update the user
        const result = await User.findByIdAndUpdate(
            userId,
            { $set: userData },
            { new: true }
        );

        if (!result) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        console.log("✅ User updated successfully");

        return NextResponse.json({
            message: 'User updated successfully',
            userId: result._id
        });

    } catch (error) {
        console.error('❌ Error updating user:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle user deletion (admin functionality)
 */
async function handleDeleteUser(request) {
    console.log("🗑️ Admin deleting user");

    // Verify admin access
    const adminAccess = await verifyAdminAccess();
    if (!adminAccess.success) {
        return NextResponse.json(
            { message: adminAccess.message },
            { status: adminAccess.status }
        );
    }

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Prevent deleting self
        if (userId === adminAccess.userId) {
            return NextResponse.json(
                { message: 'You cannot delete your own account' },
                { status: 403 }
            );
        }

        // Delete the user
        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        console.log("✅ User deleted successfully");

        return NextResponse.json({
            message: 'User deleted successfully',
            userId: userId
        });

    } catch (error) {
        console.error('❌ Error deleting user:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle forgot password request (using Resend instead of nodemailer)
 */
async function handleForgotPassword(request) {
    console.log("🔄 Processing forgot password request");

    try {
        const { email } = await request.json();

        // Basic validation
        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase();
        console.log("Normalized email for password reset:", normalizedEmail);

        // Find user by email - use case-insensitive search
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
        });

        // Don't reveal if user exists for security
        if (!user) {
            console.log(`No user found with email: ${normalizedEmail}`);
            return NextResponse.json({
                message: 'If this email is registered, a reset link has been sent.'
            });
        }

        // Generate a secure reset token (6-digit code for simplicity)
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Store the reset token and expiration in the user document
        user.resetToken = resetToken;
        user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
        await user.save();

        // Get base URL for reset link
        const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetLink = `${baseURL}/auth/reset-password?token=${resetToken}`;

        try {
            // Send email using Resend
            const emailResult = await resend.emails.send({
                from: process.env.FROM_EMAIL || 'send@patriotthanks.com',
                to: email,
                subject: 'Patriot Thanks - Password Reset Request',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1e40af; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f8fafc;">
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your Patriot Thanks account.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block;">
                                ${resetToken}
                            </div>
                        </div>
                        <p>Enter this code on the password reset page, or click the link below:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${resetLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>This code will expire in 1 hour for security reasons.</p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <p>Thank you,<br>The Patriot Thanks Team</p>
                    </div>
                </div>
                `
            });

            console.log("✅ Password reset email sent:", emailResult.data?.id);

            return NextResponse.json({
                message: 'If this email is registered, a reset code has been sent.'
            });

        } catch (emailError) {
            console.error('❌ Error sending password reset email:', emailError);

            // Return success message anyway for security (don't reveal email sending failures)
            return NextResponse.json({
                message: 'If this email is registered, a reset code has been sent.',
                ...(process.env.NODE_ENV === 'development' && {
                    resetToken,
                    resetLink,
                    emailError: emailError.message
                })
            });
        }

    } catch (error) {
        console.error('❌ Error in forgot password:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle password reset (keep existing functionality)
 */
async function handleResetPassword(request) {
    console.log("🔐 Processing password reset");

    try {
        const { token, password } = await request.json();

        // Basic validation
        if (!token || !password) {
            return NextResponse.json(
                { message: 'Reset code and new password are required' },
                { status: 400 }
            );
        }

        // Find user with this reset token and check if it's still valid
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid or expired reset code' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update the user's password and clear the reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        user.updated_at = new Date();
        await user.save();

        console.log("✅ Password has been reset successfully");

        return NextResponse.json({
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('❌ Error in reset password:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle resend verification email
 */
async function handleResendVerification(request) {
    console.log("📧 Resending verification email");

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (!user) {
            return NextResponse.json({
                message: 'If this email is registered, a verification link has been sent.'
            });
        }

        if (user.isVerified) {
            return NextResponse.json({
                message: 'This email is already verified.'
            });
        }

        // Generate verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationToken;
        await user.save();

        const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const verificationLink = `${baseURL}/auth/verify-email?token=${verificationToken}`;

        try {
            await resend.emails.send({
                from: process.env.FROM_EMAIL || 'send@patriotthanks.com',
                to: email,
                subject: 'Patriot Thanks - Verify Your Email',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1e40af; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f8fafc;">
                        <p>Welcome to Patriot Thanks!</p>
                        <p>Please verify your email address to complete your registration.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
                        </div>
                        <p>Or enter this code: <strong>${verificationToken}</strong></p>
                        <p>Thank you,<br>The Patriot Thanks Team</p>
                    </div>
                </div>
                `
            });

            return NextResponse.json({
                message: 'Verification email sent successfully.'
            });

        } catch (emailError) {
            console.error('❌ Error sending verification email:', emailError);
            return NextResponse.json({
                message: 'Verification email sent successfully.',
                ...(process.env.NODE_ENV === 'development' && {
                    verificationToken,
                    verificationLink
                })
            });
        }

    } catch (error) {
        console.error('❌ Error in resend verification:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle dashboard statistics for admin dashboard (admin access required)
 */
async function handleDashboardStats(request) {
    console.log("📊 Getting dashboard statistics");

    try {
        // Verify admin access
        const adminAccess = await verifyAdminAccess();
        if (!adminAccess.success) {
            return NextResponse.json(
                { message: adminAccess.message },
                { status: adminAccess.status }
            );
        }

        // Calculate date ranges for this month and last month
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthEnd = new Date(thisMonthStart);
        lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
        const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);

        // Initialize stats objects with default values
        let stats = {
            userCount: 0,
            totalUsers: 0, // Add for compatibility
            userChange: 0,
            newUsersThisMonth: 0,
            businessCount: 0,
            businessChange: 0,
            newBusinessesThisMonth: 0,
            incentiveCount: 0,
            totalIncentives: 0, // Add for compatibility
            incentiveChange: 0,
            newIncentivesThisMonth: 0,
            availableIncentiveCount: 0
        };

        console.log('Model availability check:', {
            'User': !!User,
            'Business': !!Business,
            'Incentive': !!Incentive
        });

        // Get user stats if User model is available
        if (User) {
            try {
                console.log('Fetching user stats...');
                // Get user count and growth
                stats.userCount = await User.countDocuments();
                stats.totalUsers = stats.userCount; // For compatibility
                console.log(`Found ${stats.userCount} users`);

                // Get count of users created last month
                const lastMonthUsers = await User.countDocuments({
                    created_at: {
                        $gte: lastMonthStart,
                        $lte: lastMonthEnd
                    }
                });
                console.log(`Found ${lastMonthUsers} users from last month`);

                stats.newUsersThisMonth = await User.countDocuments({
                    created_at: {
                        $gte: thisMonthStart
                    }
                });
                console.log(`Found ${stats.newUsersThisMonth} new users this month`);

                // Calculate User change percentage
                if (stats.userCount > 0 && lastMonthUsers > 0) {
                    stats.userChange = Math.round(((stats.userCount - lastMonthUsers) / lastMonthUsers) * 100);
                } else if (stats.newUsersThisMonth > 0 && stats.userCount > 0) {
                    stats.userChange = Math.round((stats.newUsersThisMonth / stats.userCount) * 100);
                }
            } catch (userError) {
                console.error('Error getting user stats:', userError);
                // Continue with default values
            }
        }

        // Get business stats if Business model is available
        if (Business) {
            try {
                console.log('Fetching business stats...');
                // Get business count and growth
                stats.businessCount = await Business.countDocuments();
                console.log(`Found ${stats.businessCount} businesses`);

                // Get count of businesses created last month
                const lastMonthBusinesses = await Business.countDocuments({
                    created_at: {
                        $gte: lastMonthStart,
                        $lte: lastMonthEnd
                    }
                });
                console.log(`Found ${lastMonthBusinesses} businesses from last month`);

                // Get count of businesses created this month
                stats.newBusinessesThisMonth = await Business.countDocuments({
                    created_at: {
                        $gte: thisMonthStart
                    }
                });
                console.log(`Found ${stats.newBusinessesThisMonth} new businesses this month`);

                // Calculate business change percentage
                if (stats.businessCount > 0 && lastMonthBusinesses > 0) {
                    stats.businessChange = Math.round(((stats.businessCount - lastMonthBusinesses) / lastMonthBusinesses) * 100);
                } else if (stats.newBusinessesThisMonth > 0 && stats.businessCount > 0) {
                    stats.businessChange = Math.round((stats.newBusinessesThisMonth / stats.businessCount) * 100);
                }
            } catch (businessError) {
                console.error('Error getting business stats:', businessError);
                // Continue with default values
            }
        }

        // Get incentive stats if Incentive model is available
        if (Incentive) {
            try {
                console.log('Fetching incentive stats...');
                // Get incentive count and growth
                stats.incentiveCount = await Incentive.countDocuments();
                stats.totalIncentives = stats.incentiveCount; // For compatibility
                console.log(`Found ${stats.incentiveCount} incentives`);

                // Get count of incentives created last month
                const lastMonthIncentives = await Incentive.countDocuments({
                    created_at: {
                        $gte: lastMonthStart,
                        $lte: lastMonthEnd
                    }
                });
                console.log(`Found ${lastMonthIncentives} incentives from last month`);

                // Get count of incentives created this month
                stats.newIncentivesThisMonth = await Incentive.countDocuments({
                    created_at: {
                        $gte: thisMonthStart
                    }
                });
                console.log(`Found ${stats.newIncentivesThisMonth} new incentives this month`);

                // Calculate incentive change percentage
                if (stats.incentiveCount > 0 && lastMonthIncentives > 0) {
                    stats.incentiveChange = Math.round(((stats.incentiveCount - lastMonthIncentives) / lastMonthIncentives) * 100);
                } else if (stats.newIncentivesThisMonth > 0 && stats.incentiveCount > 0) {
                    stats.incentiveChange = Math.round((stats.newIncentivesThisMonth / stats.incentiveCount) * 100);
                }

                // Get count of available incentives
                stats.availableIncentiveCount = await Incentive.countDocuments({
                    is_available: true
                });
                console.log(`Found ${stats.availableIncentiveCount} available incentives`);
            } catch (incentiveError) {
                console.error('Error getting incentive stats:', incentiveError);
                // Continue with default values
            }
        }

        console.log('✅ Final stats:', stats);

        return NextResponse.json(stats);

    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);

        // Return basic stats if possible
        return NextResponse.json({
            userCount: 0,
            totalUsers: 0,
            userChange: 0,
            newUsersThisMonth: 0,
            businessCount: 0,
            businessChange: 0,
            newBusinessesThisMonth: 0,
            incentiveCount: 0,
            totalIncentives: 0,
            incentiveChange: 0,
            newIncentivesThisMonth: 0,
            availableIncentiveCount: 0,
            error: 'Error retrieving dashboard statistics: ' + error.message
        });
    }
}