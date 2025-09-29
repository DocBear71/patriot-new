// file: /src/app/api/donations/route.js v2 - Fixed naming conflict with connectDB

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../../../models/User';
import Donation from '../../../models/Donation';

const { ObjectId } = mongoose.Types;

// Create email transporter for donation confirmations
const transporter = nodemailer.createTransport({
    host: 'mail.patriotthanks.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'donations@patriotthanks.com',
        pass: process.env.EMAIL_PASS || '1369Bkcsdp55chtdp81??'
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
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, status: 401, message: 'Authorization required' };
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'patriot-thanks-secret-key');

        // Connect to database
        await connectDB();

        // Check if user exists and is admin
        const user = await User.findById(decoded.userId);

        if (!user) {
            return { success: false, status: 404, message: 'User not found' };
        }

        if (user.level !== 'Admin' && user.isAdmin !== true) {
            return { success: false, status: 403, message: 'Admin access required' };
        }

        return { success: true, userId: decoded.userId, user };

    } catch (error) {
        console.error("Admin verification error:", error);
        return { success: false, status: 401, message: 'Invalid or expired token' };
    }
}

/**
 * Helper to establish database connection
 */
async function establishDBConnection() {
    try {
        await connectDB();
        console.log("✅ Database connection established");
        return { success: true };
    } catch (dbError) {
        console.error("❌ Database connection error:", dbError);
        return {
            success: false,
            error: dbError,
            message: 'Database connection error'
        };
    }
}

/**
 * Send donation confirmation email
 */
