import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth.js';
import connectDB from '../../../lib/mongodb.js';
import { Business } from '../../../models/index.js';

// GET all businesses with optional filters
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const city = searchParams.get('city');
        const state = searchParams.get('state');
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        // Build query
        let query = { status: 'active' };

        if (city) query.city = new RegExp(city, 'i');
        if (state) query.state = state.toUpperCase();
        if (type) query.type = type.toUpperCase();
        if (search) {
            query.$or = [
                { bname: new RegExp(search, 'i') },
                { address1: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const businesses = await Business.find(query)
            .sort({ bname: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Business.countDocuments(query);

        return NextResponse.json({
            businesses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Business fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch businesses' },
            { status: 500 }
        );
    }
}

// POST create new business (requires authentication)
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
            bname,
            address1,
            address2,
            city,
            state,
            zip,
            phone,
            type
        } = body;

        // Validation
        if (!bname || !address1 || !city || !state || !zip || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create business
        const business = new Business({
            bname: bname.trim(),
            address1: address1.trim(),
            address2: address2?.trim() || '',
            city: city.trim(),
            state: state.toUpperCase(),
            zip: zip.trim(),
            phone: phone?.trim() || '',
            type: type.toUpperCase(),
            status: 'active',
            created_by: session.user.id,
            updated_by: session.user.id
        });

        await business.save();

        return NextResponse.json({
            message: 'Business created successfully',
            business
        }, { status: 201 });

    } catch (error) {
        console.error('Business creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create business' },
            { status: 500 }
        );
    }
}