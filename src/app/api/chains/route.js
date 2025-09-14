// file: /src/app/api/chains/route.js v1 - Main chains API router for Next.js App Router

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';

// Import operation handlers
import {
    handleListChains,
    handleGetChain,
    handleCreateChain,
    handleUpdateChain,
    handleDeleteChain
} from './operations/basic/route';

import {
    handleAddChainIncentive,
    handleRemoveChainIncentive,
    handleUpdateChainIncentive,
    handleGetChainIncentives
} from './operations/incentives/route';

import {
    handleAddLocationToChain,
    handleRemoveLocationFromChain,
    handleGetChainLocations,
    handleSyncChainLocations
} from './operations/locations/route';

import {
    handleSearchChains,
    handleFindChainMatch,
    handleBulkUpdateUniversalIncentives,
    handleChainSummary
} from './operations/utils/route';

/**
 * Handle all HTTP methods for chains API
 */
export async function GET(request) {
    return await handleChainRequest(request, 'GET');
}

export async function POST(request) {
    return await handleChainRequest(request, 'POST');
}

export async function PUT(request) {
    return await handleChainRequest(request, 'PUT');
}

export async function DELETE(request) {
    return await handleChainRequest(request, 'DELETE');
}

export async function OPTIONS(request) {
    return NextResponse.json(
        { message: 'CORS preflight successful' },
        {
            status: 200,
            headers: {
                'Allow': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        }
    );
}

/**
 * Main request handler for all chains operations
 */
async function handleChainRequest(request, method) {
    console.log(`🔗 CHAINS API: Processing ${method} request`);

    try {
        // Connect to database
        await connectDB();

        // Get URL parameters
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        console.log(`🔗 CHAINS API: ${operation || 'none'} (${method})`);

        // Route to appropriate handler based on operation
        switch (operation) {
            // Basic CRUD operations
            case 'list':
                return await handleListChains(request);
            case 'get':
                return await handleGetChain(request);
            case 'create':
                return await handleCreateChain(request);
            case 'update':
                return await handleUpdateChain(request);
            case 'delete':
                return await handleDeleteChain(request);

            // Incentive management operations
            case 'add_incentive':
                return await handleAddChainIncentive(request);
            case 'remove_incentive':
                return await handleRemoveChainIncentive(request);
            case 'update_incentive':
                return await handleUpdateChainIncentive(request);
            case 'get_incentives':
                return await handleGetChainIncentives(request);

            // Location management operations
            case 'add_location':
                return await handleAddLocationToChain(request);
            case 'remove_location':
                return await handleRemoveLocationFromChain(request);
            case 'get_locations':
                return await handleGetChainLocations(request);
            case 'sync_locations':
                return await handleSyncChainLocations(request);

            // Utility operations
            case 'search':
                return await handleSearchChains(request);
            case 'find_match':
                return await handleFindChainMatch(request);
            case 'bulk_update_universal_incentives':
                return await handleBulkUpdateUniversalIncentives(request);
            case 'summary':
                return await handleChainSummary(request);

            // Default response - list available operations
            default:
                if (method === 'GET') {
                    return NextResponse.json({
                        message: 'Chains API is available',
                        operations: [
                            'list', 'get', 'create', 'update', 'delete',
                            'add_incentive', 'remove_incentive', 'update_incentive', 'get_incentives',
                            'search', 'add_location', 'remove_location', 'get_locations',
                            'sync_locations', 'bulk_update_universal_incentives', 'summary'
                        ]
                    });
                }
                return NextResponse.json(
                    { message: 'Invalid operation' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error(`❌ Error in chains API (${operation || 'unknown'}):`, error);
        return NextResponse.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}