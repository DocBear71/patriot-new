// file: /src/app/api/user/verification-status/route.js v1 - Check fresh verification status from database
import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user by email (case-insensitive)
        const user = await User.findOne(
            { email: { $regex: new RegExp(`^${email}$`, 'i') } },
            { isVerified: 1, emailVerifiedAt: 1 } // Only select needed fields
        );

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        console.log(`📋 Fresh verification check for ${email}: ${user.isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);

        return NextResponse.json({
            isVerified: user.isVerified || false,
            emailVerifiedAt: user.emailVerifiedAt || null
        });

    } catch (error) {
        console.error('❌ Error checking verification status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}