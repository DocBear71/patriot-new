// file: /src/app/api/business-admin/route.js v1 - Admin business operations
// Handles admin-list-businesses, admin-get-business, admin-create-business, admin-update-business, admin-delete-business

import connectDB from '../../../lib/mongodb.js';
import mongoose from 'mongoose';
import { getSession } from '../../../lib/auth-helpers';
import Business from '../../../models/Business.js';
import User from '../../../models/User.js';
import Chain from '../../../models/Chain.js';
import { geocodeAddress } from '../../../utils/geocoding.js';

/**
 * GET handler - Admin business retrieval and listing
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'admin-list-businesses':
                return await handleAdminListBusinesses(request);
            case 'admin-get-business':
                return await handleAdminGetBusiness(request);
            default:
                return Response.json(
                    {
                        message: 'Business Admin API is available',
                        operations: ['admin-list-businesses', 'admin-get-business', 'admin-create-business', 'admin-update-business', 'admin-delete-business']
                    },
                    { status: 200 }
                );
        }
    } catch (error) {
        console.error('Error in business admin GET:', error);
        return Response.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * POST handler - Admin business creation
 */
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'admin-create-business':
                return await handleAdminCreateBusiness(request);
            default:
                return Response.json(
                    { message: 'Invalid POST operation for business admin' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business admin POST:', error);
        return Response.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT handler - Admin business updates
 */
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'admin-update-business':
                return await handleAdminUpdateBusiness(request);
            default:
                return Response.json(
                    { message: 'Invalid PUT operation for business admin' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business admin PUT:', error);
        return Response.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE handler - Admin business deletion
 */
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        // If no operation specified, default to admin-delete-business for DELETE requests
        const deleteOperation = operation || 'admin-delete-business';

        switch (deleteOperation) {
            case 'admin-delete-business':
                return await handleAdminDeleteBusiness(request);
            default:
                return Response.json(
                    { message: 'Invalid DELETE operation for business admin' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business admin DELETE:', error);
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
            'Allow': 'GET, POST, PUT, DELETE, OPTIONS'
        }
    });
}

// ========== ADMIN TOKEN VERIFICATION ==========

/**
 * Verify admin token
 */
async function verifyAdminToken(request) {
    try {
        // Get NextAuth session instead of JWT token
        const session = await getSession();

        if (!session || !session.user) {
            console.log("No session found");
            return { authorized: false, message: 'Authentication required' };
        }

        // Check admin rights
        if (!session.user.isAdmin && session.user.level !== 'Admin') {
            console.log("User is not an admin. Level:", session.user.level, "isAdmin:", session.user.isAdmin);
            return { authorized: false, message: 'Admin access required' };
        }

        console.log("User verified as admin:", session.user.level, session.user.isAdmin);
        return { authorized: true, user: session.user };

    } catch (error) {
        console.error('Session verification error:', error);
        return { authorized: false, message: 'Session verification failed' };
    }
}

// ========== ADMIN LIST BUSINESSES ==========

/**
 * FIXED: Handle admin listing of businesses with proper user population
 */
async function handleAdminListBusinesses(request) {
    console.log("🏢 ADMIN LIST BUSINESSES: With proper user population");

    // Verify admin token
    const auth = await verifyAdminToken(request);
    if (!auth.authorized) {
        return Response.json(
            { message: auth.message },
            { status: 401 }
        );
    }

    try {
        await connectDB();
        console.log("✅ Database connection established");

        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;
        const includeChains = searchParams.get('include_chains') === 'true';

        // Build query for regular businesses (exclude chain parents)
        const businessQuery = {
            $or: [
                { is_chain: { $exists: false } },
                { is_chain: false },
                { is_chain: null }
            ]
        };

        // Add search filters
        if (searchParams.get('search')) {
            const searchRegex = new RegExp(searchParams.get('search'), 'i');
            businessQuery.$and = [
                businessQuery.$or ? { $or: businessQuery.$or } : {},
                {
                    $or: [
                        { bname: searchRegex },
                        { address1: searchRegex },
                        { city: searchRegex },
                        { state: searchRegex },
                        { zip: searchRegex },
                        { phone: searchRegex }
                    ]
                }
            ];
            delete businessQuery.$or;
        }

        if (searchParams.get('category')) businessQuery.type = searchParams.get('category');
        if (searchParams.get('status')) businessQuery.status = searchParams.get('status');

        console.log("🔍 Business query:", JSON.stringify(businessQuery, null, 2));

        // Get businesses with population
        const businessTotal = await Business.countDocuments(businessQuery);
        const businessLimit = includeChains ? Math.floor(limit * 0.7) : limit;

        // FIXED: Use populate to get user information directly
        let businesses = await Business.find(businessQuery)
            .populate('created_by', 'fname lname email') // This populates the user info
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(businessLimit)
            .lean();

        console.log(`📊 Found ${businesses.length} businesses from query`);

        // If populate didn't work (created_by might not be a reference), do manual lookup
        if (businesses.length > 0 && !businesses[0].created_by?.fname) {
            console.log("📝 Populate didn't work, doing manual user lookup");

            // Get unique user IDs
            const userIds = [...new Set(businesses
                .map(business => business.created_by)
                .filter(id => id && mongoose.Types.ObjectId.isValid(id))
            )];

            console.log(`👥 Looking up ${userIds.length} unique user IDs:`, userIds);

            let users = [];
            if (userIds.length > 0) {
                try {
                    users = await User.find({
                        _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) }
                    }).select('_id fname lname email').lean();

                    console.log(`✅ Found ${users.length} users`);
                    console.log("👥 Users found:", users.map(u => ({ id: u._id, name: `${u.fname} ${u.lname}`, email: u.email })));
                } catch (userError) {
                    console.error("❌ Error fetching users:", userError);
                }
            }

            // Create user map
            const userMap = {};
            users.forEach(user => {
                userMap[user._id.toString()] = {
                    name: `${user.fname || ''} ${user.lname || ''}`.trim() || 'Unknown User',
                    email: user.email || 'No email'
                };
            });

            console.log("🗺️ User map created:", userMap);

            // Add user info to businesses
            businesses = businesses.map(business => {
                if (business.created_by) {
                    const userId = business.created_by.toString();
                    if (userMap[userId]) {
                        business.createdByUser = userMap[userId];
                        console.log(`✅ Added user info for business ${business.bname}: ${userMap[userId].name}`);
                    } else {
                        console.log(`❌ No user found for business ${business.bname} with user ID: ${userId}`);
                        business.createdByUser = {
                            name: 'Unknown User',
                            email: 'No email'
                        };
                    }
                }
                return business;
            });
        } else if (businesses.length > 0) {
            // Populate worked, just format the user data
            businesses = businesses.map(business => {
                if (business.created_by && business.created_by.fname) {
                    business.createdByUser = {
                        name: `${business.created_by.fname} ${business.created_by.lname || ''}`.trim(),
                        email: business.created_by.email || 'No email'
                    };
                    // Replace the populated object with just the ID for consistency
                    business.created_by = business.created_by._id;
                }
                return business;
            });
        }

        let chains = [];
        let chainTotal = 0;

        // Handle chains if requested
        if (includeChains) {
            console.log("🔗 CHAINS: Using dedicated Chain model");

            try {
                const chainQuery = { status: 'active' };
                if (searchParams.get('search')) {
                    chainQuery.chain_name = new RegExp(searchParams.get('search'), 'i');
                }

                // Get chains - assuming you have a Chain model with getWithLocationCounts method
                let chainsResult = [];
                if (Chain && typeof Chain.getWithLocationCounts === 'function') {
                    chainsResult = await Chain.getWithLocationCounts(chainQuery);
                } else {
                    // Fallback if the method doesn't exist
                    chainsResult = await Chain.find(chainQuery).lean();
                    // Add location counts manually
                    for (let chain of chainsResult) {
                        chain.location_count = await Business.countDocuments({ chain_id: chain._id });
                    }
                }

                chainTotal = chainsResult.length;

                // Convert chains to business-like format and add user info
                const chainUserIds = [...new Set(chainsResult
                    .map(chain => chain.created_by)
                    .filter(id => id && mongoose.Types.ObjectId.isValid(id))
                )];

                let chainUsers = [];
                if (chainUserIds.length > 0) {
                    chainUsers = await User.find({
                        _id: { $in: chainUserIds.map(id => new mongoose.Types.ObjectId(id)) }
                    }).select('_id fname lname email').lean();
                }

                const chainUserMap = {};
                chainUsers.forEach(user => {
                    chainUserMap[user._id.toString()] = {
                        name: `${user.fname || ''} ${user.lname || ''}`.trim() || 'Unknown User',
                        email: user.email || 'No email'
                    };
                });

                chains = chainsResult.slice(0, limit - businesses.length).map(chain => {
                    const chainBusiness = {
                        _id: chain._id,
                        bname: chain.chain_name,
                        address1: 'Chain Headquarters',
                        city: chain.corporate_info?.headquarters || 'N/A',
                        type: chain.business_type,
                        status: chain.status,
                        created_at: chain.created_date,
                        created_by: chain.created_by,
                        is_chain: true,
                        chain_name: chain.chain_name,
                        location_count: chain.location_count
                    };

                    // Add user info for chains too
                    if (chain.created_by && chainUserMap[chain.created_by.toString()]) {
                        chainBusiness.createdByUser = chainUserMap[chain.created_by.toString()];
                    }

                    return chainBusiness;
                });

                console.log(`✅ Retrieved ${chains.length} chains with user info`);
            } catch (chainError) {
                console.error("❌ Error fetching chains:", chainError);
                chains = [];
                chainTotal = 0;
            }
        }

        // Combine results
        const allBusinesses = [...businesses, ...chains];
        const total = businessTotal + chainTotal;
        const totalPages = Math.ceil(total / limit);

        console.log(`✅ SUCCESS: Returning ${allBusinesses.length} items with user information`);
        console.log("📋 Sample business with user info:", allBusinesses[0] ? {
            name: allBusinesses[0].bname,
            createdBy: allBusinesses[0].created_by,
            createdByUser: allBusinesses[0].createdByUser
        } : 'No businesses found');

        return Response.json({
            businesses: allBusinesses,
            total,
            page,
            limit,
            totalPages,
            breakdown: {
                businesses: businessTotal,
                chains: chainTotal
            }
        });

    } catch (error) {
        console.error('❌ Error listing businesses:', error);
        return Response.json(
            { message: 'Server error during business listing: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== ADMIN GET BUSINESS ==========

/**
 * Handle admin get business details
 */
async function handleAdminGetBusiness(request) {
    // Verify admin token
    const auth = await verifyAdminToken(request);
    if (!auth.authorized) {
        return Response.json(
            { message: auth.message },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
        return Response.json(
            { message: 'Business ID is required' },
            { status: 400 }
        );
    }

    try {
        await connectDB();

        // Find business by ID
        const business = await Business.findById(businessId).lean();

        if (!business) {
            return Response.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        return Response.json({
            business
        });

    } catch (error) {
        console.error('Error getting business details:', error);
        return Response.json(
            { message: 'Server error getting business details: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== ADMIN CREATE BUSINESS ==========

/**
 * Handle admin create business
 */
async function handleAdminCreateBusiness(request) {
    // Verify admin token
    const auth = await verifyAdminToken(request);
    if (!auth.authorized) {
        return Response.json(
            { message: auth.message },
            { status: 401 }
        );
    }

    try {
        // Get business data from request
        const businessData = await request.json();

        // Validate required fields
        let requiredFields = ['bname', 'type'];

        // If it's not a chain, also require address fields
        if (!businessData.is_chain) {
            requiredFields = [...requiredFields, 'address1', 'city', 'state', 'zip', 'phone'];
        }

        const missingFields = requiredFields.filter(field => !businessData[field]);

        if (missingFields.length > 0) {
            return Response.json(
                { message: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        await connectDB();

        // Handle chain-specific setup
        if (businessData.is_chain) {
            // Initialize locations array if not provided
            if (!businessData.locations) {
                businessData.locations = [];
            }

            // Set default value for universal_incentives if not provided
            if (businessData.universal_incentives === undefined) {
                businessData.universal_incentives = true; // Default to true for chains
            }
        }
        // Handle regular business setup (not a chain)
        else {
            // Add geospatial data if coordinates are provided
            if (businessData.lat && businessData.lng) {
                businessData.location = {
                    type: 'Point',
                    coordinates: [
                        parseFloat(businessData.lng),
                        parseFloat(businessData.lat)
                    ]
                };
            } else if (businessData.address1 && businessData.city && businessData.state) {
                // If coordinates weren't provided, geocode the address
                try {
                    const address = `${businessData.address1}, ${businessData.city}, ${businessData.state} ${businessData.zip}`;
                    const coordinates = await geocodeAddress(address);

                    if (coordinates) {
                        businessData.location = {
                            type: 'Point',
                            coordinates: [coordinates.lng, coordinates.lat]
                        };
                        console.log("Geocoded coordinates:", coordinates);
                    } else {
                        console.warn("Could not geocode address:", address);
                    }
                } catch (geocodeError) {
                    console.error("Error geocoding address:", geocodeError);
                }
            }

            // Check if regular business already exists
            const existingBusiness = await Business.findOne({
                bname: businessData.bname,
                address1: businessData.address1,
                city: businessData.city,
                state: businessData.state,
                zip: businessData.zip
            });

            if (existingBusiness) {
                return Response.json(
                    { message: 'Business with this name and address already exists' },
                    { status: 409 }
                );
            }
        }

        // Add timestamps and default status if not provided
        businessData.created_at = new Date();
        businessData.updated_at = new Date();

        if (!businessData.status) {
            businessData.status = 'active';
        }

        // Insert business data
        const newBusiness = new Business(businessData);
        const result = await newBusiness.save();

        return Response.json({
            message: businessData.is_chain ? 'Chain created successfully' : 'Business created successfully',
            businessId: result._id
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating business:', error);
        return Response.json(
            { message: 'Server error creating business: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== ADMIN UPDATE BUSINESS ==========

/**
 * Handle admin update business
 */
async function handleAdminUpdateBusiness(request) {
    // Verify admin token
    const auth = await verifyAdminToken(request);
    if (!auth.authorized) {
        return Response.json(
            { message: auth.message },
            { status: 401 }
        );
    }

    try {
        // Get business data from request
        const businessData = await request.json();
        const businessId = businessData.businessId;

        // Validate business ID
        if (!businessId) {
            return Response.json(
                { message: 'Business ID is required' },
                { status: 400 }
            );
        }

        // Remove businessId from update data
        delete businessData.businessId;

        await connectDB();

        // Check if business exists
        const existingBusiness = await Business.findById(businessId);

        if (!existingBusiness) {
            return Response.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        // Handle chain-specific updates
        if (existingBusiness.is_chain || businessData.is_chain) {
            // Ensure locations array exists
            if (!businessData.locations && existingBusiness.locations) {
                businessData.locations = existingBusiness.locations;
            } else if (!businessData.locations) {
                businessData.locations = [];
            }
        }
        // Handle regular business updates (not a chain)
        else {
            // Add geospatial data if coordinates are provided
            if (businessData.lat && businessData.lng) {
                businessData.location = {
                    type: 'Point',
                    coordinates: [
                        parseFloat(businessData.lng),
                        parseFloat(businessData.lat)
                    ]
                };
            } else if (businessData.address1 && businessData.city && businessData.state) {
                // If coordinates weren't provided, geocode the address
                try {
                    const address = `${businessData.address1}, ${businessData.city}, ${businessData.state} ${businessData.zip}`;
                    const coordinates = await geocodeAddress(address);

                    if (coordinates) {
                        businessData.location = {
                            type: 'Point',
                            coordinates: [coordinates.lng, coordinates.lat]
                        };
                        console.log("Geocoded coordinates:", coordinates);
                    } else {
                        console.warn("Could not geocode address:", address);
                    }
                } catch (geocodeError) {
                    console.error("Error geocoding address:", geocodeError);
                }
            }

            // Check if another business has the same name and address
            const duplicateBusiness = await Business.findOne({
                _id: { $ne: businessId },
                bname: businessData.bname,
                address1: businessData.address1,
                city: businessData.city,
                state: businessData.state,
                zip: businessData.zip
            });

            if (duplicateBusiness) {
                return Response.json(
                    { message: 'Another business with this name and address already exists' },
                    { status: 409 }
                );
            }
        }

        // Update timestamp
        businessData.updated_at = new Date();

        // Update business
        const result = await Business.findByIdAndUpdate(
            businessId,
            { $set: businessData },
            { new: true }
        );

        // If this is a chain business and the name was updated, also update all locations
        if (existingBusiness.is_chain && businessData.bname && businessData.bname !== existingBusiness.bname) {
            // Update chain_name for all locations
            await Business.updateMany(
                { chain_id: businessId },
                { $set: { chain_name: businessData.bname } }
            );
        }

        return Response.json({
            message: existingBusiness.is_chain ? 'Chain updated successfully' : 'Business updated successfully',
            businessId: result._id
        });

    } catch (error) {
        console.error('Error updating business:', error);
        return Response.json(
            { message: 'Server error updating business: ' + error.message },
            { status: 500 }
        );
    }
}

// ========== ADMIN DELETE BUSINESS ==========

/**
 * Handle admin delete business
 */
async function handleAdminDeleteBusiness(request) {
    // Verify admin token
    const auth = await verifyAdminToken(request);
    if (!auth.authorized) {
        return Response.json(
            { message: auth.message },
            { status: 401 }
        );
    }

    try {
        // Get business ID from either request body or query parameters
        let businessId;
        const { searchParams } = new URL(request.url);

        // Try query parameter first (more RESTful for DELETE)
        businessId = searchParams.get('businessId') || searchParams.get('id');

        // If not in query params, try request body
        if (!businessId) {
            try {
                const body = await request.json();
                businessId = body.businessId || body.id;
            } catch (jsonError) {
                // Request might not have a JSON body
                console.log('No JSON body in DELETE request');
            }
        }

        if (!businessId) {
            return Response.json(
                { message: 'Business ID is required (provide as ?businessId=... or ?id=... or in request body)' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if business exists
        const existingBusiness = await Business.findById(businessId);

        if (!existingBusiness) {
            return Response.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        // If this is a chain, handle chain deletion
        if (existingBusiness.is_chain) {
            // Remove chain association from all locations
            await Business.updateMany(
                { chain_id: businessId },
                {
                    $unset: {
                        chain_id: 1,
                        chain_name: 1
                    }
                }
            );
        }
        // If this is a location in a chain, remove it from the chain's locations array
        else if (existingBusiness.chain_id) {
            await Business.findByIdAndUpdate(
                existingBusiness.chain_id,
                { $pull: { locations: businessId } }
            );
        }

        // Delete business
        const result = await Business.findByIdAndDelete(businessId);

        return Response.json({
            message: existingBusiness.is_chain ? 'Chain deleted successfully' : 'Business deleted successfully',
            businessId: businessId
        });

    } catch (error) {
        console.error('Error deleting business:', error);
        return Response.json(
            { message: 'Server error deleting business: ' + error.message },
            { status: 500 }
        );
    }
}