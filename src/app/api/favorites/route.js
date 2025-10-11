// file: /src/app/api/favorites/route.js v1 - Favorites management API

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import User from '../../../models/User';
import Business from '../../../models/Business';
import Incentive from '../../../models/Incentive';

/**
 * GET - Fetch user's favorites
 */
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await connectDB;

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'businesses', 'incentives', or 'all'

        // Find user and populate favorites
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize favorites if not present
        if (!user.favorites) {
            user.favorites = { businesses: [], incentives: [] };
        }

        let result = {};

        if (type === 'businesses' || type === 'all' || !type) {
            // Populate business favorites
            const businesses = await Business.find({
                _id: { $in: user.favorites.businesses || [] }
            }).lean();

            result.businesses = businesses;
        }

        if (type === 'incentives' || type === 'all' || !type) {
            // Populate incentive favorites with business info
            const incentives = await Incentive.find({
                _id: { $in: user.favorites.incentives || [] }
            }).lean();

            // Get business info for each incentive
            const incentivesWithBusiness = await Promise.all(
                incentives.map(async (incentive) => {
                    const business = await Business.findById(incentive.business_id).lean();
                    return {
                        ...incentive,
                        business: business ? {
                            _id: business._id,
                            bname: business.bname,
                            city: business.city,
                            state: business.state
                        } : null
                    };
                })
            );

            result.incentives = incentivesWithBusiness;
        }

        return NextResponse.json({
            success: true,
            favorites: result
        });

    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST - Add item to favorites
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await connectDB;

        const { itemId, type } = await request.json(); // type: 'business' or 'incentive'

        if (!itemId || !type) {
            return NextResponse.json(
                { message: 'Item ID and type are required' },
                { status: 400 }
            );
        }

        if (type !== 'business' && type !== 'incentive') {
            return NextResponse.json(
                { message: 'Invalid type. Must be "business" or "incentive"' },
                { status: 400 }
            );
        }

        // Find user
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize favorites if not present
        if (!user.favorites) {
            user.favorites = { businesses: [], incentives: [] };
        }

        // Add to appropriate array if not already present
        const favoriteArray = type === 'business' ? 'businesses' : 'incentives';

        if (!user.favorites[favoriteArray].includes(itemId)) {
            user.favorites[favoriteArray].push(itemId);
            await user.save();

            return NextResponse.json({
                success: true,
                message: `${type} added to favorites`
            });
        } else {
            return NextResponse.json({
                success: true,
                message: `${type} already in favorites`
            });
        }

    } catch (error) {
        console.error('Error adding to favorites:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Remove item from favorites
 */
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        await connectDB;

        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');
        const type = searchParams.get('type'); // 'business' or 'incentive'

        if (!itemId || !type) {
            return NextResponse.json(
                { message: 'Item ID and type are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize favorites if not present
        if (!user.favorites) {
            user.favorites = { businesses: [], incentives: [] };
        }

        // Remove from appropriate array
        const favoriteArray = type === 'business' ? 'businesses' : 'incentives';

        user.favorites[favoriteArray] = user.favorites[favoriteArray].filter(
            id => id.toString() !== itemId
        );

        await user.save();

        return NextResponse.json({
            success: true,
            message: `${type} removed from favorites`
        });

    } catch (error) {
        console.error('Error removing from favorites:', error);
        return NextResponse.json(
            { message: 'Server error', error: error.message },
            { status: 500 }
        );
    }
}