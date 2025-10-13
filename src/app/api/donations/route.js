// file: /src/app/api/donations/route.js v4 - Real PayPal and Stripe Integration

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import User from '../../../models/User';
import Donation from '../../../models/Donation';

const { ObjectId } = mongoose.Types;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// Initialize PayPal client dynamically to ensure fresh credentials
function getPayPalClient() {
    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    console.log('🅿️ PayPal Configuration:', {
        mode,
        clientIdPresent: !!clientId,
        clientSecretPresent: !!clientSecret,
        clientIdStart: clientId ? clientId.substring(0, 10) + '...' : 'MISSING'
    });

    if (!clientId || !clientSecret) {
        console.error('❌ PayPal credentials missing!');
        throw new Error('PayPal credentials not configured');
    }

    const environment = mode === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    return new paypal.core.PayPalHttpClient(environment);
}

// Create email transporter for donation confirmations
const transporter = nodemailer.createTransport({
    host: 'mail.patriotthanks.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.DONATION_EMAIL_USER || process.env.EMAIL_USER || 'donations@patriotthanks.com',
        pass: process.env.DONATION_EMAIL_PASS || process.env.EMAIL_PASS || '1369Bkcsdp55chtdp81??'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP connection error:', error);
    } else {
        console.log('✅ SMTP server is ready to send emails');
    }
});

/**
 * Helper to verify admin access
 */
async function verifyAdminAccess(request) {
    try {
        // Import NextAuth server functions
        const { getServerSession } = await import('next-auth/next');
        const { authOptions } = await import('../../../lib/auth');  // ✅ CORRECT PATH

        // Get session from NextAuth cookies
        const session = await getServerSession(authOptions);

        console.log("🔐 Admin verification - Session:", session ? 'Found' : 'Not found');

        if (!session || !session.user) {
            console.log("❌ No session found");
            return { success: false, status: 401, message: 'Not authenticated' };
        }

        console.log("👤 User:", session.user.email, "Level:", session.user.level, "isAdmin:", session.user.isAdmin);

        // Check if user is admin
        if (session.user.level !== 'Admin' && !session.user.isAdmin) {
            console.log("❌ User is not admin");
            return { success: false, status: 403, message: 'Admin access required' };
        }

        console.log("✅ Admin access verified for:", session.user.email);
        return {
            success: true,
            userId: session.user.id,
            user: session.user
        };

    } catch (error) {
        console.error("❌ Admin verification error:", error);
        return { success: false, status: 401, message: 'Session verification failed: ' + error.message };
    }
}

/**
 * Send donation confirmation email
 */
