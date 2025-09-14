// file: /src/lib/chains/locations-operations.js v1 - Location management operations for chains

import { NextResponse } from 'next/server';
import connectDB from '../mongodb';
import { verifyAdminAccess } from '../admin-auth';
import mongoose from 'mongoose';
import Chain from '../../models/Chain';
import Business from '../../models/Business';

const { ObjectId } = mongoose.Types;

/**
 * Add location to chain
 */
export async function handleAddLocationToChain(request) {
    console.log("🏢 CHAINS: Adding location to chain");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
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

        // Update business with chain information
        const business = await Business.findByIdAndUpdate(
            business_id,
            {
                $set: {
                    chain_id: chain_id,
                    chain_name: chain.chain_name,
                    universal_incentives: chain.universal_incentives || false,
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            },
            { new: true }
        );

        if (!business) {
            return NextResponse.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        console.log(`✅ Business ${business.bname} added to chain ${chain.chain_name}`);

        return NextResponse.json({
            success: true,
            message: 'Location added to chain successfully',
            business,
            chain_universal_incentives: chain.universal_incentives
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
 * Remove location from chain
 */
export async function handleRemoveLocationFromChain(request) {
    console.log("🗑️ CHAINS: Removing location from chain");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
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

        // Remove chain references from business
        const business = await Business.findByIdAndUpdate(
            business_id,
            {
                $unset: {
                    chain_id: 1,
                    chain_name: 1,
                    universal_incentives: 1
                },
                $set: {
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            },
            { new: true }
        );

        if (!business) {
            return NextResponse.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        console.log(`✅ Business ${business.bname} removed from chain`);

        return NextResponse.json({
            success: true,
            message: 'Location removed from chain successfully',
            business
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
 * Get chain locations
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

        console.log(`🏢 CHAINS: Getting locations for chain ${chain_id}`);

        await connectDB();

        // Get chain info
        const chain = await Chain.findById(chain_id)
            .select('chain_name universal_incentives')
            .lean();

        if (!chain) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Get all businesses associated with this chain
        const locations = await Business.find({ chain_id: chain_id })
            .select('bname address1 address2 city state zip phone status universal_incentives incentives')
            .sort({ bname: 1 })
            .lean();

        console.log(`📊 Found ${locations.length} locations for chain ${chain.chain_name}`);

        return NextResponse.json({
            success: true,
            chain_name: chain.chain_name,
            universal_incentives: chain.universal_incentives,
            location_count: locations.length,
            locations
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
 * Sync chain universal incentives to all locations
 */
export async function handleSyncChainLocations(request) {
    console.log("🔄 CHAINS: Syncing chain universal incentives to locations");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
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

        // Get chain info
        const chain = await Chain.findById(chain_id);
        if (!chain) {
            return NextResponse.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Update all businesses associated with this chain
        const updateResult = await Business.updateMany(
            { chain_id: chain_id },
            {
                $set: {
                    universal_incentives: chain.universal_incentives || false,
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            }
        );

        console.log(`✅ Synced ${updateResult.modifiedCount} locations for chain ${chain.chain_name}`);
        console.log(`   - Universal incentives set to: ${chain.universal_incentives}`);

        return NextResponse.json({
            success: true,
            message: 'Chain locations synced successfully',
            chain_name: chain.chain_name,
            universal_incentives: chain.universal_incentives,
            locations_updated: updateResult.modifiedCount
        });

    } catch (error) {
        console.error('❌ Error syncing chain locations:', error);
        return NextResponse.json(
            { message: 'Error syncing chain locations: ' + error.message },
            { status: 500 }
        );
    }
}