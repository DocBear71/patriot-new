// file: /src/app/api/business-places/route.js v1 - Places API and chain matching operations
// Handles check_place_exists, find_matching_chain

import connectDB from '../../../lib/mongodb.js';
import mongoose from 'mongoose';
import Business from '../../../models/Business.js';
import Chain from '../../../models/Chain.js';

/**
 * GET handler - Places API operations
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'check_place_exists':
                return await handleCheckPlaceExists(request);
            case 'find_matching_chain':
                return await handleFindMatchingChain(request);
            default:
                return Response.json(
                    {
                        message: 'Business Places API is available',
                        operations: ['check_place_exists', 'find_matching_chain']
                    },
                    { status: 200 }
                );
        }
    } catch (error) {
        console.error('Error in business places GET:', error);
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
            'Allow': 'GET, OPTIONS'
        }
    });
}

// ========== CHECK PLACE EXISTS ==========

/**
 * Check if a Google Place exists in our database
 */
async function handleCheckPlaceExists(request) {
    try {
        const { searchParams } = new URL(request.url);
        const place_id = searchParams.get('place_id');

        if (!place_id) {
            return Response.json(
                { success: false, message: 'Place ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if a business with this place ID exists
        const business = await Business.findOne({ placeId: place_id }).lean();

        return Response.json({
            success: true,
            exists: !!business
        });

    } catch (error) {
        console.error('Error checking if place exists:', error);
        return Response.json(
            { success: false, message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== FIND MATCHING CHAIN ==========

/**
 * Find matching chains for a place name
 */
async function handleFindMatchingChain(request) {
    try {
        const { searchParams } = new URL(request.url);
        const place_name = searchParams.get('place_name');

        if (!place_name) {
            return Response.json(
                { success: false, message: 'Place name is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Search for chains with similar names
        const chains = await Business.find({
            is_chain: true,
            $or: [
                // Exact match
                { bname: new RegExp(`^${place_name}$`, 'i') },
                // Partial match
                { bname: new RegExp(`${place_name}`, 'i') },
                // Chain name contains place name
                { bname: new RegExp(`.*${place_name}.*`, 'i') }
            ]
        }).lean();

        // If there are multiple matches, find the best one
        if (chains.length > 0) {
            // Sort by name similarity (closest match first)
            chains.sort((a, b) => {
                const aSimilarity = calculateNameSimilarity(a.bname.toLowerCase(), place_name.toLowerCase());
                const bSimilarity = calculateNameSimilarity(b.bname.toLowerCase(), place_name.toLowerCase());
                return bSimilarity - aSimilarity; // Higher similarity first
            });

            // Return the best match
            return Response.json({
                success: true,
                chain: chains[0]
            });
        }

        // No matches found
        return Response.json(
            { success: false, message: 'No matching chain found' },
            { status: 404 }
        );

    } catch (error) {
        console.error('Error finding matching chain:', error);
        return Response.json(
            { success: false, message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Calculate name similarity between chain and place names
 */
function calculateNameSimilarity(chainName, placeName) {
    // Clean and normalize names for better matching
    chainName = chainName.toLowerCase()
        .replace(/^the\s+/, '') // Remove leading "The "
        .replace(/\s+inc\.?$/, '') // Remove trailing Inc/Inc.
        .replace(/\s+corp\.?$/, '') // Remove trailing Corp/Corp.
        .replace(/\s+corporation$/, '') // Remove trailing Corporation
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .trim();

    placeName = placeName.toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/\s+inc\.?$/, '')
        .replace(/\s+corp\.?$/, '')
        .replace(/\s+corporation$/, '')
        .replace(/[^\w\s]/g, '')
        .trim();

    // Check for exact match after normalization
    if (chainName === placeName) return 1.0;

    // Check if one contains the other
    if (chainName.includes(placeName) || placeName.includes(chainName)) return 0.9;

    // Calculate word similarity
    const chainWords = chainName.split(/\s+/);
    const placeWords = placeName.split(/\s+/);

    let matchingWords = 0;
    for (const word of chainWords) {
        if (word.length > 2 && placeWords.includes(word)) {
            matchingWords++;
        }
    }

    // Consider it a match if at least 50% of words match
    return matchingWords / Math.max(chainWords.length, placeWords.length);
}