// file: src/app/api/support/contact/route.js v1 - Patriot Thanks contact support API route

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '../../../../lib/mongodb';
import nodemailer from 'nodemailer';

// Configure email transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
};

export async function POST(request) {
    try {
        // Get user session
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { subject, category, message, urgency, userTier } = await request.json();

        // Validate required fields
        if (!subject || !category || !message) {
            return NextResponse.json(
                { error: 'Subject, category, and message are required' },
                { status: 400 }
            );
        }

        // Connect to database
        const { db } = await connectDB();

        // Create support ticket record
        const supportTicket = {
            userId: session.user.id,
            userEmail: session.user.email,
            userName: session.user.name,
            userTier: userTier || 'free',
            subject: subject.trim(),
            category: category,
            message: message.trim(),
            urgency: urgency || 'normal',
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'patriot-thanks-web'
        };

        // Insert support ticket
        const result = await db.collection('supportTickets').insertOne(supportTicket);
        const ticketId = result.insertedId.toString().slice(-8).toUpperCase();

        // Prepare email content
        const urgencyLabels = {
            low: 'Low Priority',
            normal: 'Normal Priority',
            high: 'High Priority',
            urgent: 'URGENT'
        };

        const categoryLabels = {
            'verification-help': 'Verification Help',
            'discount-issue': 'Discount Issue',
            'business-suggestion': 'Business Suggestion',
            'account-support': 'Account Support',
            'technical-support': 'Technical Support',
            'business-partnership': 'Business Partnership',
            'billing-support': 'Billing Support',
            'general-feedback': 'General Feedback',
            'bug-report': 'Bug Report',
            'feature-request': 'Feature Request',
            'other': 'Other'
        };

        // Email content for support team
        const supportEmailContent = `
New Patriot Thanks Support Request
=================================

Ticket ID: PT-${ticketId}
Urgency: ${urgencyLabels[urgency] || urgency}
Category: ${categoryLabels[category] || category}

User Information:
- Name: ${session.user.name}
- Email: ${session.user.email}
- Account Tier: ${userTier || 'free'}
- User ID: ${session.user.id}

Subject: ${subject}

Message:
${message}

Submitted: ${new Date().toLocaleString('en-US', {
            timeZone: 'America/Chicago',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })} CST

Please respond within 2 business days (priority support for premium users).
        `;

        // Email content for user confirmation
        const userEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Support Request Confirmation - Patriot Thanks</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🇺🇸 Patriot Thanks Support</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">We've received your support request</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
        <h2 style="color: #dc2626; margin-top: 0;">Support Request Confirmation</h2>
        
        <p>Hi ${session.user.name},</p>
        
        <p>Thank you for contacting Patriot Thanks support. We've received your request and will respond within 2 business days.</p>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <strong>Ticket Details:</strong><br>
            <strong>Ticket ID:</strong> PT-${ticketId}<br>
            <strong>Category:</strong> ${categoryLabels[category] || category}<br>
            <strong>Priority:</strong> ${urgencyLabels[urgency] || urgency}<br>
            <strong>Subject:</strong> ${subject}
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ul>
            <li>Our support team will review your request</li>
            <li>You'll receive a response within 2 business days</li>
            <li>Premium users receive priority support</li>
            <li>You can reference ticket ID PT-${ticketId} for follow-ups</li>
        </ul>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>🇺🇸 Serving Those Who Serve</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Thank you for your service and for helping us improve Patriot Thanks for all service members and first responders.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
        
        <p style="font-size: 14px; color: #666;">
            <strong>Doc Bear Enterprises, LLC</strong><br>
            5249 N Park Pl NE, PMB 4011<br>
            Cedar Rapids, IA 52402<br>
            <a href="mailto:privacy@patriotthanks.com" style="color: #2563eb;">privacy@patriotthanks.com</a>
        </p>
    </div>
</body>
</html>
        `;

        // Send emails
        const transporter = createTransporter();

        // Send to support team
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'support@patriotthanks.com',
            to: process.env.SUPPORT_EMAIL || 'privacy@patriotthanks.com',
            subject: `[PT-${ticketId}] ${urgencyLabels[urgency]} - ${subject}`,
            text: supportEmailContent,
            replyTo: session.user.email
        });

        // Send confirmation to user
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'support@patriotthanks.com',
            to: session.user.email,
            subject: `Support Request Confirmation - Ticket PT-${ticketId}`,
            html: userEmailContent
        });

        // Update ticket with email sent status
        await db.collection('supportTickets').updateOne(
            { _id: result.insertedId },
            {
                $set: {
                    ticketId: `PT-${ticketId}`,
                    emailSent: true,
                    emailSentAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            ticketId: `PT-${ticketId}`,
            message: 'Support request submitted successfully'
        });

    } catch (error) {
        console.error('Contact support error:', error);
        return NextResponse.json(
            { error: 'Failed to submit support request' },
            { status: 500 }
        );
    }
}