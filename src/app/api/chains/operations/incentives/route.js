// file: /src/app/api/chains/operations/incentives/route.js v1 - Incentive management operations for chains

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import { verifyAdminAccess } from '../../helpers/admin-auth/route';
import mongoose from 'mongoose';
import Chain from '../../../../../models/Chain';

const { ObjectId } = mongoose.Types;

/**
 * Add incentive to chain
 */
export async function handleAddChainIncentive(request) {
    console.log("🎁 CHAINS: Adding incentive to chain");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
        );
    }

    if (request.method !== 'POST') {
        return NextResponse.json(
            { message: 'Method not allowed' },
            { status: 405 }
        );
    }

    try {
        const body = await request.json();
        const { chain_id, type, amount, description, other_description, information, discount_type } = body;

        if (!chain_id || !type || amount === undefined) {
            return NextResponse.json(
                { message: 'Chain ID, type, and amount are required' },
                { status: 400 }
            );
        }

        await connectDB();

        const newIncentive = {
            _id: new ObjectId(),
            type,
            amount: parseFloat(amount),
            description: description || '',
            other_description: type === 'OT' ?
                (other_description || '') : '',
            information: information || '',
            discount_type: discount_type || 'percentage',
            is_active: true,
            created_date: new Date(),
            created_by: adminCheck.userId
        };

        const result = await Chain.findByIdAndUpdate(
            chain_id,
            {
                $push: { incentives: newIncentive },
                $set: {
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        console.log(`✅ Incentive added to chain ${result.chain_name}: ${type} ${amount}%`);

        return NextResponse.json({
            success: true,
            message: 'Incentive added to chain successfully',
            incentive: newIncentive
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Error adding chain incentive:', error);
        return NextResponse.json(
            { message: 'Error adding incentive: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * NEW: Update chain incentive
 */
export async function handleUpdateChainIncentive(request) {
    console.log("✏️ CHAINS: Updating chain incentive");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
        );
    }

    if (request.method !== 'POST') {
        return NextResponse.json(
            { message: 'Method not allowed' },
            { status: 405 }
        );
    }

    try {
        const body = await request.json();
        const { chain_id, incentive_id, type, amount, description, other_description, information, discount_type, is_active } = body;

        if (!chain_id || !incentive_id) {
            return NextResponse.json(
                { message: 'Chain ID and incentive ID are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Build the update object for the specific incentive
        const updateFields = {};
        if (type !== undefined) updateFields['incentives.$.type'] = type;
        if (amount !== undefined) updateFields['incentives.$.amount'] = parseFloat(amount);
        if (description !== undefined) updateFields['incentives.$.description'] = description;
        if (other_description !== undefined) updateFields['incentives.$.other_description'] = other_description;
        if (information !== undefined) updateFields['incentives.$.information'] = information;
        if (discount_type !== undefined) updateFields['incentives.$.discount_type'] = discount_type;
        if (is_active !== undefined) updateFields['incentives.$.is_active'] = is_active;

        // Always update the modified date and user
        updateFields['incentives.$.updated_date'] = new Date();
        updateFields['incentives.$.updated_by'] = adminCheck.userId;
        updateFields['updated_date'] = new Date();
        updateFields['updated_by'] = adminCheck.userId;

        const result = await Chain.findOneAndUpdate(
            {
                _id: chain_id,
                'incentives._id': new ObjectId(incentive_id)
            },
            { $set: updateFields },
            { new: true }
        );

        if (!result) {
            return NextResponse.json(
                { message: 'Chain or incentive not found' },
                { status: 404 }
            );
        }

        // Find the updated incentive to return
        const updatedIncentive = result.incentives.find(
            inc => inc._id.toString() === incentive_id
        );

        console.log(`✅ Incentive updated in chain ${result.chain_name}`);

        return NextResponse.json({
            success: true,
            message: 'Chain incentive updated successfully',
            incentive: updatedIncentive
        });

    } catch (error) {
        console.error('❌ Error updating chain incentive:', error);
        return NextResponse.json(
            { message: 'Error updating incentive: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Remove incentive from chain
 */
export async function handleRemoveChainIncentive(request) {
    console.log("🗑️ CHAINS: Removing incentive from chain");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
        );
    }

    if (request.method !== 'POST') {
        return NextResponse.json(
            { message: 'Method not allowed' },
            { status: 405 }
        );
    }

    try {
        const body = await request.json();
        const { chain_id, incentive_id } = body;

        if (!chain_id || !incentive_id) {
            return NextResponse.json(
                { message: 'Chain ID and incentive ID are required' },
                { status: 400 }
            );
        }

        await connectDB();

        const result = await Chain.findByIdAndUpdate(
            chain_id,
            {
                $pull: {
                    incentives: { _id: new ObjectId(incentive_id) }
                },
                $set: {
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        console.log(`✅ Incentive removed from chain ${result.chain_name}`);

        return NextResponse.json({
            success: true,
            message: 'Incentive removed from chain successfully'
        });

    } catch (error) {
        console.error('❌ Error removing chain incentive:', error);
        return NextResponse.json(
            { message: 'Error removing incentive: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * ENHANCED: Get chain incentives with detailed logging
 */
export async function handleGetChainIncentives(request) {
    try {
        const { searchParams } = new URL(request.url);
        const chain_id = searchParams.get('chain_id');

        if (!chain_id) {
            return NextResponse.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        console.log(`🎁 CHAINS: Getting incentives for chain ${chain_id}`);

        await connectDB();

        const chain = await Chain.findById(chain_id)
            .select('incentives chain_name universal_incentives')
            .lean();

        if (!chain) {
            console.log(`❌ Chain not found: ${chain_id}`);
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Filter for active incentives only
        const activeIncentives = chain.incentives ?
            chain.incentives.filter(incentive => incentive.is_active !== false) : [];

        console.log(`📊 Chain ${chain.chain_name}:`);
        console.log(`   - Universal incentives: ${chain.universal_incentives}`);
        console.log(`   - Total incentives: ${chain.incentives ? chain.incentives.length : 0}`);
        console.log(`   - Active incentives: ${activeIncentives.length}`);

        return NextResponse.json({
            success: true,
            chain_name: chain.chain_name,
            universal_incentives: chain.universal_incentives,
            incentives: activeIncentives,
            total_incentives: chain.incentives ? chain.incentives.length : 0,
            active_incentives: activeIncentives.length
        });

    } catch (error) {
        console.error('❌ Error getting chain incentives:', error);
        return NextResponse.json(
            { message: 'Error retrieving incentives: ' + error.message },
            { status: 500 }
        );
    }
}