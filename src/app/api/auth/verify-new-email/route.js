// file: /src/app/api/auth/verify-new-email/route.js v1 - Verify and activate new email

import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(request) {
    console.log('✅ Verify new email request received');

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Verification token is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user with this pending email token
        const user = await User.findOne({
            pendingEmailToken: token,
            pendingEmailTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired verification token' },
                { status: 400 }
            );
        }

        // Update user's email and clear pending data
        const oldEmail = user.email;
        const newEmail = user.pendingEmail;

        user.email = newEmail;
        user.isVerified = true; // Mark as verified since they verified the new email
        user.pendingEmail = undefined;
        user.pendingEmailToken = undefined;
        user.pendingEmailTokenExpires = undefined;
        user.updated_at = new Date();

        await user.save();

        console.log(`✅ Email updated successfully from ${oldEmail} to ${newEmail}`);

        return NextResponse.json({
            message: 'Email verified and updated successfully!',
            newEmail: newEmail
        });

    } catch (error) {
        console.error('❌ Verify new email error:', error);
        return NextResponse.json(
            { error: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}