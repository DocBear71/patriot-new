// file: /src/app/api/contact/route.js v1 - Contact form submission endpoint for Next.js App Router

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import mongoose from 'mongoose';
import { Resend } from 'resend';

// Contact schema definition
const contactSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    subject: String,
    category: String,
    urgency: String,
    message: String,
    userTier: String,
    userId: String,
    created_at: { type: Date, default: Date.now },
});

// Create the Contact model if it doesn't already exist
let Contact;
try {
    // Try to fetch the existing model
    Contact = mongoose.model('Contact');
} catch (error) {
    // Define the model if it doesn't exist
    Contact = mongoose.model('Contact', contactSchema, 'contact');
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Handle GET requests - API availability check
 */
export async function GET() {
    return NextResponse.json({
        message: 'Contact API is available',
        endpoints: ['POST /api/contact - Submit contact form']
    });
}

/**
 * Handle POST requests - Contact form submission
 */
export async function POST(request) {
    console.log("📧 PATRIOT THANKS CONTACT API: Processing contact form submission");

    try {
        // Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await connectDB();
        console.log("Database connection established");

        // Parse request body
        const contactData = await request.json();
        console.log("Received contact data:", {
            subject: contactData.subject,
            category: contactData.category,
            urgency: contactData.urgency,
            email: contactData.email,
            userTier: contactData.userTier,
            message: contactData.message ? `${contactData.message.substring(0, 50)}...` : 'N/A'
        });

        // Basic validation - updated for Patriot Thanks fields
        const requiredFields = ['email', 'subject', 'message', 'category'];
        const missingFields = requiredFields.filter(field => !contactData[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    message: 'Required fields are missing',
                    missing_fields: missingFields
                },
                { status: 400 }
            );
        }

        // Additional email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email)) {
            return NextResponse.json(
                { message: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Determine response time based on urgency and user tier
        const getResponseInfo = (urgency, userTier) => {
            if (urgency === 'urgent') {
                return { time: '2-4 hours', priority: 'URGENT', color: '#dc2626' };
            } else if (urgency === 'high') {
                return { time: '4-8 hours', priority: 'HIGH', color: '#ea580c' };
            } else if (urgency === 'normal') {
                return { time: '1-2 business days', priority: 'NORMAL', color: '#059669' };
            } else {
                return { time: '2-3 business days', priority: 'LOW', color: '#6b7280' };
            }
        };

        const responseInfo = getResponseInfo(contactData.urgency, contactData.userTier);

        // Add timestamp and processed data
        contactData.created_at = new Date();
        contactData.response_priority = responseInfo.priority;

        console.log("Inserting contact submission...");

        // Insert contact data using mongoose
        const newContact = new Contact(contactData);
        const result = await newContact.save();

        console.log("✅ Contact submitted successfully:", result._id);

        // Send email notification using Resend
        try {
            if (process.env.RESEND_API_KEY) {
                await sendContactEmail(contactData, responseInfo);
                console.log("✅ Email notifications sent successfully");
            } else {
                console.warn("⚠️ RESEND_API_KEY not configured - emails not sent");
            }
        } catch (emailError) {
            console.error("❌ Email sending failed:", emailError);
            // Don't fail the whole request if email fails
        }

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Message sent successfully',
            contactId: result._id,
            expectedResponse: responseInfo.time
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Contact submission error:', error);

        // Handle specific MongoDB errors
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                {
                    message: 'Validation error: ' + error.message,
                    errors: error.errors
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                message: 'Server error during contact submission',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}

/**
 * Send email notifications using Resend
 */
async function sendContactEmail(contactData, responseInfo) {
    const currentYear = new Date().getFullYear();
    const requestTime = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    // Support team notification email
    const supportEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Request - Patriot Thanks</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
        }
        
        .header-subtitle {
            color: #dbeafe;
            font-size: 16px;
            margin: 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .priority-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
            background-color: ${responseInfo.color};
            color: white;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .info-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #6b7280;
            font-size: 14px;
        }
        
        .message-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🇺🇸 Patriot Thanks</div>
            <p class="header-subtitle">Support Request Received</p>
        </div>
        
        <div class="content">
            <div class="priority-badge">
                ${responseInfo.priority} Priority - Response Expected: ${responseInfo.time}
            </div>
            
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">New Support Request</h2>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Customer Email</div>
                    <div class="info-value">${contactData.email}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Account Type</div>
                    <div class="info-value">${contactData.userTier ? contactData.userTier.charAt(0).toUpperCase() + contactData.userTier.slice(1) : 'Free'}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Category</div>
                    <div class="info-value">${contactData.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Urgency Level</div>
                    <div class="info-value">${responseInfo.priority}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Request Time</div>
                    <div class="info-value">${requestTime}</div>
                </div>
                
                ${contactData.userId ? `
                <div class="info-item">
                    <div class="info-label">User ID</div>
                    <div class="info-value">${contactData.userId}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="info-item" style="margin: 20px 0;">
                <div class="info-label">Subject</div>
                <div class="info-value" style="font-size: 16px; font-weight: 500; color: #374151;">${contactData.subject}</div>
            </div>
            
            <div class="message-section">
                <h3>Customer Message</h3>
                <div style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${contactData.message}</div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Action Required:</strong> Please respond to this support request within ${responseInfo.time}</p>
            <p>Reply directly to this email to respond to the customer: ${contactData.email}</p>
            <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">© ${currentYear} Patriot Thanks. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    // Customer confirmation email
    const confirmationEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Request Received - Patriot Thanks</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .success-icon {
            text-align: center;
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🇺🇸 Patriot Thanks</div>
            <p style="color: #dbeafe; font-size: 16px; margin: 0;">Support Request Confirmation</p>
        </div>
        
        <div class="content">
            <div class="success-icon">✅</div>
            
            <h2 style="color: #1f2937; text-align: center; margin: 0 0 20px 0;">We've Received Your Support Request!</h2>
            
            <p>Thank you for contacting Patriot Thanks support. We've successfully received your request and our team will review it promptly.</p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px 0;">Expected Response Time: ${responseInfo.time}</h3>
                <p style="color: #92400e; margin: 10px 0;">
                    Our support team is committed to serving those who serve our country. 
                    We'll get back to you as soon as possible!
                </p>
            </div>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">What happens next?</h3>
                <ul style="color: #0c4a6e; margin: 10px 0; padding-left: 20px;">
                    <li>Our support team will review your request</li>
                    <li>We'll respond within ${responseInfo.time}</li>
                    <li>You'll receive a detailed response via email</li>
                    <li>If needed, we may follow up with additional questions</li>
                </ul>
            </div>
            
            <p>If you have any additional information that might help us resolve your issue faster, simply reply to this email.</p>
            
            <p><strong>Thank you for using Patriot Thanks to support our service members and their families!</strong></p>
        </div>
        
        <div class="footer">
            <p>This confirmation was sent from Patriot Thanks</p>
            <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">© ${currentYear} Patriot Thanks. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    // Send support team notification
    await resend.emails.send({
        from: 'Patriot Thanks Support <support@patriotthanks.com>',
        to: ['privacy@patriotthanks.com'],
        subject: `[${responseInfo.priority}] Support Request: ${contactData.subject}`,
        html: supportEmailHtml,
        replyTo: contactData.email
    });

    // Send customer confirmation
    await resend.emails.send({
        from: 'Patriot Thanks Support <support@patriotthanks.com>',
        to: [contactData.email],
        subject: 'Support Request Received - Patriot Thanks',
        html: confirmationEmailHtml
    });
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
    return NextResponse.json(
        { message: 'CORS preflight successful' },
        {
            status: 200,
            headers: {
                'Allow': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        }
    );
}