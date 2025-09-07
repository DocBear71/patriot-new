// file: /src/app/api/auth/verify-email/route.js v1 - Email verification API with 7-day expiry for Patriot Thanks
import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';

export async function POST(request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Verification token is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user with this verification token
        const user = await User.findOne({
            verificationToken: token
        });

        if (!user) {
            console.log(`❌ Verification failed: Invalid token ${token}`);
            return NextResponse.json(
                { error: 'INVALID_TOKEN', message: 'Invalid verification token' },
                { status: 400 }
            );
        }

        // Check if already verified
        if (user.isVerified) {
            console.log(`✅ User ${user.email} already verified`);
            return NextResponse.json(
                { error: 'ALREADY_VERIFIED', message: 'Email is already verified' },
                { status: 400 }
            );
        }

        // Check if token has expired (7 days)
        if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
            console.log(`⏰ Verification token expired for user: ${user.email}`);
            return NextResponse.json(
                { error: 'TOKEN_EXPIRED', message: 'Verification token has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Update user as verified
        user.isVerified = true;
        user.verificationToken = null; // Clear the token
        user.verificationTokenExpires = null; // Clear expiration
        user.emailVerifiedAt = new Date();
        await user.save();

        console.log(`✅ Email verified successfully for user: ${user.email}`);

        return NextResponse.json({
            message: 'Email verified successfully! You now have access to all Patriot Thanks features.',
            success: true,
            user: {
                id: user._id,
                email: user.email,
                fname: user.fname,
                lname: user.lname,
                isVerified: true
            }
        });

    } catch (error) {
        console.error('❌ Email verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}