// file: /src/app/api/business-chains/route.js v1 - Chain business operations
// Handles get_chains, get_chain_locations, add_to_chain, remove_from_chain, delete_chain

import connectDB from '../../../lib/mongodb.js';
import mongoose from 'mongoose';
import Business from '../../../models/Business.js';
import Chain from '../../../models/Chain.js';

/**
 * GET handler - Chain retrieval operations
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'get_chains':
                return await handleGetChains(request);
            case 'get_chain_locations':
                return await handleGetChainLocations(request);
            default:
                return Response.json(
                    {
                        message: 'Business Chains API is available',
                        operations: ['get_chains', 'get_chain_locations', 'add_to_chain', 'remove_from_chain', 'delete_chain']
                    },
                    { status: 200 }
                );
        }
    } catch (error) {
        console.error('Error in business chains GET:', error);
        return Response.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * POST handler - Chain management operations
 */
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'add_to_chain':
                return await handleAddToChain(request);
            case 'remove_from_chain':
                return await handleRemoveFromChain(request);
            case 'delete_chain':
                return await handleDeleteChain(request);
            default:
                return Response.json(
                    { message: 'Invalid POST operation for business chains' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business chains POST:', error);
        return Response.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * OPTIONS handler - CORS support
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Allow': 'GET, POST, OPTIONS'
        }
    });
}

// ========== GET CHAINS ==========

/**
 * FIXED: Handle getting chains from separate collection
 */
async function handleGetChains(request) {
    console.log("🔗 GET CHAINS: From separated collection");

    try {
        await connectDB();

        // Find all chains from separate collection
        const chains = await Chain.find({ status: 'active' })
            .sort({ chain_name: 1 })
            .lean();

        console.log(`📊 Found ${chains.length} chains in separate collection`);

        // For each chain, count the number of locations
        for (let i = 0; i < chains.length; i++) {
            const locationCount = await Business.countDocuments({
                chain_id: chains[i]._id
            });
            chains[i].location_count = locationCount;
            console.log(`   - ${chains[i].chain_name}: ${locationCount} locations`);
        }

        return Response.json({
            message: 'Chains retrieved successfully',
            results: chains
        });

    } catch (error) {
        console.error('❌ Error retrieving chains:', error);
        return Response.json(
            { message: 'Error retrieving chains', error: error.message },
            { status: 500 }
        );
    }
}

// ========== GET CHAIN LOCATIONS ==========

/**
 * Handle get chain locations
 */
async function handleGetChainLocations(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const chain_id = searchParams.get('chain_id');

        if (!chain_id) {
            return Response.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        // Find all businesses that belong to this chain
        const locations = await Business.find({ chain_id: chain_id }).lean();

        return Response.json({
            message: 'Chain locations retrieved successfully',
            results: locations
        });

    } catch (error) {
        console.error('Error retrieving chain locations:', error);
        return Response.json(
            { message: 'Error retrieving chain locations', error: error.message },
            { status: 500 }
        );
    }
}

// ========== ADD TO CHAIN ==========

/**
 * Handle adding a business to a chain
 */
async function handleAddToChain(request) {
    try {
        await connectDB();

        const { business_id, chain_id } = await request.json();

        if (!business_id || !chain_id) {
            return Response.json(
                { message: 'Business ID and Chain ID are required' },
                { status: 400 }
            );
        }

        // Get the chain to retrieve its name
        const chain = await Business.findById(chain_id);
        if (!chain || !chain.is_chain) {
            return Response.json(
                { message: 'Chain not found' },
                { status: 404 }
            );
        }

        // Update the business to link it to the chain
        const updatedBusiness = await Business.findByIdAndUpdate(
            business_id,
            {
                chain_id: chain_id,
                chain_name: chain.bname
            },
            { new: true }
        );

        // Add the business to the chain's locations array if it exists
        if (chain.locations) {
            // Check if the business is already in the locations array
            if (!chain.locations.includes(business_id)) {
                chain.locations.push(business_id);
                await chain.save();
            }
        } else {
            // Initialize the locations array if it doesn't exist
            chain.locations = [business_id];
            await chain.save();
        }

        return Response.json({
            message: 'Business added to chain successfully',
            result: updatedBusiness
        });

    } catch (error) {
        console.error('Error adding business to chain:', error);
        return Response.json(
            { message: 'Error adding business to chain', error: error.message },
            { status: 500 }
        );
    }
}

// ========== REMOVE FROM CHAIN ==========

/**
 * Handle removing a business from a chain
 */
async function handleRemoveFromChain(request) {
    try {
        await connectDB();

        const { business_id } = await request.json();

        if (!business_id) {
            return Response.json(
                { message: 'Business ID is required' },
                { status: 400 }
            );
        }

        // Get the business to find its chain
        const business = await Business.findById(business_id);
        if (!business) {
            return Response.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        const chainId = business.chain_id;

        // Update the business to remove the chain association
        const updatedBusiness = await Business.findByIdAndUpdate(
            business_id,
            {
                $unset: {
                    chain_id: 1,
                    chain_name: 1
                }
            },
            { new: true }
        );

        // Remove the business from the chain's locations array if needed
        if (chainId) {
            await Business.findByIdAndUpdate(
                chainId,
                {
                    $pull: { locations: business_id }
                }
            );
        }

        return Response.json({
            message: 'Business removed from chain successfully',
            result: updatedBusiness
        });

    } catch (error) {
        console.error('Error removing business from chain:', error);
        return Response.json(
            { message: 'Error removing business from chain', error: error.message },
            { status: 500 }
        );
    }
}

// ========== DELETE CHAIN ==========

/**
 * Handle deleting a chain
 */
async function handleDeleteChain(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return Response.json(
                { message: 'Chain ID is required' },
                { status: 400 }
            );
        }

        // Find all businesses that belong to this chain
        const locations = await Business.find({ chain_id: id });

        // Update all locations to remove the chain association
        for (const location of locations) {
            await Business.findByIdAndUpdate(
                location._id,
                {
                    $unset: {
                        chain_id: 1,
                        chain_name: 1
                    }
                }
            );
        }

        // Delete the chain
        await Business.findByIdAndDelete(id);

        return Response.json({
            message: 'Chain deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting chain:', error);
        return Response.json(
            { message: 'Error deleting chain', error: error.message },
            { status: 500 }
        );
    }
}