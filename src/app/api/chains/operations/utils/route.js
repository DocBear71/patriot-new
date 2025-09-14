// file: /src/app/api/chains/operations/utils/route.js v1 - Utility operations for chains (search, find_match, bulk operations, summary)

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import { verifyAdminAccess } from '../../../../../lib/admin-auth';
import mongoose from 'mongoose';
import Chain from '../../../../../models/Chain';
import Business from '../../../../../models/Business';

const { ObjectId } = mongoose.Types;

/**
 * Search chains by name or business type
 */
export async function handleSearchChains(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || searchParams.get('query');
        const business_type = searchParams.get('business_type');

        console.log(`🔍 CHAINS: Searching - query: "${query}", type: "${business_type}"`);

        if (!query && !business_type) {
            return NextResponse.json(
                { message: 'Search query or business type is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Build search criteria
        const searchCriteria = { status: { $ne: 'deleted' } };

        if (query) {
            searchCriteria.chain_name = {
                $regex: new RegExp(query, 'i')
            };
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

        console.log(`📊 Found ${chains.length} chains matching search criteria`);

        return NextResponse.json({
            success: true,
            chains,
            total: chains.length,
            search_query: query,
            business_type: business_type
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
 * Find potential chain match for a business
 */
export async function handleFindChainMatch(request) {
    try {
        const { searchParams } = new URL(request.url);
        const business_name = searchParams.get('business_name');
        const business_type = searchParams.get('business_type');

        console.log(`🔍 CHAINS: Finding match for business "${business_name}" (${business_type})`);

        if (!business_name) {
            return NextResponse.json(
                { message: 'Business name is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Build search criteria for potential matches
        const searchCriteria = { status: { $ne: 'deleted' } };

        // Add business type filter if provided
        if (business_type) {
            searchCriteria.business_type = business_type;
        }

        // Search for chains with similar names
        const potentialMatches = await Chain.find({
            ...searchCriteria,
            chain_name: {
                $regex: new RegExp(business_name.split(' ')[0], 'i')
            }
        })
            .select('chain_name business_type universal_incentives')
            .lean();

        // Enhanced matching logic
        const matches = [];
        const businessNameLower = business_name.toLowerCase();

        for (const chain of potentialMatches) {
            const chainNameLower = chain.chain_name.toLowerCase();
            let confidence = 0;

            // Exact match
            if (chainNameLower === businessNameLower) {
                confidence = 100;
            }
            // Chain name is contained in business name
            else if (businessNameLower.includes(chainNameLower)) {
                confidence = 90;
            }
            // Business name is contained in chain name
            else if (chainNameLower.includes(businessNameLower)) {
                confidence = 85;
            }
            // First word match
            else if (chainNameLower.split(' ')[0] === businessNameLower.split(' ')[0]) {
                confidence = 70;
            }
            // Partial word match
            else {
                const chainWords = chainNameLower.split(' ');
                const businessWords = businessNameLower.split(' ');
                const commonWords = chainWords.filter(word => businessWords.includes(word));
                if (commonWords.length > 0) {
                    confidence = (commonWords.length / Math.max(chainWords.length, businessWords.length)) * 60;
                }
            }

            if (confidence > 0) {
                matches.push({
                    ...chain,
                    confidence: Math.round(confidence)
                });
            }
        }

        // Sort by confidence
        matches.sort((a, b) => b.confidence - a.confidence);

        console.log(`📊 Found ${matches.length} potential matches for "${business_name}"`);

        return NextResponse.json({
            success: true,
            business_name,
            business_type,
            matches,
            best_match: matches.length > 0 ? matches[0] : null
        });

    } catch (error) {
        console.error('❌ Error finding chain match:', error);
        return NextResponse.json(
            { message: 'Error finding chain match: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * NEW: Bulk update universal incentives for multiple chains
 */
export async function handleBulkUpdateUniversalIncentives(request) {
    console.log("📄 CHAINS: Bulk updating universal incentives");

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
        const { chain_ids, universal_incentives, sync_locations } = body;

        if (!chain_ids || !Array.isArray(chain_ids) || chain_ids.length === 0) {
            return NextResponse.json(
                { message: 'Chain IDs array is required' },
                { status: 400 }
            );
        }

        if (universal_incentives === undefined) {
            return NextResponse.json(
                { message: 'Universal incentives setting is required' },
                { status: 400 }
            );
        }

        await connectDB();

        console.log(`📄 Updating ${chain_ids.length} chains to universal_incentives: ${universal_incentives}`);

        // Update all specified chains
        const updateResult = await Chain.updateMany(
            { _id: { $in: chain_ids.map(id => new ObjectId(id)) } },
            {
                $set: {
                    universal_incentives: universal_incentives,
                    updated_date: new Date(),
                    updated_by: adminCheck.userId
                }
            }
        );

        console.log(`✅ Updated ${updateResult.modifiedCount} chains`);

        let locationSyncResults = [];

        // Optionally sync all locations for these chains
        if (sync_locations) {
            console.log("🔄 Syncing locations for updated chains...");

            for (const chainId of chain_ids) {
                const syncResult = await Business.updateMany(
                    { chain_id: new ObjectId(chainId) },
                    {
                        $set: {
                            universal_incentives: universal_incentives,
                            updated_date: new Date()
                        }
                    }
                );

                locationSyncResults.push({
                    chain_id: chainId,
                    locations_updated: syncResult.modifiedCount
                });
            }

            const totalLocationsSynced = locationSyncResults.reduce(
                (sum, result) => sum + result.locations_updated, 0
            );

            console.log(`✅ Synced ${totalLocationsSynced} total locations`);
        }

        return NextResponse.json({
            success: true,
            message: 'Bulk update completed successfully',
            chains_updated: updateResult.modifiedCount,
            locations_synced: sync_locations,
            location_sync_results: locationSyncResults,
            total_locations_updated: locationSyncResults.reduce(
                (sum, result) => sum + result.locations_updated, 0
            )
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
 * NEW: Get chain system summary statistics
 */
export async function handleChainSummary(request) {
    console.log("📊 CHAINS: Getting system summary");

    try {
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
                    total_enabled_locations: {
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
                    business_types: { $addToSet: '$business_type' }
                }
            }
        ]);

        // Get additional statistics
        const totalBusinesses = await Business.countDocuments();
        const chainBusinesses = await Business.countDocuments({ chain_id: { $exists: true } });
        const independentBusinesses = totalBusinesses - chainBusinesses;

        const stats = summary[0] || {
            total_chains: 0,
            chains_with_universal_incentives: 0,
            total_locations: 0,
            total_enabled_locations: 0,
            total_chain_incentives: 0,
            business_types: []
        };

        const result = {
            success: true,
            summary: {
                chains: {
                    total: stats.total_chains,
                    with_universal_incentives: stats.chains_with_universal_incentives,
                    without_universal_incentives: stats.total_chains - stats.chains_with_universal_incentives
                },
                locations: {
                    total_chain_locations: stats.total_locations,
                    enabled_locations: stats.total_enabled_locations,
                    disabled_locations: stats.total_locations - stats.total_enabled_locations
                },
                businesses: {
                    total_all_businesses: totalBusinesses,
                    chain_locations: chainBusinesses,
                    independent_businesses: independentBusinesses
                },
                incentives: {
                    total_chain_incentives: stats.total_chain_incentives,
                    average_per_chain: stats.total_chains > 0 ?
                        Math.round((stats.total_chain_incentives / stats.total_chains) * 100) / 100 : 0
                },
                business_types: stats.business_types.sort()
            },
            generated_at: new Date()
        };

        console.log(`📊 Chain system summary generated:`);
        console.log(`   - Total chains: ${stats.total_chains}`);
        console.log(`   - Chain locations: ${stats.total_locations}`);
        console.log(`   - Enabled locations: ${stats.total_enabled_locations}`);
        console.log(`   - Independent businesses: ${independentBusinesses}`);

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Error generating chain summary:', error);
        return NextResponse.json(
            { message: 'Error generating summary: ' + error.message },
            { status: 500 }
        );
    }
}