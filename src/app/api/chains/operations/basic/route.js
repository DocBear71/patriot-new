// file: /src/app/api/chains/operations/basic/route.js v1 - Basic CRUD operations for chains

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import { verifyAdminAccess } from '../../helpers/admin-auth/route';
import mongoose from 'mongoose';
import Chain from '../../../../../models/Chain';
import Business from '../../../../../models/Business';

const { ObjectId } = mongoose.Types;

/**
 * ENHANCED: List all chains with location counts and better stats
 */
export async function handleListChains(request) {
    console.log("📋 CHAINS: Listing chains with enhanced stats");

    try {
        await connectDB();

        // Enhanced aggregation to get complete chain stats
        const chains = await Chain.aggregate([
            {
                $match: { status: { $ne: 'deleted' } }
            },
            {
                $lookup: {
                    from: 'businesses',
                    localField: '_id',
                    foreignField: 'chain_id',
                    as: 'locations'
                }
            },
            {
                $addFields: {
                    location_count: { $size: '$locations' },
                    enabled_locations: {
                        $size: {
                            $filter: {
                                input: '$locations',
                                cond: { $eq: ['$$this.universal_incentives', true] }
                            }
                        }
                    },
                    incentive_count: { $size: { $ifNull: ['$incentives', []] } },
                    active_incentive_count: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ['$incentives', []] },
                                cond: { $ne: ['$$this.is_active', false] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    locations: 0 // Remove the actual locations array to reduce response size
                }
            },
            {
                $sort: { chain_name: 1 }
            }
        ]);

        console.log(`📊 Found ${chains.length} chains with complete stats`);

        // Log summary for debugging
        const totalLocations = chains.reduce((sum, chain) => sum + chain.location_count, 0);
        const totalEnabledLocations = chains.reduce((sum, chain) => sum + chain.enabled_locations, 0);
        console.log(`   - Total locations across all chains: ${totalLocations}`);
        console.log(`   - Total enabled locations: ${totalEnabledLocations}`);

        return NextResponse.json({
            success: true,
            chains,
            summary: {
                total_chains: chains.length,
                total_locations: totalLocations,
                total_enabled_locations: totalEnabledLocations
            }
        });

    } catch (error) {
        console.error('❌ Error listing chains:', error);
        return NextResponse.json(
            { message: 'Error retrieving chains: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Get specific chain details
 */
export async function handleGetChain(request) {
    console.log("🔍 CHAINS: Getting chain details");

    try {
        const { searchParams } = new URL(request.url);
        const chainId = searchParams.get('id');

        if (!chainId) {
            return NextResponse.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        const chain = await Chain.findById(chainId).lean();
        if (!chain) {
            console.log(`❌ Chain not found: ${chainId}`);
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Get location count and enabled count
        const locationCount = await Business.countDocuments({ chain_id: chainId });
        const enabledCount = await Business.countDocuments({
            chain_id: chainId,
            universal_incentives: true
        });

        // Filter for active incentives only
        const activeIncentives = chain.incentives ?
            chain.incentives.filter(incentive => incentive.is_active !== false) : [];

        const enhancedChain = {
            ...chain,
            location_count: locationCount,
            enabled_locations: enabledCount,
            active_incentive_count: activeIncentives.length,
            incentives: activeIncentives
        };

        console.log(`✅ Chain details retrieved: ${chain.chain_name}`);
        console.log(`   - Locations: ${locationCount} (${enabledCount} enabled)`);
        console.log(`   - Active incentives: ${activeIncentives.length}`);

        return NextResponse.json({
            success: true,
            chain: enhancedChain
        });

    } catch (error) {
        console.error('❌ Error getting chain:', error);
        return NextResponse.json(
            { message: 'Error retrieving chain: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Create new chain
 */
export async function handleCreateChain(request) {
    console.log("➕ CHAINS: Creating new chain");

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
        const { chain_name, business_type, universal_incentives, corporate_info } = body;

        if (!chain_name || !business_type) {
            return NextResponse.json(
                { message: 'Chain name and business type are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if chain already exists
        const existingChain = await Chain.findOne({
            chain_name: { $regex: new RegExp(`^${chain_name}$`, 'i') }
        });

        if (existingChain) {
            return NextResponse.json(
                { message: 'Chain with this name already exists' },
                { status: 409 }
            );
        }

        const newChain = new Chain({
            chain_name: chain_name.trim(),
            business_type,
            universal_incentives: universal_incentives !== undefined ?
                universal_incentives : false,
            corporate_info: corporate_info || {},
            incentives: [],
            status: 'active',
            created_date: new Date(),
            created_by: adminCheck.userId
        });

        const savedChain = await newChain.save();

        console.log(`✅ New chain created: ${savedChain.chain_name}`);
        console.log(`   - Type: ${savedChain.business_type}`);
        console.log(`   - Universal incentives: ${savedChain.universal_incentives}`);

        return NextResponse.json({
            success: true,
            message: 'Chain created successfully',
            chain: savedChain
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Error creating chain:', error);
        return NextResponse.json(
            { message: 'Error creating chain: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Update existing chain
 */
export async function handleUpdateChain(request) {
    console.log("✏️ CHAINS: Updating chain");

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
        const { _id, chain_name, business_type, universal_incentives, corporate_info, status } = body;

        if (!_id) {
            return NextResponse.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Build update object
        const updateData = {
            updated_date: new Date(),
            updated_by: adminCheck.userId
        };

        if (chain_name !== undefined) updateData.chain_name = chain_name.trim();
        if (business_type !== undefined) updateData.business_type = business_type;
        if (universal_incentives !== undefined) updateData.universal_incentives = universal_incentives;
        if (corporate_info !== undefined) updateData.corporate_info = corporate_info;
        if (status !== undefined) updateData.status = status;

        const result = await Chain.findByIdAndUpdate(
            _id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!result) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        console.log(`✅ Chain updated: ${result.chain_name}`);

        // If universal_incentives changed, optionally sync all locations
        if (universal_incentives !== undefined) {
            console.log(`🔄 Universal incentives changed to: ${universal_incentives}`);
            // Note: Location sync is handled by separate sync operation
        }

        return NextResponse.json({
            success: true,
            message: 'Chain updated successfully',
            chain: result,
            locations_require_sync: universal_incentives !== undefined ? true : false
        });

    } catch (error) {
        console.error('❌ Error updating chain:', error);
        return NextResponse.json(
            { message: 'Error updating chain: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Delete chain (removes chain references from businesses)
 */
export async function handleDeleteChain(request) {
    console.log("🗑️ CHAINS: Deleting chain");

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
        const { _id } = body;

        if (!_id) {
            return NextResponse.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Get chain details before deletion
        const chain = await Chain.findById(_id);
        if (!chain) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Remove chain references from all businesses
        const updateResult = await Business.updateMany(
            { chain_id: _id },
            {
                $unset: {
                    chain_id: 1,
                    chain_name: 1,
                    universal_incentives: 1
                }
            }
        );

        console.log(`📄 Removed chain references from ${updateResult.modifiedCount} locations`);

        // Delete the chain
        const result = await Chain.findByIdAndDelete(_id);

        console.log(`✅ Chain deleted: ${chain.chain_name}`);

        return NextResponse.json({
            success: true,
            message: 'Chain deleted successfully',
            locations_updated: updateResult.modifiedCount
        });

    } catch (error) {
        console.error('❌ Error deleting chain:', error);
        return NextResponse.json(
            { message: 'Error deleting chain: ' + error.message },
            { status: 500 }
        );
    }
}