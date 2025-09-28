import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import connectDB from '../../../../lib/mongodb.js';
import { Incentive } from '../../../../models/index.js';

// GET specific incentive
export async function GET(request, { params }) {
    try {
        await connectDB();

        const incentive = await Incentive.findById(params.id).lean();

        if (!incentive) {
            return NextResponse.json(
                { error: 'Incentive not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ incentive });

    } catch (error) {
        console.error('Incentive fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incentive' },
            { status: 500 }
        );
    }
}

// PUT update incentive (requires authentication)
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

        const incentive = await Incentive.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!incentive) {
            return NextResponse.json(
                { error: 'Incentive not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Incentive updated successfully',
            incentive
        });

    } catch (error) {
        console.error('Incentive update error:', error);
        return NextResponse.json(
            { error: 'Failed to update incentive' },
            { status: 500 }
        );
    }
}

// DELETE incentive (admin only)
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

        const incentive = await Incentive.findByIdAndUpdate(
            params.id,
            {
                is_available: false,
                updated_by: session.user.id,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!incentive) {
            return NextResponse.json(
                { error: 'Incentive not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Incentive deactivated successfully'
        });

    } catch (error) {
        console.error('Incentive deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete incentive' },
            { status: 500 }
        );
    }
}