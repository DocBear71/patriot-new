import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth.js';
import connectDB from '../../../lib/mongodb.js';
import { Incentive, Business } from '../../../models/index.js';

// GET incentives with optional filters
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const business_id = searchParams.get('business_id');
        const type = searchParams.get('type');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;

        // Build query
        let query = { is_available: true };

        if (business_id) query.business_id = business_id;
        if (type) query.type = type.toUpperCase();

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const incentives = await Incentive.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Populate business information
        const incentivesWithBusiness = await Promise.all(
            incentives.map(async (incentive) => {
                const business = await Business.findById(incentive.business_id).lean();
                return {
                    ...incentive,
                    business: business ? {
                        bname: business.bname,
                        city: business.city,
                        state: business.state
                    } : null
                };
            })
        );

        const total = await Incentive.countDocuments(query);

        return NextResponse.json({
            incentives: incentivesWithBusiness,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Incentive fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incentives' },
            { status: 500 }
        );
    }
}

// POST create new incentive (requires authentication)
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await request.json();
        const {
            business_id,
            type,
            amount,
            information,
            other_description
        } = body;

        // Validation
        if (!business_id || !type || amount === undefined || !information) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify business exists
        const business = await Business.findById(business_id);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Create incentive
        const incentive = new Incentive({
            business_id,
            type: type.toUpperCase(),
            amount: Number(amount),
            information: information.trim(),
            other_description: other_description?.trim() || '',
            is_available: true,
            created_by: session.user.id,
            updated_by: session.user.id
        });

        await incentive.save();

        return NextResponse.json({
            message: 'Incentive created successfully',
            incentive
        }, { status: 201 });

    } catch (error) {
        console.error('Incentive creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create incentive' },
            { status: 500 }
        );
    }
}