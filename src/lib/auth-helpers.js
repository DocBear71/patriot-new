// file: src/lib/auth-helpers.js
// Helper functions for authentication in server components

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Get the current session in server components
 */
export async function getSession() {
    return await getServerSession(authOptions);
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated() {
    const session = await getSession();
    return !!session?.user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
    const session = await getSession();
    return session?.user?.isAdmin === true;
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user || null;
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error('Authentication required');
    }
    return session.user;
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error('Authentication required');
    }
    if (!session.user.isAdmin) {
        throw new Error('Admin access required');
    }
    return session.user;
}