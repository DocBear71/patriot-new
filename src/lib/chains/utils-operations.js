// file: /src/lib/chains/utils-operations.js v1 - Utility operations for chains

import { NextResponse } from 'next/server';
import connectDB from '../mongodb';
import { verifyAdminAccess } from '../admin-auth';
import mongoose from 'mongoose';
import Chain from '../../models/Chain';
import Business from '../../models/Business';

const { ObjectId } = mongoose.Types;

/**
 * Search chains by name or business type
 */
export async function handleSearchChains(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || searchParams.get('query');
        const business_type = searchParams.get('business_type');

        if (!query && !business_type) {
            return NextResponse.json(
                { message: 'Search query or business type is required' },
                { status: 400 }
            );
        }

        console.log(`🔍 CHAINS: Searching chains - query: "${query}", type: "${business_type}"`);

        await connectDB();

        // Build search criteria
        const searchCriteria = { status: { $ne: 'deleted' } };

        if (query) {
            searchCriteria.chain_name = { $regex: query, $options: 'i' };
        }

        if (business_type) {
            searchCriteria.business_type = business_type;
        }

        // Search chains with location counts
        const chains = await Chain.aggregate([
            { $match: searchCriteria },
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
                    }
                }
            },
            {
                $project: {
                    locations: 0 // Remove the actual locations array
                }
            },
            { $sort: { chain_name: 1 } }
        ]);

        console.log(`📊 Found ${chains.length} matching chains`);

        return NextResponse.json({
            success: true,
            chains,
            search_criteria: { query, business_type },
            total_results: chains.length
        });

    } catch (error) {
        console.error('❌ Error searching chains:', error);
        return NextResponse.json(
            { message: 'Error searching chains: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Find matching chain for a business name
 */
export async function handleFindChainMatch(request) {
    try {
        const { searchParams } = new URL(request.url);
        const business_name = searchParams.get('business_name');

        if (!business_name) {
            return NextResponse.json(
                { message: 'Business name is required' },
                { status: 400 }
            );
        }

        console.log(`🔍 CHAINS: Finding chain match for business: "${business_name}"`);

        await connectDB();

        // Try to find exact match first
        let chain = await Chain.findOne({
            chain_name: { $regex: new RegExp(`^${business_name}$`, 'i') },
            status: { $ne: 'deleted' }
        }).lean();

        // If no exact match, try partial match
        if (!chain) {
            chain = await Chain.findOne({
                chain_name: { $regex: business_name, $options: 'i' },
                status: { $ne: 'deleted' }
            }).lean();
        }

        if (chain) {
            // Get location count
            const locationCount = await Business.countDocuments({ chain_id: chain._id });
            chain.location_count = locationCount;

            console.log(`✅ Found chain match: ${chain.chain_name} (${locationCount} locations)`);

            return NextResponse.json({
                success: true,
                match_found: true,
                chain,
                match_type: 'exact' // You could enhance this to distinguish exact vs partial
            });
        } else {
            console.log(`❌ No chain match found for: ${business_name}`);

            return NextResponse.json({
                success: true,
                match_found: false,
                business_name,
                message: 'No matching chain found'
            });
        }

    } catch (error) {
        console.error('❌ Error finding chain match:', error);
        return NextResponse.json(
            { message: 'Error finding chain match: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Bulk update universal incentives for multiple chains
 */
export async function handleBulkUpdateUniversalIncentives(request) {
    console.log("🔄 CHAINS: Bulk updating universal incentives");

    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
        return NextResponse.json(
            { message: adminCheck.message },
            { status: adminCheck.status }
        );
    }

    try {
        const body = await request.json();
        const { chain_ids, universal_incentives } = body;

        if (!chain_ids || !Array.isArray(chain_ids) || chain_ids.length === 0) {
            return NextResponse.json(
                { message: 'Chain IDs array is required' },
                { status: 400 }
            );
        }

        if (universal_incentives === undefined) {
            return NextResponse.json(
                { message: 'Universal incentives value is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Update chains
        const chainResult = await Chain.updateMany(
            { _id: { $in: chain_ids.map(id => new ObjectId(id)) } },
            {
                $set: {
                    universal_incentives: universal_incentives,
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            }
        );

        // Update all associated businesses
        const businessResult = await Business.updateMany(
            { chain_id: { $in: chain_ids.map(id => new ObjectId(id)) } },
            {
                $set: {
                    universal_incentives: universal_incentives,
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            }
        );

        console.log(`✅ Bulk update completed:`);
        console.log(`   - Chains updated: ${chainResult.modifiedCount}`);
        console.log(`   - Businesses updated: ${businessResult.modifiedCount}`);
        console.log(`   - Universal incentives set to: ${universal_incentives}`);

        return NextResponse.json({
            success: true,
            message: 'Bulk update completed successfully',
            chains_updated: chainResult.modifiedCount,
            businesses_updated: businessResult.modifiedCount,
            universal_incentives: universal_incentives
        });

    } catch (error) {
        console.error('❌ Error in bulk update:', error);
        return NextResponse.json(
            { message: 'Error in bulk update: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Get chain summary statistics
 */
export async function handleChainSummary(request) {
    try {
        console.log("📊 CHAINS: Generating summary statistics");

        await connectDB();

        // Get comprehensive chain statistics
        const summary = await Chain.aggregate([
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
                $group: {
                    _id: null,
                    total_chains: { $sum: 1 },
                    chains_with_universal_incentives: {
                        $sum: { $cond: [{ $eq: ['$universal_incentives', true] }, 1, 0] }
                    },
                    total_locations: { $sum: { $size: '$locations' } },
                    enabled_locations: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$locations',
                                    cond: { $eq: ['$$this.universal_incentives', true] }
                                }
                            }
                        }
                    },
                    total_chain_incentives: {
                        $sum: { $size: { $ifNull: ['$incentives', []] } }
                    },
                    active_chain_incentives: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: { $ifNull: ['$incentives', []] },
                                    cond: { $ne: ['$$this.is_active', false] }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        // Get business type breakdown
        const businessTypeBreakdown = await Chain.aggregate([
            {
                $match: { status: { $ne: 'deleted' } }
            },
            {
                $group: {
                    _id: '$business_type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get top chains by location count
        const topChains = await Chain.aggregate([
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
                    location_count: { $size: '$locations' }
                }
            },
            {
                $sort: { location_count: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    chain_name: 1,
                    business_type: 1,
                    universal_incentives: 1,
                    location_count: 1
                }
            }
        ]);

        const result = {
            summary: summary[0] || {
                total_chains: 0,
                chains_with_universal_incentives: 0,
                total_locations: 0,
                enabled_locations: 0,
                total_chain_incentives: 0,
                active_chain_incentives: 0
            },
            business_type_breakdown: businessTypeBreakdown,
            top_chains_by_locations: topChains,
            generated_at: new Date()
        };

        console.log("📊 Chain summary generated successfully");

        return NextResponse.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('❌ Error generating chain summary:', error);
        return NextResponse.json(
            { message: 'Error generating chain summary: ' + error.message },
            { status: 500 }
        );
    }
}