async function sendDonationConfirmationEmail(donation) {
    try {
        const mailOptions = {
            from: process.env.DONATION_EMAIL_USER || process.env.EMAIL_USER || 'donations@patriotthanks.com',
            to: donation.email,
            subject: 'Thank you for your donation to Patriot Thanks',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🇺🇸 Patriot Thanks</h1>
                        <p style="color: #dbeafe; margin: 10px 0 0 0;">Thank you for your donation!</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <h2 style="color: #1f2937; margin-bottom: 20px;">Donation Receipt</h2>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <p><strong>Donation Amount:</strong> $${donation.amount.toFixed(2)}</p>
                            <p><strong>Date:</strong> ${new Date(donation.created_at).toLocaleDateString()}</p>
                            <p><strong>Transaction ID:</strong> ${donation.transactionId || donation.paymentIntentId}</p>
                            <p><strong>Payment Method:</strong> ${donation.paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal'}</p>
                            <p><strong>Status:</strong> ${donation.status}</p>
                            ${donation.recurring ? '<p><strong>Type:</strong> Recurring donation</p>' : ''}
                        </div>
                        
                        ${donation.message ? `
                        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
                            <h4 style="margin: 0 0 10px 0; color: #1e40af;">Your Message:</h4>
                            <p style="margin: 0; font-style: italic;">"${donation.message}"</p>
                        </div>
                        ` : ''}
                        
                        <p>Your generous donation helps us support service members, veterans, first responders, and their families by connecting them with businesses that appreciate their service.</p>
                        
                        <p>This email serves as your donation receipt for tax purposes. Please keep it for your records.</p>
                        
                        <p style="margin-top: 30px;"><strong>Thank you for supporting those who serve our country!</strong></p>
                    </div>
                    
                    <div style="background: #f7fafc; padding: 20px; text-center; color: #6b7280; font-size: 14px;">
                        <p>© ${new Date().getFullYear()} Patriot Thanks. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>Questions? Contact us at support@patriotthanks.com</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Donation confirmation email sent to:', donation.email);
        return true;

    } catch (error) {
        console.error('❌ Error sending donation confirmation email:', error);
        return false;
    }
}

/**
 * Handle GET requests - Donation queries
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("💰 DONATIONS API: Processing GET request, operation:", operation);

    try {
        await connectDB();
    } catch (error) {
        console.error("❌ Database connection error:", error);
        return NextResponse.json(
            {
                message: 'Database connection failed',
                error: error.message
            },
            { status: 500 }
        );
    }

    try {
        switch (operation) {
            case 'list':
                return await handleListDonations(request); // Admin only
            case 'stats':
                return await handleDonationStats(request); // Admin only
            case 'get':
                return await handleGetDonation(request); // Admin only
            case 'export':
                return await handleExportDonations(request); // Admin only
            case 'user-donations':
                return await handleUserDonations(request); // Public - by email
            case 'recognition':
                return await handleRecognitionDonations(request); // Public - for recognition page
            default:
                // Default response - list available operations
                return NextResponse.json({
                    message: 'Donations API is available',
                    operations: [
                        'create', 'confirm', 'list', 'stats',
                        'cancel-recurring', 'get', 'send-receipt', 'export',
                        'user-donations', 'recognition'
                    ]
                });
        }
    } catch (error) {
        console.error('❌ Error in donations GET operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle POST requests - Donation creation and actions
 */
export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    console.log("💰 DONATIONS API: Processing POST request, operation:", operation);

    try {
        await connectDB();
        console.log("✅ Database connected for POST operation");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        return NextResponse.json(
            {
                message: 'Database connection failed',
                error: error.message
            },
            { status: 500 }
        );
    }

    try {
        switch (operation) {
            case 'create-payment-intent':
                return await handleCreatePaymentIntent(request);
            case 'save-donation':
                return await handleSaveDonation(request);
            case 'create-paypal-order':
                return await handleCreatePayPalOrder(request);
            case 'capture-paypal-order':
                return await handleCapturePayPalOrder(request);
            case 'confirm':
                return await handleConfirmDonation(request);
            case 'cancel-recurring':
                return await handleCancelRecurringDonation(request);
            case 'send-receipt':
                return await handleSendReceipt(request);
            default:
                return NextResponse.json(
                    { message: 'Invalid operation for POST request' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('❌ Error in donations POST operations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Create Stripe PaymentIntent
 */
async function handleCreatePaymentIntent(request) {
    console.log("💳 Creating Stripe PaymentIntent");

    try {
        const { amount, currency = 'usd', name, email, recurring, metadata } = await request.json();

        if (!amount || amount < 1) {
            return NextResponse.json(
                { message: 'Amount must be at least $1.00' },
                { status: 400 }
            );
        }

        if (!name || !email) {
            return NextResponse.json(
                { message: 'Name and email are required' },
                { status: 400 }
            );
        }

        const amountInCents = Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency,
            metadata: {
                donorName: name,
                donorEmail: email,
                recurring: recurring ? 'true' : 'false',
                ...metadata
            },
            receipt_email: email,
            description: `Donation to Patriot Thanks from ${name}`,
        });

        console.log("✅ PaymentIntent created:", paymentIntent.id);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('❌ Error creating PaymentIntent:', error);
        return NextResponse.json(
            { message: 'Failed to create payment intent: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Create PayPal order
 */
async function handleCreatePayPalOrder(request) {
    console.log("🅿️ Creating PayPal order");

    try {
        const { amount, name, email, anonymous, recurring, message } = await request.json();

        if (!amount || amount < 1) {
            return NextResponse.json(
                { message: 'Amount must be at least $1.00' },
                { status: 400 }
            );
        }

        if (!name || !email) {
            return NextResponse.json(
                { message: 'Name and email are required' },
                { status: 400 }
            );
        }

        let userId = null;
        try {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patriot-thanks-secret-key');
                userId = decoded.userId;
                console.log('✅ User is logged in, userId captured:', userId);
            }
        } catch (error) {
            // User not logged in, that's okay
            console.log('ℹ️ No valid session found, proceeding without userId');
        }

        const paypalClient = getPayPalClient();
        const orderRequest = new paypal.orders.OrdersCreateRequest();
        orderRequest.prefer("return=representation");
        orderRequest.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2)
                },
                description: `Donation to Patriot Thanks${recurring ? ' (Monthly)' : ''}`,
                custom_id: `donation_${Date.now()}`,
                invoice_id: `INV-${Date.now()}`
            }],
            application_context: {
                brand_name: 'Patriot Thanks',
                locale: 'en-US',
                landing_page: 'BILLING',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                return_url: `${process.env.NEXTAUTH_URL}/donate?success=true`,
                cancel_url: `${process.env.NEXTAUTH_URL}/donate?cancelled=true`
            }
        });

        const order = await paypalClient.execute(orderRequest);

        // Save pending donation to database
        const donation = new Donation({
            amount,
            name,
            email,
            anonymous: anonymous || false,
            recurring: recurring || false,
            message: message || '',
            paymentMethod: 'paypal',
            paypalOrderId: order.result.id,
            status: 'pending',
            userId: userId, // ADD THIS LINE
            created_at: new Date()
        });

        await donation.save();

        console.log("✅ PayPal order created:", order.result.id);

        return NextResponse.json({
            orderID: order.result.id,
            donationId: donation._id
        });

    } catch (error) {
        console.error('❌ Error creating PayPal order:', error);
        return NextResponse.json(
            { message: 'Failed to create PayPal order: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Capture PayPal order
 */
async function handleCapturePayPalOrder(request) {
    console.log("🅿️ Capturing PayPal order");

    try {
        const { orderID, amount, name, email, anonymous, recurring, message } = await request.json();

        if (!orderID) {
            return NextResponse.json(
                { message: 'Order ID is required' },
                { status: 400 }
            );
        }

        let userId = null;
        try {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patriot-thanks-secret-key');
                userId = decoded.userId;
                console.log('✅ User is logged in, userId captured:', userId);
            }
        } catch (error) {
            // User not logged in, that's okay
            console.log('ℹ️ No valid session found, proceeding without userId');
        }

        const paypalClient = getPayPalClient();
        // Capture the order
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
        captureRequest.requestBody({});

        const capture = await paypalClient.execute(captureRequest);

        if (capture.result.status === 'COMPLETED') {
            // Find and update the donation
            let donation = await Donation.findOne({ paypalOrderId: orderID });

            if (!donation) {
                // Create new donation if not found
                donation = new Donation({
                    amount,
                    name,
                    email,
                    anonymous: anonymous || false,
                    recurring: recurring || false,
                    message: message || '',
                    paymentMethod: 'paypal',
                    paypalOrderId: orderID,
                    status: 'completed',
                    userId: userId, // ADD THIS LINE
                    created_at: new Date()
                });
            } else {
                // Update existing donation
                donation.status = 'completed';
                if (userId && !donation.userId) {
                    donation.userId = userId; // ADD THIS LINE
                }
                donation.updated_at = new Date();
            }


            // Get transaction ID from capture
            const captureId = capture.result.purchase_units[0].payments.captures[0].id;
            donation.transactionId = captureId;

            await donation.save();

            // Send confirmation email
            await sendDonationConfirmationEmail(donation);

            console.log("✅ PayPal order captured:", orderID);

            return NextResponse.json({
                message: 'Payment captured successfully',
                donationId: donation._id,
                transactionId: captureId
            });

        } else {
            return NextResponse.json(
                { message: 'Payment capture failed' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('❌ Error capturing PayPal order:', error);
        return NextResponse.json(
            { message: 'Failed to capture PayPal order: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Save completed donation to database
 */
async function handleSaveDonation(request) {
    console.log("💾 Saving donation to database");

    try {
        const donationData = await request.json();

        if (!donationData.amount || !donationData.name || !donationData.email) {
            return NextResponse.json(
                { message: 'Amount, name, and email are required' },
                { status: 400 }
            );
        }

        let userId = null;
        try {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patriot-thanks-secret-key');
                userId = decoded.userId;
                console.log('✅ User is logged in, userId captured:', userId);
            }
        } catch (error) {
            // User not logged in, that's okay
            console.log('ℹ️ No valid session found, proceeding without userId');
        }

        const donation = new Donation({
            amount: donationData.amount,
            name: donationData.name,
            email: donationData.email,
            anonymous: donationData.anonymous || false,
            recurring: donationData.recurring || false,
            message: donationData.message || '',
            showOnRecognitionPage: donationData.showOnRecognitionPage || false,
            showAmount: donationData.showAmount || false,
            paymentMethod: donationData.paymentMethod || 'stripe',
            paymentIntentId: donationData.paymentIntentId,
            transactionId: donationData.transactionId || donationData.paymentIntentId,
            status: donationData.status || 'completed',
            userId: userId, // ADD THIS LINE
            created_at: new Date()
        });

        const savedDonation = await donation.save();

        // Send confirmation email
        await sendDonationConfirmationEmail(savedDonation);

        console.log("✅ Donation saved successfully:", savedDonation._id);

        return NextResponse.json({
            message: 'Donation saved successfully',
            donationId: savedDonation._id
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Error saving donation:', error);
        return NextResponse.json(
            { message: 'Failed to save donation: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle confirming a donation (after PayPal approval)
 */
async function handleConfirmDonation(request) {
    console.log("💰 Confirming donation");

    try {
        const { donationId, paymentId, paypalOrderId } = await request.json();

        if (!donationId || !paymentId) {
            return NextResponse.json(
                { message: 'Donation ID and payment ID are required' },
                { status: 400 }
            );
        }

        // Find the donation
        const donation = await Donation.findOne({
            _id: new ObjectId(donationId),
            paymentId: paymentId,
            status: 'pending'
        });

        if (!donation) {
            return NextResponse.json(
                { message: 'Donation not found or already processed' },
                { status: 404 }
            );
        }

        // Update donation status
        donation.status = 'completed';
        donation.transactionId = paypalOrderId || ('PP-' + Math.floor(Math.random() * 1000000));
        donation.updated_at = new Date();
        await donation.save();

        // Send confirmation email
        await sendDonationConfirmationEmail(donation);

        console.log("✅ Donation confirmed successfully:", donation._id);

        return NextResponse.json({
            message: 'Donation confirmed successfully',
            donationId: donation._id,
            status: 'completed'
        });

    } catch (error) {
        console.error('❌ Error confirming donation:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle listing donations (admin feature)
 */
async function handleListDonations(request) {
    console.log("📋 Listing donations (admin)");

    // Verify admin access
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
        );
    }

    try {
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};

        // Status filter
        if (searchParams.get('status')) {
            filter.status = searchParams.get('status');
        }

        // Date range filter
        if (searchParams.get('startDate')) {
            if (!filter.created_at) filter.created_at = {};
            filter.created_at.$gte = new Date(searchParams.get('startDate'));
        }

        if (searchParams.get('endDate')) {
            if (!filter.created_at) filter.created_at = {};
            const endDate = new Date(searchParams.get('endDate'));
            endDate.setDate(endDate.getDate() + 1);
            filter.created_at.$lt = endDate;
        }

        // Minimum amount filter
        if (searchParams.get('minAmount')) {
            filter.amount = { $gte: parseFloat(searchParams.get('minAmount')) };
        }

        // Recurring filter
        if (searchParams.get('recurring') === 'true') {
            filter.recurring = true;
        } else if (searchParams.get('recurring') === 'false') {
            filter.recurring = false;
        }

        // Search by name or email
        if (searchParams.get('search')) {
            const searchRegex = new RegExp(searchParams.get('search'), 'i');
            filter.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ];
        }

        // NEW: Filter for recognition page
        if (searchParams.get('showOnRecognitionPage') === 'true') {
            filter.showOnRecognitionPage = true;
            filter.anonymous = false; // Don't show anonymous donations
        }

        // NEW: Filter by exact email for user's own donations
        if (searchParams.get('email')) {
            filter.email = searchParams.get('email');
        }

        // Get total count
        const total = await Donation.countDocuments(filter);

        // Get donations
        const donations = await Donation.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        console.log(`✅ Retrieved ${donations.length} donations`);

        return NextResponse.json({
            donations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('❌ Error listing donations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle donation statistics
 */
async function handleDonationStats(request) {
    console.log("📊 Getting donation statistics");

    try {
        // Calculate date ranges
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get completed donations only
        const filter = { status: 'completed' };

        // Total all-time donations
        const totalDonations = await Donation.countDocuments(filter);

        // Total amount raised
        const totalAmountResult = await Donation.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

        // This month donations
        const thisMonthDonations = await Donation.countDocuments({
            ...filter,
            created_at: { $gte: thisMonth }
        });

        const thisMonthAmountResult = await Donation.aggregate([
            { $match: { ...filter, created_at: { $gte: thisMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const thisMonthAmount = thisMonthAmountResult.length > 0 ? thisMonthAmountResult[0].total : 0;

        // Recurring donations
        const recurringDonations = await Donation.countDocuments({
            ...filter,
            recurring: true
        });

        // Average donation amount
        const averageAmount = totalDonations > 0 ? totalAmount / totalDonations : 0;

        const stats = {
            totalDonations,
            totalAmount,
            thisMonthAmount,
            thisMonthDonations,
            recurringDonations,
            averageAmount: Math.round(averageAmount * 100) / 100
        };

        console.log("✅ Donation statistics calculated");

        return NextResponse.json(stats);

    } catch (error) {
        console.error('❌ Error calculating donation stats:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Cancel a recurring donation
 */
async function handleCancelRecurringDonation(request) {
    console.log("❌ Canceling recurring donation");

    try {
        const { donationId } = await request.json();

        if (!donationId) {
            return NextResponse.json(
                { message: 'Donation ID is required' },
                { status: 400 }
            );
        }

        // Find the donation
        const donation = await Donation.findOne({
            _id: new ObjectId(donationId),
            recurring: true,
            status: 'completed'
        });

        if (!donation) {
            return NextResponse.json(
                { message: 'Recurring donation not found' },
                { status: 404 }
            );
        }

        // Update donation to canceled
        donation.status = 'canceled';
        donation.updated_at = new Date();
        await donation.save();

        console.log("✅ Recurring donation canceled:", donation._id);

        return NextResponse.json({
            message: 'Recurring donation canceled successfully',
            donationId: donation._id
        });

    } catch (error) {
        console.error('❌ Error canceling recurring donation:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Get a single donation by ID
 */
async function handleGetDonation(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log("🔍 Getting donation by ID:", id);

    try {
        if (!id) {
            return NextResponse.json(
                { message: 'Donation ID is required' },
                { status: 400 }
            );
        }

        const donation = await Donation.findById(new ObjectId(id));

        if (!donation) {
            return NextResponse.json(
                { message: 'Donation not found' },
                { status: 404 }
            );
        }

        console.log("✅ Donation retrieved successfully");

        return NextResponse.json({ donation });

    } catch (error) {
        console.error('❌ Error getting donation:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Send a receipt for a donation
 */
async function handleSendReceipt(request) {
    console.log("📧 Sending donation receipt");

    try {
        const { donationId } = await request.json();

        if (!donationId) {
            return NextResponse.json(
                { message: 'Donation ID is required' },
                { status: 400 }
            );
        }

        const donation = await Donation.findById(new ObjectId(donationId));

        if (!donation) {
            return NextResponse.json(
                { message: 'Donation not found' },
                { status: 404 }
            );
        }

        const result = await sendDonationConfirmationEmail(donation);

        if (result) {
            console.log("✅ Receipt sent successfully");
            return NextResponse.json({
                message: 'Receipt sent successfully',
                success: true
            });
        } else {
            return NextResponse.json(
                {
                    message: 'Failed to send receipt',
                    success: false
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Error sending receipt:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Export donations to CSV (admin feature)
 */
async function handleExportDonations(request) {
    console.log("📤 Exporting donations to CSV");

    // Verify admin access
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
        );
    }

    try {
        const { searchParams } = new URL(request.url);

        // Build filter for export
        const filter = {};

        if (searchParams.get('status')) {
            filter.status = searchParams.get('status');
        }

        if (searchParams.get('startDate')) {
            if (!filter.created_at) filter.created_at = {};
            filter.created_at.$gte = new Date(searchParams.get('startDate'));
        }

        if (searchParams.get('endDate')) {
            if (!filter.created_at) filter.created_at = {};
            const endDate = new Date(searchParams.get('endDate'));
            endDate.setDate(endDate.getDate() + 1);
            filter.created_at.$lt = endDate;
        }

        // Get all donations for export (limit to reasonable number)
        const donations = await Donation.find(filter)
            .sort({ created_at: -1 })
            .limit(10000);

        // Convert to CSV format
        const csvHeaders = [
            'ID', 'Name', 'Email', 'Amount', 'Status', 'Payment Method',
            'Recurring', 'Transaction ID', 'Created Date', 'Updated Date'
        ];

        const csvRows = donations.map(donation => [
            donation._id.toString(),
            donation.name || '',
            donation.email || '',
            donation.amount || 0,
            donation.status || '',
            donation.paymentMethod || '',
            donation.recurring ? 'Yes' : 'No',
            donation.transactionId || donation.paymentIntentId || '',
            donation.created_at ? new Date(donation.created_at).toISOString() : '',
            donation.updated_at ? new Date(donation.updated_at).toISOString() : ''
        ]);

        // Create CSV content
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        console.log(`✅ Exported ${donations.length} donations to CSV`);

        // Return CSV file
        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="donations-export-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('❌ Error exporting donations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle user donations query - Public endpoint for logged-in users to see their donations
 */
async function handleUserDonations(request) {
    console.log("📋 Getting user donations (public endpoint)");

    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { message: 'Email parameter is required' },
                { status: 400 }
            );
        }

        // Query donations by email
        const donations = await Donation.find({
            email: email.toLowerCase(),
            status: 'completed'
        })
            .sort({ created_at: -1 })
            .select('-__v')
            .lean();

        console.log(`✅ Found ${donations.length} donations for user: ${email}`);

        return NextResponse.json({
            success: true,
            donations,
            total: donations.length
        });

    } catch (error) {
        console.error('❌ Error fetching user donations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle recognition page donations - Public endpoint for donor recognition page
 */
async function handleRecognitionDonations(request) {
    console.log("🏆 Getting donations for recognition page (public endpoint)");

    try {
        const { searchParams } = new URL(request.url);

        // Build filter for public recognition page
        const filter = {
            status: 'completed',
            showOnRecognitionPage: true,
            anonymous: false
        };

        // Optional date filters
        if (searchParams.get('startDate')) {
            if (!filter.created_at) filter.created_at = {};
            filter.created_at.$gte = new Date(searchParams.get('startDate'));
        }

        if (searchParams.get('endDate')) {
            if (!filter.created_at) filter.created_at = {};
            const endDate = new Date(searchParams.get('endDate'));
            endDate.setDate(endDate.getDate() + 1);
            filter.created_at.$lt = endDate;
        }

        // Get donations for recognition
        const donations = await Donation.find(filter)
            .sort({ created_at: -1 })
            .select('name amount message showAmount recurring created_at')
            .lean();

        console.log(`✅ Found ${donations.length} donations for recognition page`);

        return NextResponse.json({
            success: true,
            donations
        });

    } catch (error) {
        console.error('❌ Error fetching recognition donations:', error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        }
    );
}