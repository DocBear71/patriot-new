import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import connectDB from '../../../../lib/mongodb.js';
import { Business } from '../../../../models/index.js';

// GET specific business
export async function GET(request, { params }) {
    try {
        await connectDB();

        const business = await Business.findById(params.id).lean();

        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ business });

    } catch (error) {
        console.error('Business fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business' },
            { status: 500 }
        );
    }
}

// PUT update business (requires authentication)
export async function PUT(request, { params }) {
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
        const updateData = {
            ...body,
            updated_by: session.user.id,
            updated_at: new Date()
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const business = await Business.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Business updated successfully',
            business
        });

    } catch (error) {
        console.error('Business update error:', error);
        return NextResponse.json(
            { error: 'Failed to update business' },
            { status: 500 }
        );
    }
}

// DELETE business (admin only)
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.isAdmin) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        await connectDB();

        const business = await Business.findByIdAndUpdate(
            params.id,
            {
                status: 'inactive',
                updated_by: session.user.id,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Business deactivated successfully'
        });

    } catch (error) {
        console.error('Business deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete business' },
            { status: 500 }
        );
    }
}