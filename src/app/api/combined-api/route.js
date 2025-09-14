// file: /src/app/api/combined-api/route.js v1 - Converted from Pages Router to App Router format
// Combined API endpoints for admin operations, incentives, and chain operations
// This file combines admin-codes.js, admin-incentives.js, and incentives.js

import connectDB from '../../../lib/mongodb.js';
import { getSession } from '../../../lib/auth-helpers.js';
import AdminCode from '../../../models/AdminCode.js';
import Business from '../../../models/Business.js';
import Incentive from '../../../models/Incentive.js';
import Chain from '../../../models/Chain.js';

/**
 * GET handler - Retrieve operations (incentives, admin codes, etc.)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        console.log(`Combined API GET hit: operation=${operation || 'none'}`);

        // Ensure database connection
        await connectDB();

        switch (operation?.toLowerCase()) {
            case 'admin-codes':
                return await handleAdminCodes(request, 'list');
            case 'admin-incentives':
            case 'admin-list-incentives':
                return await handleAdminIncentives(request, 'list');
            case 'list-businesses-for-dropdown':
                return await handleListBusinessesForDropdown();
            case 'incentives':
                return await handleGetUserIncentives(request);
            case 'get_chain_incentives':
            case 'chain_incentives':
                return await handleGetChainIncentives(request);
            default:
                return Response.json(
                    {
                        success: true,
                        message: 'Combined API is available',
                        operations: [
                            'admin-codes', 'admin-incentives', 'incentives',
                            'get_chain_incentives', 'chain_incentives'
                        ]
                    },
                    { status: 200 }
                );
        }
    } catch (error) {
        console.error('Error in combined API GET:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error: ' + error.message
            },
            { status: 500 }
        );
    }
}

/**
 * POST handler - Create operations (incentives, admin codes, etc.)
 */
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        console.log(`Combined API POST hit: operation=${operation || 'none'}`);

        // Ensure database connection
        await connectDB();

        switch (operation?.toLowerCase()) {
            case 'admin-codes':
                return await handleAdminCodes(request, 'create');
            case 'admin-incentives':
                return await handleAdminIncentives(request, 'create');
            case 'incentives':
            case 'add':
                return await handleAddIncentive(request);
            default:
                return Response.json(
                    {
                        success: false,
                        message: 'Invalid POST operation for combined API'
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in combined API POST:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error: ' + error.message
            },
            { status: 500 }
        );
    }
}

