// file: /src/app/api/auth/update-email/route.js v1 - Email update endpoint with verification

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
    console.log('📧 Update email request received');

    try {
        // Get current session
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse request body
        const { newEmail, password } = await request.json();

        // Validate inputs
        if (!newEmail || !newEmail.includes('@')) {
            return NextResponse.json(
                { error: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                { error: 'Password is required to update email' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Find current user
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${session.user.email}$`, 'i') }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Check if new email is already in use
        const normalizedNewEmail = newEmail.toLowerCase();
        const existingUser = await User.findOne({
            email: { $regex: new RegExp(`^${normalizedNewEmail}$`, 'i') },
            _id: { $ne: user._id }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'This email address is already in use' },
                { status: 409 }
            );
        }

        // Generate new verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Store pending email change
        user.pendingEmail = normalizedNewEmail;
        user.pendingEmailToken = verificationToken;
        user.pendingEmailTokenExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // Send verification email to NEW email address
        const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const verificationLink = `${baseURL}/auth/verify-new-email?token=${verificationToken}`;

        try {
            await resend.emails.send({
                from: process.env.FROM_EMAIL || 'noreply@patriotthanks.com',
                to: normalizedNewEmail,
                subject: 'Verify Your New Email - Patriot Thanks',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1e40af; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Verify Your New Email</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f8fafc;">
                        <p>Hello ${user.fname},</p>
                        <p>You requested to change your email address for your Patriot Thanks account.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background-color: #dc2626; color: white; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; display: inline-block;">
                                ${verificationToken}
                            </div>
                        </div>
                        <p>Click the link below to verify your new email address:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${verificationLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify New Email</a>
                        </div>
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This verification link will expire in 1 hour</li>
                            <li>Your current email (${user.email}) will remain active until you verify this new email</li>
                            <li>If you didn't request this change, please ignore this email or contact support</li>
                        </ul>
                        <p>Thank you,<br>The Patriot Thanks Team</p>
                    </div>
                </div>
                `
            });

            console.log('✅ Verification email sent to new address:', normalizedNewEmail);

            return NextResponse.json({
                message: 'Verification email sent to your new email address. Please check your inbox.',
                pendingEmail: normalizedNewEmail
            });

        } catch (emailError) {
            console.error('❌ Error sending verification email:', emailError);

            // Clean up pending email data if email fails
            user.pendingEmail = undefined;
            user.pendingEmailToken = undefined;
            user.pendingEmailTokenExpires = undefined;
            await user.save();

            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Update email error:', error);
        return NextResponse.json(
            { error: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}