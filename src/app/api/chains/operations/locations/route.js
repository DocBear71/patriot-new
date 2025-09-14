// file: /src/app/api/chains/operations/locations/route.js v1 - Location management operations for chains

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import { verifyAdminAccess } from '../../../../../lib/admin-auth';
import mongoose from 'mongoose';
import Chain from '../../../../../models/Chain';
import Business from '../../../../../models/Business';

const { ObjectId } = mongoose.Types;

/**
 * Add business location to chain
 */
export async function handleAddLocationToChain(request) {
    console.log("📍 CHAINS: Adding location to chain");

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
        const { chain_id, business_id } = body;

        if (!chain_id || !business_id) {
            return NextResponse.json(
                { message: 'Chain ID and business ID are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Get chain details
        const chain = await Chain.findById(chain_id);
        if (!chain) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Get business details
        const business = await Business.findById(business_id);
        if (!business) {
            return NextResponse.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        // Check if business is already part of a chain
        if (business.chain_id && business.chain_id.toString() !== chain_id) {
            return NextResponse.json(
                { message: 'Business is already part of another chain' },
                { status: 409 }
            );
        }

        // Add business to chain
        const updateResult = await Business.findByIdAndUpdate(
            business_id,
            {
                $set: {
                    chain_id: new ObjectId(chain_id),
                    chain_name: chain.chain_name,
                    universal_incentives: chain.universal_incentives,
                    is_chain_location: true,
                    updated_date: new Date()
                }
            },
            { new: true }
        );

        console.log(`✅ Business ${business.bname} added to chain ${chain.chain_name}`);
        console.log(`   - Universal incentives inherited: ${chain.universal_incentives}`);

        return NextResponse.json({
            success: true,
            message: 'Location added to chain successfully',
            business: updateResult
        });

    } catch (error) {
        console.error('❌ Error adding location to chain:', error);
        return NextResponse.json(
            { message: 'Error adding location to chain: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Remove business location from chain
 */
export async function handleRemoveLocationFromChain(request) {
    console.log("📍 CHAINS: Removing location from chain");

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
        const { business_id } = body;

        if (!business_id) {
            return NextResponse.json(
                { message: 'Business ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Get business details before removal
        const business = await Business.findById(business_id);
        if (!business) {
            return NextResponse.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        const chainName = business.chain_name || 'Unknown';

        // Remove chain association
        const updateResult = await Business.findByIdAndUpdate(
            business_id,
            {
                $unset: {
                    chain_id: 1,
                    chain_name: 1,
                    universal_incentives: 1,
                    is_chain_location: 1
                },
                $set: {
                    updated_date: new Date()
                }
            },
            { new: true }
        );

        console.log(`✅ Business ${business.bname} removed from chain ${chainName}`);

        return NextResponse.json({
            success: true,
            message: 'Location removed from chain successfully',
            business: updateResult
        });

    } catch (error) {
        console.error('❌ Error removing location from chain:', error);
        return NextResponse.json(
            { message: 'Error removing location from chain: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Get all locations for a specific chain
 */
export async function handleGetChainLocations(request) {
    try {
        const { searchParams } = new URL(request.url);
        const chain_id = searchParams.get('chain_id');

        if (!chain_id) {
            return NextResponse.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        console.log(`📍 CHAINS: Getting locations for chain ${chain_id}`);

        await connectDB();

        // Get chain details
        const chain = await Chain.findById(chain_id).select('chain_name universal_incentives');
        if (!chain) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Get all locations for this chain
        const locations = await Business.find({ chain_id: chain_id })
            .select('bname address city state zip phone universal_incentives created_date')
            .sort({ bname: 1 })
            .lean();

        console.log(`📊 Chain ${chain.chain_name}: ${locations.length} locations`);

        // Add status information for each location
        const locationsWithStatus = locations.map(location => ({
            ...location,
            inheritance_status: location.universal_incentives === true ?
                'enabled' :
                location.universal_incentives === false ? 'disabled' : 'undefined'
        }));

        return NextResponse.json({
            success: true,
            chain_name: chain.chain_name,
            chain_universal_incentives: chain.universal_incentives,
            locations: locationsWithStatus,
            total_locations: locations.length
        });

    } catch (error) {
        console.error('❌ Error getting chain locations:', error);
        return NextResponse.json(
            { message: 'Error retrieving chain locations: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * NEW: Sync chain locations - ensures all locations have proper inheritance settings
 */
export async function handleSyncChainLocations(request) {
    console.log("🔄 CHAINS: Syncing chain locations");

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
        const { chain_id } = body;

        if (!chain_id) {
            return NextResponse.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Get chain details
        const chain = await Chain.findById(chain_id);
        if (!chain) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        console.log(`🔄 Syncing locations for chain: ${chain.chain_name}`);
        console.log(`   - Target universal_incentives: ${chain.universal_incentives}`);

        // Update all locations to match chain settings
        const syncResult = await Business.updateMany(
            { chain_id: chain_id },
            {
                $set: {
                    chain_name: chain.chain_name, // Ensure chain name is current
                    universal_incentives: chain.universal_incentives,
                    is_chain_location: true,
                    updated_date: new Date()
                }
            }
        );

        console.log(`✅ Synced ${syncResult.modifiedCount} locations`);

        // Get updated stats
        const totalLocations = await Business.countDocuments({ chain_id: chain_id });
        const enabledLocations = await Business.countDocuments({
            chain_id: chain_id,
            universal_incentives: true
        });

        return NextResponse.json({
            success: true,
            message: 'Chain locations synced successfully',
            chain_name: chain.chain_name,
            total_locations: totalLocations,
            synced_count: syncResult.modifiedCount,
            enabled_count: enabledLocations
        });

    } catch (error) {
        console.error('❌ Error syncing chain locations:', error);
        return NextResponse.json(
            { message: 'Error syncing chain locations: ' + error.message },
            { status: 500 }
        );
    }
}