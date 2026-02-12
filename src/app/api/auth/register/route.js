// file: /src/app/api/auth/register/route.js v3 - Added bot protection (honeypot, timing, rate limit, reCAPTCHA v3)
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import connectDB from '../../../../lib/mongodb.js';
import { User } from '../../../../models/index.js';
import { checkRateLimit, getClientIP } from '../../../../utils/rate-limiter.js';
import { verifyRecaptcha } from '../../../../utils/recaptcha.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
    try {
        // ========== BOT PROTECTION LAYER 1: Rate Limiting ==========
        const clientIP = getClientIP(request);
        const rateCheck = checkRateLimit(clientIP, 5, 15 * 60 * 1000); // 5 registrations per 15 minutes per IP

        if (rateCheck.limited) {
            console.warn(`🚫 Rate limited registration attempt from IP: ${clientIP}`);
            const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60000);
            return NextResponse.json(
                { error: `Too many registration attempts. Please try again in ${retryMinutes} minutes.` },
                { status: 429 }
            );
        }

        const body = await request.json();

        // ========== BOT PROTECTION LAYER 2: Honeypot ==========
        if (body._hp_website && body._hp_website.trim() !== '') {
            // A human would never fill this hidden field — it's a bot
            console.warn(`🍯 Honeypot triggered from IP: ${clientIP}, value: "${body._hp_website}"`);
            // Return a fake success to not tip off the bot
            return NextResponse.json({
                message: 'Account created successfully! Please check your email to verify your account.',
                user: { id: 'fake', email: body.email, fname: body.fname, lname: body.lname, isVerified: false }
            }, { status: 201 });
        }

        // ========== BOT PROTECTION LAYER 3: Timing Check ==========
        if (body._hp_timestamp) {
            const formDuration = Date.now() - parseInt(body._hp_timestamp, 10);
            const MIN_FORM_TIME = 3000; // 3 seconds minimum — no human fills the form this fast

            if (formDuration < MIN_FORM_TIME) {
                console.warn(`⏱️ Speed bot detected from IP: ${clientIP}, form filled in ${formDuration}ms`);
                // Return fake success
                return NextResponse.json({
                    message: 'Account created successfully! Please check your email to verify your account.',
                    user: { id: 'fake', email: body.email, fname: body.fname, lname: body.lname, isVerified: false }
                }, { status: 201 });
            }
        }

        // ========== BOT PROTECTION LAYER 4: reCAPTCHA v3 ==========
        const recaptchaResult = await verifyRecaptcha(body.recaptchaToken, 'register', 0.5);

        if (!recaptchaResult.success) {
            console.warn(`🤖 reCAPTCHA failed from IP: ${clientIP}, score: ${recaptchaResult.score}, error: ${recaptchaResult.error}`);
            return NextResponse.json(
                { error: 'Registration verification failed. Please try again. If the problem persists, please contact support.' },
                { status: 400 }
            );
        }

        if (recaptchaResult.score !== undefined && !recaptchaResult.skipped) {
            console.log(`✅ reCAPTCHA passed from IP: ${clientIP}, score: ${recaptchaResult.score}`);
        }
        // ========== END BOT PROTECTION ==========

        const {
            fname,
            lname,
            email,
            password,
            serviceType,
            militaryBranch,
            address1,
            city,
            state,
            zip,
            termsAccepted
        } = body;

        // Validation
        if (!fname || !lname || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!termsAccepted) {
            return NextResponse.json(
                { error: 'Terms and conditions must be accepted' },
                { status: 400 }
            );
        }

        // DEFINE requiresBranch BEFORE using it
        const requiresBranch = ['VT', 'AD', 'FR', 'SP', 'VBO'].includes(serviceType);

        // Check if military branch is required
        if (requiresBranch && !militaryBranch) {
            return NextResponse.json(
                { error: 'Military branch is required for this service type' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user already exists (case-insensitive)
        const existingUser = await User.findOne({
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Generate verification token and expiration (7 days)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

        // Create new user (password will be hashed by the pre-save middleware)
        const user = new User({
            fname,
            lname,
            email: email.toLowerCase(),
            password,
            serviceType,
            militaryBranch: requiresBranch ? militaryBranch : '',
            // Initialize veteran business owner fields if applicable
            ...(serviceType === 'VBO' && {
                veteranBusinessOwner: {
                    isVeteranOwned: true,
                    verificationStatus: 'pending',
                    businessIds: [],
                    certifications: {
                        sba_vosb: false,
                        sba_sdvosb: false,
                        certificationNumbers: []
                    }
                }
            }),
            address1,
            city,
            state,
            zip,
            status: serviceType, // Map serviceType to status
            level: 'Free', // Default access level
            isAdmin: false,
            termsAccepted: true,
            termsAcceptedDate: new Date(),
            termsVersion: "November 2024",
            // Email verification fields
            isVerified: false,
            verificationToken: verificationToken,
            verificationTokenExpires: verificationExpiry
        });

        await user.save();

        // Send verification email
        const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const verificationLink = `${baseURL}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

        try {
            // Use Resend's verified domain for development, custom for production
            const fromEmail = process.env.NODE_ENV === 'production'
                ? 'Patriot Thanks <send@patriotthanks.com>'
                : 'Patriot Thanks <onboarding@resend.dev>';

            await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Welcome to Patriot Thanks - Verify Your Email',
                html: getWelcomeVerificationEmailHTML(fname, verificationLink, verificationToken),
                text: getWelcomeVerificationEmailText(fname, verificationLink, verificationToken)
            });

            console.log(`✅ User created and verification email sent to: ${email}`);

        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // User was created successfully, but email failed
            // In development, we might want to log the verification details
            if (process.env.NODE_ENV === 'development') {
                console.log(`🚧 DEV MODE - Verification token for ${email}: ${verificationToken}`);
                console.log(`🚧 DEV MODE - Verification link: ${verificationLink}`);
            }
        }

        // Return success (don't include sensitive data)
        return NextResponse.json({
            message: 'Account created successfully! Please check your email to verify your account.',
            user: {
                id: user._id,
                email: user.email,
                fname: user.fname,
                lname: user.lname,
                isVerified: user.isVerified
            },
            // Include verification details in development mode
            ...(process.env.NODE_ENV === 'development' && {
                debug: {
                    verificationToken,
                    verificationLink,
                    expiresIn: '7 days'
                }
            })
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function getWelcomeVerificationEmailHTML(firstName, verificationLink, verificationToken) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Patriot Thanks - Verify Your Email</title>
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
        .welcome-section {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .welcome-section h2 {
            color: #0c4a6e;
        }
        .welcome-section p {
            color: #0c4a6e;
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
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .features-section h3 {
            color: #065f46;
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
            color: #065f46;
            font-size: 14px;
        }
        .features-list li:before {
            content: "✓ ";
            color: #10b981;
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
            <div class="welcome-section">
                <h2 style="margin: 0; color: #0c4a6e;">Welcome to Patriot Thanks, ${firstName}!</h2>
                <p style="margin: 10px 0 0 0; color: #0c4a6e;">Thank you for joining our community that supports those who serve.</p>
            </div>
            
            <p>Your account has been created successfully! To complete your registration and access all features, please verify your email address:</p>
            
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
                <h3>🎯 Once verified, you'll have access to:</h3>
                <ul class="features-list">
                    <li>Find local businesses offering military and first responder discounts</li>
                    <li>Create and manage your business discount listings</li>
                    <li>Review and rate your discount experiences</li>
                    <li>Save your favorite businesses and offers</li>
                    <li>Get notifications about new discounts in your area</li>
                    <li>Connect with a community that appreciates your service</li>
                </ul>
            </div>
            
            <p><strong>Didn't create this account?</strong> If you didn't register for Patriot Thanks, you can safely ignore this email.</p>
            
            <p>Thank you for your service and welcome to the Patriot Thanks family!</p>
            
            <p>Best regards,<br>
            <em>The Patriot Thanks Team</em></p>
        </div>
        
        <div class="footer">
            <p>This email was sent to welcome you to Patriot Thanks</p>
            <p><strong>Doc Bear Enterprises, LLC</strong></p>
            <p>5249 N Park Pl NE, PMB 4011, Cedar Rapids, IA 52402</p>
            <p>© ${new Date().getFullYear()} Doc Bear Enterprises, LLC. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

function getWelcomeVerificationEmailText(firstName, verificationLink, verificationToken) {
    return `
WELCOME TO PATRIOT THANKS

Hello ${firstName},

Welcome to Patriot Thanks! Thank you for joining our community that supports those who serve.

Your account has been created successfully! To complete your registration and access all features, please verify your email address.

VERIFY YOUR EMAIL:
Click this link: ${verificationLink}

OR enter this verification code: ${verificationToken}

IMPORTANT: This verification link will expire in 7 days for your security.

ONCE VERIFIED, YOU'LL HAVE ACCESS TO:
• Find local businesses offering military and first responder discounts
• Create and manage your business discount listings  
• Review and rate your discount experiences
• Save your favorite businesses and offers
• Get notifications about new discounts in your area
• Connect with a community that appreciates your service

DIDN'T CREATE THIS ACCOUNT?
If you didn't register for Patriot Thanks, you can safely ignore this email.

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