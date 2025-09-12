// file: src/lib/auth.js - Simple, traditional NextAuth configuration

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import User from '../models/User';

console.log('🔧 Loading NextAuth configuration...');

// Auth options configuration
export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log('❌ Missing credentials');
                    return null;
                }

                try {
                    console.log('🔐 Attempting to authorize:', credentials.email);
                    await connectDB();

                    // Find user by email (case-insensitive)
                    const user = await User.findOne({
                        email: { $regex: new RegExp(`^${credentials.email}$`, 'i') }
                    });

                    if (!user) {
                        console.log('❌ User not found:', credentials.email);
                        return null;
                    }

                    // Check if user account is active
                    if (user.status === 'inactive') {
                        console.log('❌ User account is inactive:', credentials.email);
                        return null;
                    }

                    // Check email verification if required
                    if (user.isVerified === false) {
                        console.log('❌ Email not verified:', credentials.email);
                        throw new Error('EMAIL_NOT_VERIFIED');
                    }

                    // Verify password
                    let isPasswordValid;
                    if (user.comparePassword && typeof user.comparePassword === 'function') {
                        isPasswordValid = await user.comparePassword(credentials.password);
                    } else {
                        isPasswordValid = await bcrypt.compare(credentials.password, user.password);
                    }

                    if (!isPasswordValid) {
                        console.log('❌ Invalid password for:', credentials.email);
                        return null;
                    }

                    console.log('✅ User authenticated successfully:', {
                        id: user._id.toString(),
                        email: user.email,
                        fname: user.fname,
                        lname: user.lname,
                        level: user.level,
                        status: user.status,
                        isAdmin: user.isAdmin || user.level === 'Admin'
                    });

                    // Return user object for session
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: `${user.fname} ${user.lname}`,
                        fname: user.fname,
                        lname: user.lname,
                        isAdmin: user.isAdmin || user.level === 'Admin',
                        status: user.status || 'SU',
                        level: user.level || 'Free',
                        address1: user.address1,
                        address2: user.address2,
                        city: user.city,
                        state: user.state,
                        zip: user.zip,
                        termsAccepted: user.termsAccepted || false,
                        termsVersion: user.termsVersion,
                        termsAcceptedDate: user.termsAcceptedDate,
                        preferences: user.preferences || {},
                        isVerified: user.isVerified || false
                    };

                } catch (error) {
                    console.error('❌ Authorization error:', error);

                    if (error.message === 'EMAIL_NOT_VERIFIED') {
                        throw new Error('email-not-verified');
                    }

                    return null;
                }
            }
        })
    ],

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },

    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/signin',
    },

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.fname = user.fname;
                token.lname = user.lname;
                token.isAdmin = user.isAdmin;
                token.status = user.status;
                token.level = user.level;
                token.address1 = user.address1;
                token.address2 = user.address2;
                token.city = user.city;
                token.state = user.state;
                token.zip = user.zip;
                token.termsAccepted = user.termsAccepted;
                token.termsVersion = user.termsVersion;
                token.termsAcceptedDate = user.termsAcceptedDate;
                token.preferences = user.preferences;
                token.isVerified = user.isVerified;

                console.log('🎫 JWT token created for Patriot Thanks:', {
                    id: token.id,
                    email: token.email,
                    fname: token.fname,
                    lname: token.lname,
                    level: token.level,
                    isAdmin: token.isAdmin,
                    status: token.status
                });
            }

            // Handle session updates
            if (trigger === 'update' && session) {
                token = { ...token, ...session };
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.fname = token.fname;
                session.user.lname = token.lname;
                session.user.isAdmin = token.isAdmin;
                session.user.status = token.status;
                session.user.level = token.level;
                session.user.address1 = token.address1;
                session.user.address2 = token.address2;
                session.user.city = token.city;
                session.user.state = token.state;
                session.user.zip = token.zip;
                session.user.termsAccepted = token.termsAccepted;
                session.user.termsVersion = token.termsVersion;
                session.user.termsAcceptedDate = token.termsAcceptedDate;
                session.user.preferences = token.preferences;
                session.user.isVerified = token.isVerified;

                console.log('👤 Session created for Patriot Thanks:', {
                    id: session.user.id,
                    email: session.user.email,
                    fname: session.user.fname,
                    lname: session.user.lname,
                    level: session.user.level,
                    isAdmin: session.user.isAdmin,
                    status: session.user.status
                });
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            console.log('🔄 Auth redirect:', url, '→', baseUrl);

            // Handle signout
            if (url.includes('signout') || url.includes('signOut')) {
                return '/';
            }

            // Handle relative URLs
            if (url.startsWith('/')) {
                return url;
            }

            // Check if URL is from same origin
            try {
                if (new URL(url).origin === baseUrl) {
                    return url;
                }
            } catch (e) {
                // Invalid URL, use default
            }

            // Default redirect for successful login
            return '/dashboard';
        },

        async signIn({ user, account, profile }) {
            console.log('✅ SignIn callback - User authenticated:', {
                id: user.id,
                email: user.email,
                isAdmin: user.isAdmin
            });
            return true;
        },
    },

    events: {
        async signIn({ user, account, profile, isNewUser }) {
            console.log('📝 User signed in to Patriot Thanks:', user.email);
        },
        async signOut({ session, token }) {
            console.log('👋 User signed out from Patriot Thanks');
        }
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    trustHost: true,
};

console.log('✅ NextAuth auth options configured successfully');