/**
 * PUT handler - Update operations
 */
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        console.log(`Combined API PUT hit: operation=${operation || 'none'}`);

        // Ensure database connection
        await connectDB();

        switch (operation?.toLowerCase()) {
            case 'admin-incentives':
            case 'update':
                return await handleUpdateIncentive(request);
            default:
                return Response.json(
                    {
                        success: false,
                        message: 'Invalid PUT operation for combined API'
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in combined API PUT:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error: ' + error.message
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE handler - Delete operations
 */
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        console.log(`Combined API DELETE hit: operation=${operation || 'none'}`);

        // Ensure database connection
        await connectDB();

        switch (operation?.toLowerCase()) {
            case 'admin-codes':
                return await handleAdminCodes(request, 'delete');
            case 'admin-incentives':
            case 'delete':
                return await handleDeleteIncentive(request);
            case 'incentives':
                return await handleDeleteUserIncentive(request);
            default:
                return Response.json(
                    {
                        success: false,
                        message: 'Invalid DELETE operation for combined API'
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in combined API DELETE:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error: ' + error.message
            },
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
            'Allow': 'GET, POST, PUT, DELETE, OPTIONS'
        }
    });
}

// ========== ADMIN ACCESS VERIFICATION ==========

/**
 * Helper to verify admin access using NextAuth session
 */
async function verifyAdminAccess() {
    try {
        // Import the auth helpers
        const { getSession } = await import('../../../lib/auth-helpers');
        const session = await getSession();

        if (!session || !session.user) {
            return { success: false, status: 401, message: 'Authentication required' };
        }

        if (!session.user.isAdmin && session.user.level !== 'Admin') {
            return { success: false, status: 403, message: 'Admin access required' };
        }

        console.log('Admin access verified for:', session.user.email);
        return { success: true, userId: session.user.id, user: session.user };

    } catch (error) {
        console.error("Admin verification error:", error);
        return { success: false, status: 401, message: 'Session verification failed' };
    }
}

// ========== ADMIN CODES HANDLERS ==========

/**
 * Handle admin codes operations
 */
async function handleAdminCodes(request, action) {
    try {
        // Verify admin access for all operations
        const adminCheck = await verifyAdminAccess();
        if (!adminCheck.success) {
            return Response.json(
                { success: false, message: adminCheck.message },
                { status: adminCheck.status }
            );
        }

        switch (action) {
            case 'list':
                return await handleListCodes(request);
            case 'create':
                return await handleCreateCode(request);
            case 'delete':
                return await handleDeleteCode(request);
            default:
                return Response.json(
                    { success: false, message: 'Invalid admin codes action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in admin codes handler:', error);
        return Response.json(
            { success: false, message: 'Error in admin codes: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle listing admin codes
 */
async function handleListCodes(request) {
    try {
        const codes = await AdminCode.find({})
            .sort({ created_at: -1 })
            .lean()
            .maxTimeMS(5000);

        return Response.json({
            success: true,
            codes: codes
        });
    } catch (error) {
        console.error("Error listing admin codes:", error);
        return Response.json(
            { success: false, message: 'Error listing admin codes: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle creating an admin code
 */
async function handleCreateCode(request) {
    try {
        const codeData = await request.json();

        // Validate required fields
        if (!codeData.code || !codeData.description) {
            return Response.json(
                { success: false, message: 'Code and description are required' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existingCode = await AdminCode.findOne({ code: codeData.code }).maxTimeMS(3000);
        if (existingCode) {
            return Response.json(
                { success: false, message: 'Admin code already exists' },
                { status: 409 }
            );
        }

        // Create new admin code
        const newCode = new AdminCode({
            code: codeData.code,
            description: codeData.description,
            usage_limit: codeData.usage_limit || null,
            current_usage: 0,
            is_active: codeData.is_active !== false,
            expires_at: codeData.expiration ? new Date(codeData.expiration) : null,
            created_at: new Date()
        });

        await newCode.save();

        return Response.json({
            success: true,
            message: 'Admin access code created successfully',
            code: newCode
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating admin code:", error);
        return Response.json(
            { success: false, message: 'Error creating admin code: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle deleting an admin code
 */
async function handleDeleteCode(request) {
    try {
        const { codeId } = await request.json();

        if (!codeId) {
            return Response.json(
                { success: false, message: 'Code ID is required' },
                { status: 400 }
            );
        }

        const result = await AdminCode.findByIdAndDelete(codeId).maxTimeMS(3000);

        if (!result) {
            return Response.json(
                { success: false, message: 'Admin code not found' },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: 'Admin access code deleted successfully',
            codeId
        });

    } catch (error) {
        console.error("Error deleting admin code:", error);
        return Response.json(
            { success: false, message: 'Error deleting admin code: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== ADMIN INCENTIVES HANDLERS ==========

/**
 * Handle admin incentives operations
 */
async function handleAdminIncentives(request, action) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        // Special case for incentive updates - allow without admin check
        if (request.method === 'PUT' && (operation === 'update' || action === 'update')) {
            return await handleUpdateIncentive(request);
        }

        // For all other operations, verify admin status
        const adminCheck = await verifyAdminAccess();
        if (!adminCheck.success) {
            return Response.json(
                { success: false, message: adminCheck.message },
                { status: adminCheck.status }
            );
        }

        switch (action) {
            case 'list':
                return await handleListIncentives(request);
            case 'create':
                return await handleCreateIncentive(request);
            case 'delete':
                return await handleDeleteIncentive(request);
            default:
                return Response.json(
                    { success: false, message: 'Invalid admin incentives action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in admin incentives:', error);
        return Response.json(
            { success: false, message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle listing all incentives (admin) with pagination and filtering
 */
async function handleListIncentives(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Get pagination parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        // Get filter parameters
        const search = searchParams.get('search') || '';
        const business = searchParams.get('business') || '';
        const type = searchParams.get('type') || '';
        const availability = searchParams.get('availability') || '';

        // Build query
        let query = {};

        // Filter by business if specified
        if (business) {
            query.business_id = business;
        }

        // Filter by type if specified
        if (type) {
            query.type = type;
        }

        // Filter by availability if specified
        if (availability) {
            query.is_available = availability === 'true';
        }

        console.log('Incentives query:', query);
        console.log('Pagination:', { page, limit, skip });

        // Get total count for pagination
        const total = await Incentive.countDocuments(query);

        // Get incentives with business info populated
        const incentives = await Incentive.find(query)
            .populate('business_id', 'bname address1 city state zip')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .maxTimeMS(10000);

        console.log(`Found ${incentives.length} incentives out of ${total} total`);

        // If search term is provided, filter after populate (for business name search)
        let filteredIncentives = incentives;
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredIncentives = incentives.filter(incentive => {
                const businessName = incentive.business_id?.bname?.toLowerCase() || '';
                const information = incentive.information?.toLowerCase() || '';
                return businessName.includes(searchTerm) || information.includes(searchTerm);
            });
        }

        return Response.json({
            success: true,
            incentives: filteredIncentives,
            total: search ? filteredIncentives.length : total,
            totalPages: Math.ceil((search ? filteredIncentives.length : total) / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Error listing incentives:', error);
        return Response.json(
            { success: false, message: 'Error listing incentives: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle getting businesses for dropdown
 */
async function handleListBusinessesForDropdown() {
    try {
        const businesses = await Business.find({ status: 'active' })
            .select('_id bname city state')
            .sort({ bname: 1 })
            .lean()
            .maxTimeMS(5000);

        return Response.json({
            success: true,
            businesses: businesses
        });
    } catch (error) {
        console.error('Error listing businesses for dropdown:', error);
        return Response.json(
            { success: false, message: 'Error listing businesses: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle creating a new incentive (admin)
 */
async function handleCreateIncentive(request) {
    try {
        const incentiveData = await request.json();

        // Validate required fields
        if (!incentiveData.business_id || !incentiveData.type || !incentiveData.amount) {
            return Response.json(
                { success: false, message: 'Business ID, type, and amount are required' },
                { status: 400 }
            );
        }

        // Create new incentive
        const newIncentive = new Incentive({
            business_id: incentiveData.business_id,
            type: incentiveData.type,
            amount: parseFloat(incentiveData.amount),
            discount_type: incentiveData.discount_type || 'percentage',
            information: incentiveData.information || '',
            other_description: incentiveData.other_description || '',
            is_available: incentiveData.is_available !== false,
            created_at: new Date()
        });

        await newIncentive.save();

        return Response.json({
            success: true,
            message: 'Incentive created successfully',
            incentive: newIncentive
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating incentive:', error);
        return Response.json(
            { success: false, message: 'Error creating incentive: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle deleting an incentive (admin)
 */
async function handleDeleteIncentive(request) {
    try {
        const { incentiveId } = await request.json();

        if (!incentiveId) {
            return Response.json(
                { success: false, message: 'Incentive ID is required' },
                { status: 400 }
            );
        }

        const result = await Incentive.findByIdAndDelete(incentiveId).maxTimeMS(3000);

        if (!result) {
            return Response.json(
                { success: false, message: 'Incentive not found' },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: 'Incentive deleted successfully',
            incentiveId
        });

    } catch (error) {
        console.error('Error deleting incentive:', error);
        return Response.json(
            { success: false, message: 'Error deleting incentive: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== REGULAR INCENTIVES HANDLERS ==========

/**
 * Handle getting user incentives (enhanced with chain support)
 */
async function handleGetUserIncentives(request) {
    console.log("🎁 ENHANCED INCENTIVES: Getting user incentives with chain inheritance");

    try {
        const { searchParams } = new URL(request.url);
        const businessId = searchParams.get('business_id');
        const chainId = searchParams.get('chain_id');

        console.log("Query parameters:", { businessId, chainId });

        if (!businessId && !chainId) {
            return Response.json(
                { success: false, message: 'Business ID or Chain ID is required as a query parameter' },
                { status: 400 }
            );
        }

        let incentives = [];
        let chainInfo = null;

        // Check if this is a Google Places result (not in our database)
        if (businessId && (businessId.startsWith('google_') || businessId.startsWith('place_'))) {
            console.log("🌍 GOOGLE PLACES: Handling Google Places result");
            // For Places API results, we need chain ID to get incentives
            if (chainId) {
                try {
                    const chainDetails = await Chain.findById(chainId).maxTimeMS(3000);

                    if (chainDetails && chainDetails.incentives) {
                        const chainIncentives = chainDetails.incentives
                            .filter(incentive => incentive.is_active)
                            .map(incentive => ({
                                _id: incentive._id,
                                is_available: incentive.is_active,
                                type: incentive.type,
                                amount: incentive.amount,
                                information: incentive.information,
                                other_description: incentive.other_description,
                                created_at: incentive.created_date,
                                discount_type: incentive.discount_type || 'percentage',
                                is_chain_wide: true
                            }));

                        incentives = [...incentives, ...chainIncentives];
                    }
                } catch (chainError) {
                    console.error("❌ Error getting chain details:", chainError);
                }
            }
        } else {
            // Regular business in our database
            try {
                const businessIncentives = await Incentive.find({
                    business_id: businessId,
                    is_available: true
                }).lean().maxTimeMS(3000);

                incentives = [...incentives, ...businessIncentives];
                console.log(`✅ Found ${businessIncentives.length} business incentives`);
            } catch (error) {
                console.error("❌ Error getting business incentives:", error);
            }
        }

        return Response.json({
            success: true,
            results: incentives,
            count: incentives.length
        });

    } catch (error) {
        console.error('❌ Error in handleGetUserIncentives:', error);
        return Response.json(
            { success: false, message: 'Error retrieving incentives: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle adding a new incentive
 */
async function handleAddIncentive(request) {
    console.log("📝 Incentive add API hit");

    try {
        const incentiveData = await request.json();
        console.log("Incentive Data received:", incentiveData);

        // Validate required fields
        if (!incentiveData.business_id || !incentiveData.type || !incentiveData.amount) {
            return Response.json(
                { success: false, message: 'Business ID, type, and amount are required' },
                { status: 400 }
            );
        }

        // Check if business exists
        const business = await Business.findById(incentiveData.business_id).maxTimeMS(3000);
        if (!business) {
            return Response.json(
                { success: false, message: 'Business not found' },
                { status: 404 }
            );
        }

        // Add timestamps
        incentiveData.created_at = new Date();
        incentiveData.updated_at = new Date();

        // Insert incentive data
        console.log("💾 Inserting incentive data...");
        const newIncentive = new Incentive(incentiveData);
        const result = await newIncentive.save();
        console.log("✅ Incentive added successfully:", result._id);

        return Response.json({
            success: true,
            message: 'Incentive added successfully',
            incentiveId: result._id,
            incentive: result
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Incentive submission error:', error);
        return Response.json(
            { success: false, message: 'Server error during incentive submission: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle updating an incentive
 */
async function handleUpdateIncentive(request) {
    try {
        const incentiveData = await request.json();
        const incentiveId = incentiveData.incentiveId || incentiveData._id;

        if (!incentiveId) {
            return Response.json(
                { success: false, message: 'Incentive ID is required' },
                { status: 400 }
            );
        }

        // Remove ID from update data
        delete incentiveData.incentiveId;
        delete incentiveData._id;

        // Update timestamp
        incentiveData.updated_at = new Date();

        const result = await Incentive.findByIdAndUpdate(
            incentiveId,
            { $set: incentiveData },
            { new: true }
        ).maxTimeMS(3000);

        if (!result) {
            return Response.json(
                { success: false, message: 'Incentive not found' },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: 'Incentive updated successfully',
            incentive: result
        });

    } catch (error) {
        console.error('❌ Error updating incentive:', error);
        return Response.json(
            { success: false, message: 'Error updating incentive: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle deleting a user incentive
 */
async function handleDeleteUserIncentive(request) {
    try {
        const { searchParams } = new URL(request.url);
        const incentiveId = searchParams.get('incentiveId') || searchParams.get('id');

        if (!incentiveId) {
            return Response.json(
                { success: false, message: 'Incentive ID is required' },
                { status: 400 }
            );
        }

        const result = await Incentive.findByIdAndDelete(incentiveId).maxTimeMS(3000);

        if (!result) {
            return Response.json(
                { success: false, message: 'Incentive not found' },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: 'Incentive deleted successfully',
            incentiveId
        });

    } catch (error) {
        console.error('❌ Error deleting user incentive:', error);
        return Response.json(
            { success: false, message: 'Error deleting incentive: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== CHAIN INCENTIVES HANDLERS ==========

/**
 * FIXED: Handle chain incentives operations with proper Chain model support
 */
async function handleGetChainIncentives(request) {
    console.log("🔗 FIXED: Chain incentives API hit");

    try {
        const { searchParams } = new URL(request.url);
        const chainId = searchParams.get('chain_id');

        console.log("Query parameters:", { chainId });

        if (!chainId) {
            return Response.json(
                {
                    success: false,
                    message: 'Chain ID is required',
                    error: 'Missing chain_id parameter'
                },
                { status: 400 }
            );
        }

        console.log(`🔍 FIXED: Fetching chain incentives for chain_id: ${chainId}`);

        // Use the Chain model to get embedded incentives
        const chain = await Chain.findById(chainId)
            .select('incentives chain_name universal_incentives')
            .lean()
            .maxTimeMS(3000);

        if (!chain) {
            console.log(`❌ Chain not found with ID: ${chainId}`);
            return Response.json(
                {
                    success: false,
                    message: 'Chain not found'
                },
                { status: 404 }
            );
        }

        console.log(`📊 FIXED: Chain found: ${chain.chain_name}`);
        console.log(`   - Universal Incentives: ${chain.universal_incentives}`);
        console.log(`   - Total Incentives: ${chain.incentives ? chain.incentives.length : 0}`);

        // Filter for active incentives only
        const activeIncentives = chain.incentives ?
            chain.incentives.filter(incentive => incentive.is_active !== false) : [];

        console.log(`✅ FIXED: Found ${activeIncentives.length} active incentives for chain: ${chain.chain_name}`);

        return Response.json({
            success: true,
            incentives: activeIncentives,
            chain_name: chain.chain_name,
            universal_incentives: chain.universal_incentives,
            chain_id: chainId
        });

    } catch (error) {
        console.error('❌ FIXED: Error in handleGetChainIncentives:', error);
        return Response.json(
            {
                success: false,
                message: 'Error retrieving chain incentives',
                error: error.message
            },
            { status: 500 }
        );
    }
}