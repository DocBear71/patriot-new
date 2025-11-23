// file: /src/app/api/auth/resend-verification/route.js v2 - Fixed from email domain and added debug logging
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import connectDB from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting: Store attempts per email in memory (for production, use Redis)
const rateLimitStore = new Map();

// Clean up old entries every 10 minutes
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [email, data] of rateLimitStore.entries()) {
        if (data.lastAttempt < oneHourAgo) {
            rateLimitStore.delete(email);
        }
    }
}, 10 * 60 * 1000);

export async function POST(request) {
    try {
        const { email } = await request.json();

        console.log('📧 Resend verification request for:', email);
        console.log('🔧 Environment check:', {
            hasResendKey: !!process.env.RESEND_API_KEY,
            fromEmail: process.env.FROM_EMAIL || 'send@patriotthanks.com',
            nodeEnv: process.env.NODE_ENV
        });

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if Resend API key is configured
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Email service not configured' },
                { status: 500 }
            );
        }

        // Rate limiting check
        const normalizedEmail = email.toLowerCase();
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);

        let attempts = rateLimitStore.get(normalizedEmail) || { count: 0, lastAttempt: 0 };

        // Reset count if more than an hour has passed
        if (attempts.lastAttempt < oneHourAgo) {
            attempts = { count: 0, lastAttempt: 0 };
        }

        // Check if rate limit exceeded (3 attempts per hour)
        if (attempts.count >= 3) {
            const minutesUntilReset = Math.ceil((attempts.lastAttempt + (60 * 60 * 1000) - now) / (60 * 1000));
            return NextResponse.json(
                { error: `Too many verification emails sent. Please wait ${minutesUntilReset} minutes before trying again.` },
                { status: 429 }
            );
        }

        await connectDB();

        // Find user by email (case-insensitive)
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
        });

        // Don't reveal if user exists or not for security
        if (!user) {
            // Still increment rate limit even for non-existent users
            attempts.count++;
            attempts.lastAttempt = now;
            rateLimitStore.set(normalizedEmail, attempts);

            return NextResponse.json({
                message: 'If this email is registered, a verification link has been sent.'
            });
        }

        // Check if already verified
        if (user.isVerified) {
            return NextResponse.json({
                message: 'This email is already verified.'
            });
        }

        // Update rate limit
        attempts.count++;
        attempts.lastAttempt = now;
        rateLimitStore.set(normalizedEmail, attempts);

        // Generate new verification token (valid for 7 days)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Update user with new token and expiration
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        await user.save();

        // Send verification email with CORRECT from domain
        const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const verificationLink = `${baseURL}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        // Use Resend's verified domain for development, custom for production
        const fromEmail = process.env.NODE_ENV === 'production'
            ? 'Patriot Thanks <noreply@patriotthanks.com>'
            : 'Patriot Thanks <onboarding@resend.dev>';

        console.log('📨 Sending email with details:', {
            from: fromEmail,
            to: email,
            verificationToken,
            baseURL
        });

        try {
            const emailResult = await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Verify Your Email - Patriot Thanks',
                html: getVerificationEmailHTML(user.fname, verificationLink, verificationToken),
                text: getVerificationEmailText(user.fname, verificationLink, verificationToken)
            });

            console.log('✅ Resend API response:', emailResult);
            console.log(`📧 Verification email sent to: ${email}`);

            return NextResponse.json({
                message: 'Verification email sent successfully.',
                // Include debug info in development
                ...(process.env.NODE_ENV === 'development' && {
                    debug: {
                        verificationToken,
                        verificationLink,
                        expiresIn: '7 days',
                        attemptsRemaining: 3 - attempts.count,
                        emailId: emailResult.id,
                        fromEmail: fromEmail
                    }
                })
            });

        } catch (emailError) {
            console.error('❌ Error sending verification email:', emailError);
            console.error('❌ Full error details:', JSON.stringify(emailError, null, 2));

            // In development, show the actual error
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    error: 'Email sending failed',
                    details: emailError.message,
                    debug: {
                        verificationToken,
                        verificationLink,
                        fromEmail: fromEmail,
                        apiKeyExists: !!process.env.RESEND_API_KEY
                    }
                }, { status: 500 });
            }

            // In production, still return success for security
            return NextResponse.json({
                message: 'Verification email sent successfully.',
                debug: {
                    verificationToken,
                    verificationLink,
                    emailError: emailError.message,
                    note: 'Email failed to send but user token was updated'
                }
            });
        }

    } catch (error) {
        console.error('❌ Resend verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function getVerificationEmailHTML(firstName, verificationLink, verificationToken) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Patriot Thanks</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .email-container {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
            color: #333333;
        }
        .content p {
            color: #333333;
        }
        .content h2 {
            color: #1f2937;
        }
        .content h3 {
            color: #1f2937;
        }
        .verification-section {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.2s;
        }
        .verify-button:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            transform: translateY(-1px);
        }
        .code-section {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            color: #dc2626;
            letter-spacing: 3px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
        }
        .features-section {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .features-section h3 {
            color: #0c4a6e;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .features-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .features-list li {
            padding: 8px 0;
            color: #0c4a6e;
            font-size: 14px;
        }
        .features-list li:before {
            content: "✓ ";
            color: #0ea5e9;
            font-weight: bold;
            margin-right: 8px;
        }
        .footer {
            background: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0;
        }
        .security-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .header, .content, .footer { padding: 20px; }
            .verification-code { font-size: 24px; letter-spacing: 2px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🇺🇸 Patriot Thanks</h1>
            <p>Connecting service members with appreciative businesses</p>
        </div>

        <div class="content">
            <h2>Verify Your Email Address</h2>
            
            <p>Hello ${firstName},</p>
            
            <p>You're one step away from accessing all Patriot Thanks features! Please verify your email address to continue.</p>
            
            <div class="verification-section">
                <a href="${verificationLink}" class="verify-button">Verify My Email Address</a>
            </div>
            
            <div class="code-section">
                <h3>Or enter this verification code:</h3>
                <div class="verification-code">${verificationToken}</div>
                <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">
                    Copy and paste this code if the button doesn't work
                </p>
            </div>
            
            <div class="security-note">
                <strong>⏰ Important:</strong> This verification link will expire in 7 days for your security.
            </div>
            
            <div class="features-section">
                <h3>🎯 What you'll gain access to:</h3>
                <ul class="features-list">
                    <li>Find local businesses offering military and first responder discounts</li>
                    <li>Create and manage your business discount listings</li>
                    <li>Review and rate your discount experiences</li>
                    <li>Save your favorite businesses and offers</li>
                    <li>Get notifications about new discounts in your area</li>
                    <li>Connect with a community that appreciates your service</li>
                </ul>
            </div>
            
            <p><strong>Didn't request this?</strong> If you didn't create an account with Patriot Thanks, you can safely ignore this email.</p>
            
            <p>Thank you for your service and welcome to the Patriot Thanks family!</p>
            
            <p>Best regards,<br>
            <em>The Patriot Thanks Team</em></p>
        </div>
        
        <div class="footer">
            <p>This email was sent to verify your Patriot Thanks account</p>
            <p><strong>Doc Bear Enterprises, LLC</strong></p>
            <p>5249 N Park Pl NE, PMB 4011, Cedar Rapids, IA 52402</p>
            <p>© ${new Date().getFullYear()} Doc Bear Enterprises, LLC. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

function getVerificationEmailText(firstName, verificationLink, verificationToken) {
    return `
PATRIOT THANKS - VERIFY YOUR EMAIL

Hello ${firstName},

You're one step away from accessing all Patriot Thanks features! Please verify your email address to continue.

VERIFY YOUR EMAIL:
Click this link: ${verificationLink}

OR enter this verification code: ${verificationToken}

IMPORTANT: This verification link will expire in 7 days for your security.

WHAT YOU'LL GAIN ACCESS TO:
• Find local businesses offering military and first responder discounts
• Create and manage your business discount listings  
• Review and rate your discount experiences
• Save your favorite businesses and offers
• Get notifications about new discounts in your area
• Connect with a community that appreciates your service

DIDN'T REQUEST THIS?
If you didn't create an account with Patriot Thanks, you can safely ignore this email.

Thank you for your service and welcome to the Patriot Thanks family!

Best regards,
The Patriot Thanks Team

---
Doc Bear Enterprises, LLC
5249 N Park Pl NE, PMB 4011, Cedar Rapids, IA 52402
© ${new Date().getFullYear()} Doc Bear Enterprises, LLC. All rights reserved.

Patriot Thanks | Connecting Service Members with Appreciative Businesses
    `;
}