async function sendDonationConfirmationEmail(donation) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'donations@patriotthanks.com',
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
                            <p><strong>Donation Amount:</strong> $${donation.amount}</p>
                            <p><strong>Date:</strong> ${new Date(donation.created_at).toLocaleDateString()}</p>
                            <p><strong>Transaction ID:</strong> ${donation.transactionId || donation.paymentId}</p>
                            <p><strong>Status:</strong> ${donation.status}</p>
                            ${donation.recurring ? '<p><strong>Type:</strong> Recurring donation</p>' : ''}
                        </div>
                        
                        <p>Your generous donation helps us support service members, veterans, first responders, and their families.</p>
                        
                        <p>This email serves as your donation receipt for tax purposes. Please keep it for your records.</p>
                        
                        <p style="margin-top: 30px;"><strong>Thank you for supporting those who serve our country!</strong></p>
                    </div>
                    
                    <div style="background: #f7fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
                        <p>© ${new Date().getFullYear()} Patriot Thanks. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply to this message.</p>
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

    // Connect to database
    const dbConnection = await establishDBConnection();
    if (!dbConnection.success) {
        return NextResponse.json(
            {
                message: dbConnection.message,
                error: dbConnection.error?.message
            },
            { status: 500 }
        );
    }

    try {
        switch (operation) {
            case 'list':
                return await handleListDonations(request);
            case 'stats':
                return await handleDonationStats(request);
            case 'get':
                return await handleGetDonation(request);
            case 'export':
                return await handleExportDonations(request);
            default:
                // Default response - list available operations
                return NextResponse.json({
                    message: 'Donations API is available',
                    operations: [
                        'create', 'confirm', 'list', 'stats',
                        'cancel-recurring', 'get', 'send-receipt', 'export'
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

    // Connect to database
    const dbConnection = await establishDBConnection();
    if (!dbConnection.success) {
        return NextResponse.json(
            {
                message: dbConnection.message,
                error: dbConnection.error?.message
            },
            { status: 500 }
        );
    }

    try {
        switch (operation) {
            case 'create':
                return await handleCreateDonation(request);
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

/**
 * Handle creating a new donation
 */
async function handleCreateDonation(request) {
    console.log("💰 Creating new donation");

    try {
        // Extract donation data from request body
        const donationData = await request.json();

        // Basic validation
        if (!donationData.amount || donationData.amount <= 0) {
            return NextResponse.json(
                { message: 'Valid donation amount is required' },
                { status: 400 }
            );
        }

        if (!donationData.name || !donationData.email) {
            return NextResponse.json(
                { message: 'Name and email are required' },
                { status: 400 }
            );
        }

        if (!donationData.paymentMethod) {
            return NextResponse.json(
                { message: 'Payment method is required' },
                { status: 400 }
            );
        }

        // Process payment based on payment method
        let paymentResult;

        if (donationData.paymentMethod === 'paypal') {
            // In a real implementation, you would:
            // 1. Create a PayPal order
            // 2. Return the order ID to the client for approval
            paymentResult = {
                success: true,
                paymentId: 'PAYPAL-' + Date.now(),
                status: 'pending' // PayPal requires user approval
            };
        } else if (donationData.paymentMethod === 'card') {
            // In a real implementation, you would:
            // 1. Use a payment processor like Stripe to process the card
            // 2. Handle the payment response
            paymentResult = {
                success: true,
                paymentId: 'CARD-' + Date.now(),
                status: 'completed'
            };
        } else {
            return NextResponse.json(
                { message: 'Unsupported payment method' },
                { status: 400 }
            );
        }

        if (!paymentResult.success) {
            return NextResponse.json(
                { message: 'Payment processing failed' },
                { status: 400 }
            );
        }

        // Create donation record
        const donation = new Donation({
            ...donationData,
            paymentId: paymentResult.paymentId,
            status: paymentResult.status,
            created_at: new Date()
        });

        const savedDonation = await donation.save();

        // Send confirmation email if payment completed immediately
        if (paymentResult.status === 'completed') {
            await sendDonationConfirmationEmail(savedDonation);
        }

        console.log("✅ Donation created successfully:", savedDonation._id);

        return NextResponse.json({
            message: 'Donation processed successfully',
            donationId: savedDonation._id,
            paymentId: paymentResult.paymentId,
            status: paymentResult.status
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Error processing donation:', error);
        return NextResponse.json(
            { message: 'Server error processing donation: ' + error.message },
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
        // Extract confirmation data from request body
        const { donationId, paymentId, paypalOrderId } = await request.json();

        // Basic validation
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

        // In a real implementation, you would:
        // 1. Capture the PayPal payment using paypalOrderId
        // 2. Handle success/failure of the capture

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
            endDate.setDate(endDate.getDate() + 1); // Include the end date
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
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

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

        // Last month donations
        const lastMonthDonations = await Donation.countDocuments({
            ...filter,
            created_at: { $gte: lastMonth, $lt: thisMonth }
        });

        const lastMonthAmountResult = await Donation.aggregate([
            { $match: { ...filter, created_at: { $gte: lastMonth, $lt: thisMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lastMonthAmount = lastMonthAmountResult.length > 0 ? lastMonthAmountResult[0].total : 0;

        // Recurring donations
        const recurringDonations = await Donation.countDocuments({
            ...filter,
            recurring: true
        });

        // Average donation amount
        const averageAmount = totalDonations > 0 ? totalAmount / totalDonations : 0;

        // Monthly growth
        const donationGrowth = lastMonthDonations > 0 ?
            ((thisMonthDonations - lastMonthDonations) / lastMonthDonations * 100) : 0;
        const amountGrowth = lastMonthAmount > 0 ?
            ((thisMonthAmount - lastMonthAmount) / lastMonthAmount * 100) : 0;

        const stats = {
            total: {
                donations: totalDonations,
                amount: totalAmount,
                averageAmount: Math.round(averageAmount * 100) / 100
            },
            thisMonth: {
                donations: thisMonthDonations,
                amount: thisMonthAmount
            },
            lastMonth: {
                donations: lastMonthDonations,
                amount: lastMonthAmount
            },
            growth: {
                donations: Math.round(donationGrowth * 100) / 100,
                amount: Math.round(amountGrowth * 100) / 100
            },
            recurring: {
                total: recurringDonations,
                percentage: totalDonations > 0 ? Math.round((recurringDonations / totalDonations) * 100) : 0
            }
        };

        console.log("✅ Donation statistics calculated");

        return NextResponse.json({ stats });

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

        // In a real implementation, you would:
        // 1. Cancel the recurring subscription with the payment processor
        // 2. Send a confirmation email

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

        // Find the donation
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

        // Find the donation
        const donation = await Donation.findById(new ObjectId(donationId));

        if (!donation) {
            return NextResponse.json(
                { message: 'Donation not found' },
                { status: 404 }
            );
        }

        // Send the receipt
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
            .limit(10000); // Limit to 10k records for performance

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
            donation.transactionId || donation.paymentId || '',
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