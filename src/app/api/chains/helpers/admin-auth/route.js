// file: /src/app/api/chains/helpers/admin-auth/route.js v1 - Admin authentication helper for chains API

import jwt from 'jsonwebtoken';
import connectDB from '../../../../../lib/mongodb';
import User from '../../../../../models/User';

/**
 * Helper to verify admin access for chains operations
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - Auth result with success status and user info
 */
export async function verifyAdminAccess(request) {
    try {
        // Get token from request headers
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                success: false,
                status: 401,
                message: 'Authorization required'
            };
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patriot-thanks-secret-key');
            userId = decoded.userId;
        } catch (error) {
            console.error("Token verification error:", error);
            return {
                success: false,
                status: 401,
                message: 'Invalid or expired token'
            };
        }

        // Connect to MongoDB
        try {
            await connectDB();
        } catch (dbError) {
            console.error("Database connection error:", dbError);
            return {
                success: false,
                status: 500,
                message: 'Database connection error',
                error: dbError.message
            };
        }

        // Check if user exists and has admin privileges
        const user = await User.findById(userId);

        if (!user) {
            return {
                success: false,
                status: 404,
                message: 'User not found'
            };
        }

        if (user.level !== 'Admin' && user.isAdmin !== true) {
            return {
                success: false,
                status: 403,
                message: 'Admin access required'
            };
        }

        return {
            success: true,
            userId,
            user
        };

    } catch (error) {
        console.error("Admin verification error:", error);
        return {
            success: false,
            status: 500,
            message: 'Authentication error: ' + error.message
        };
    }
}

/**
 * Middleware wrapper for admin-only routes
 * @param {Function} handler - Route handler function
 * @returns {Function} - Wrapped handler with admin check
 */
export function requireAdmin(handler) {
    return async function(request, ...args) {
        const adminCheck = await verifyAdminAccess(request);

        if (!adminCheck.success) {
            return new Response(
                JSON.stringify({ message: adminCheck.message }),
                {
                    status: adminCheck.status,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Add admin info to request for use in handler
        request.adminUser = adminCheck.user;
        request.adminUserId = adminCheck.userId;

        return await handler(request, ...args);
    };
}