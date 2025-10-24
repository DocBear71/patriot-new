// file: /src/app/api/business/route.js v2 - Fixed database connection and response structure
// Converted from Pages Router to App Router format

import connectDB from '../../../lib/mongodb.js';
import mongoose from 'mongoose';
import Business from '../../../models/Business.js';
import Chain from '../../../models/Chain.js';
import { geocodeAddress } from '../../../utils/geocoding.js';

/**
 * GET handler - Business search and retrieval
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        // Always ensure database connection first
        await connectDB();
        console.log("✅ Database connection established in business API");

        switch (operation) {
            case 'search':
                return await handleBusinessSearch(request);
            case 'get':
                return await handleGetBusiness(request);
            default:
                return Response.json(
                    {
                        success: true,
                        message: 'Business Core API is available',
                        operations: ['search', 'get']
                    },
                    { status: 200 }
                );
        }
    } catch (error) {
        console.error('Error in business core GET:', error);
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
 * POST handler - Business registration
 */
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        // Always ensure database connection first
        await connectDB();

        switch (operation) {
            case 'register':
                return await handleBusinessRegister(request);
            default:
                return Response.json(
                    {
                        success: false,
                        message: 'Invalid POST operation for business core'
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business core POST:', error);
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
 * PUT handler - Business updates (non-admin)
 */
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        // Always ensure database connection first
        await connectDB();

        switch (operation) {
            case 'update-business':
                return await handleUpdateBusinessNoAdmin(request);
            default:
                return Response.json(
                    {
                        success: false,
                        message: 'Invalid PUT operation for business core'
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business core PUT:', error);
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
            'Allow': 'GET, POST, PUT, OPTIONS'
        }
    });
}

// ========== BUSINESS SEARCH ==========

/**
 * Handle business search with chain support - FIXED response structure
 */
async function handleBusinessSearch(request) {
    console.log("🔍 Business search API hit");

    try {
        // Database should already be connected, but ensure it
        if (mongoose.connection.readyState !== 1) {
            console.log("🔄 Re-establishing database connection...");
            await connectDB();
        }

        console.log("✅ Database connection confirmed for search");

        const { searchParams } = new URL(request.url);
        const query = {};

        // Check if business_name or businessName is present
        const businessNameValue = searchParams.get('business_name') || searchParams.get('businessName') || '';
        const addressValue = searchParams.get('address') || '';

        console.log("🔍 Search parameters:", { businessNameValue, addressValue });

        // NEW: Check if searching by ID first
        const idValue = searchParams.get('_id') || searchParams.get('id');
        if (idValue && idValue.trim() !== '') {
            console.log('🔑 Searching by ID:', idValue);
            try {
                // Convert to ObjectId if it's a valid MongoDB ObjectId format
                if (mongoose.Types.ObjectId.isValid(idValue)) {
                    query._id = new mongoose.Types.ObjectId(idValue);
                } else {
                    query._id = idValue;
                }
            } catch (error) {
                console.error('Error converting ID:', error);
                query._id = idValue;
            }
        }

        // NEW: Check if searching by Google Place ID
        const googlePlaceId = searchParams.get('google_place_id');
        if (googlePlaceId && googlePlaceId.trim() !== '') {
            console.log('🔍 Searching by Google Place ID:', googlePlaceId);
            query.google_place_id = googlePlaceId.trim();
        }

        // Build MongoDB query
        if (businessNameValue && businessNameValue.trim() !== '') {
            // Use case-insensitive regex search with more flexible matching
            query.bname = new RegExp(businessNameValue.trim().replace(/\s+/g, '.*'), 'i');
        } else if (addressValue && addressValue.trim() !== '') {
            const addressRegex = { $regex: addressValue.trim(), $options: 'i' };
            query.$or = [
                { address1: addressRegex },
                { address2: addressRegex },
                { city: addressRegex },
                { state: addressRegex },
                { zip: addressRegex }
            ];
        }

        // Handle location-based search if coordinates provided
        const lat = parseFloat(searchParams.get('lat'));
        const lng = parseFloat(searchParams.get('lng'));
        const radius = parseInt(searchParams.get('radius')) || 25; // Default 25 miles

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            // Convert miles to meters for MongoDB geospatial query
            const radiusInMeters = radius * 1609.34;

            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat]  // GeoJSON uses [longitude, latitude]
                    },
                    $maxDistance: radiusInMeters
                }
            };

            console.log(`🌍 Location-based search at [${lat},${lng}] with radius ${radius} miles`);
        }

        console.log("📝 MongoDB Query:", JSON.stringify(query, null, 2));

        // Initial search for exact matches in your database
        let results = [];

        try {
            console.log("🔎 Executing database search...");
            results = await Business.find(query).lean().maxTimeMS(5000); // 5 second timeout
            console.log(`✅ Found ${results.length} matching businesses`);
        } catch (dbError) {
            console.error("❌ Database search error:", dbError);
            throw new Error(`Database search failed: ${dbError.message}`);
        }

        // Enhanced chain search if few results and searching by name
        if (businessNameValue && businessNameValue.trim() !== '' && results.length < 2) {
            try {
                console.log("🔗 Searching for chain businesses...");
                const chainNameSearch = new RegExp(businessNameValue.trim(), 'i');

                // Find chains from separate collection
                const chainBusinesses = await Chain.find({
                    status: 'active',
                    chain_name: chainNameSearch
                }).lean().maxTimeMS(3000);

                console.log(`Found ${chainBusinesses.length} chain businesses matching "${businessNameValue}"`);

                // If chain businesses found, look for related locations
                for (const chainBusiness of chainBusinesses) {
                    const chainLocations = await Business.find({
                        chain_id: chainBusiness._id
                    }).lean().maxTimeMS(3000);

                    console.log(`Found ${chainLocations.length} locations for chain ${chainBusiness.chain_name}`);

                    // Add chain locations to results if they're not already included
                    for (const location of chainLocations) {
                        const isDuplicate = results.some(business =>
                            business._id.toString() === location._id.toString()
                        );

                        if (!isDuplicate) {
                            // Add chain info to the location
                            location.chain_info = {
                                name: chainBusiness.chain_name,
                                id: chainBusiness._id
                            };
                            results.push(location);
                        }
                    }
                }
            } catch (chainError) {
                console.warn("⚠️ Chain search failed, continuing with regular results:", chainError);
                // Don't fail the entire search if chain search fails
            }
        }

        // CRITICAL: Set marker color flags based on search context
        results.forEach(business => {
            // Primary results (businesses that match the search query)
            if (businessNameValue && business.bname.toLowerCase().includes(businessNameValue.toLowerCase())) {
                business.markerColor = 'primary';
                business.isPrimaryResult = true;
                business.isFromDatabase = true;
            }
            // Chain businesses
            else if (business.chain_id) {
                business.markerColor = 'chain';
                business.isFromDatabase = true;
            }
            // Other database businesses
            else {
                business.markerColor = 'database';
                business.isNearbyDatabase = true;
                business.isFromDatabase = true;
            }
        });

        console.log('✅ Results with marker colors:', results.map(b => ({
            name: b.bname,
            color: b.markerColor
        })));

        console.log(`🎯 Returning ${results.length} total businesses`);

        // FIXED: Return structure that matches frontend expectations
        return Response.json({
            success: true,
            message: 'Search successful',
            results: results,
            count: results.length
        });

    } catch (error) {
        console.error('❌ Business search error:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error during search: ' + error.message,
                results: []
            },
            { status: 500 }
        );
    }
}

// ========== BUSINESS REGISTRATION ==========

/**
 * Handle business registration - FIXED response structure
 */
async function handleBusinessRegister(request) {
    console.log("📝 Business registration API hit");

    try {
        // Ensure database connection
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }

        console.log("✅ Database connection confirmed for registration");

        // Get business data from request
        const businessData = await request.json();
        console.log("📝 Business Data received:", businessData);

        // Add geospatial data if coordinates are provided
        if (businessData.lat && businessData.lng) {
            const lat = parseFloat(businessData.lat);
            const lng = parseFloat(businessData.lng);

            // Validate coordinates before creating location object
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                businessData.location = {
                    type: 'Point',
                    coordinates: [lng, lat]  // GeoJSON uses [longitude, latitude]
                };
                console.log("✅ Created location from provided coordinates:", businessData.location);
            }
        } else if (businessData.address1 && businessData.city && businessData.state) {
            // If coordinates weren't provided, geocode the address
            try {
                const address = `${businessData.address1}, ${businessData.city}, ${businessData.state} ${businessData.zip}`;
                console.log("🗺️ Attempting to geocode address:", address);

                const coordinates = await geocodeAddress(address);

                if (coordinates && coordinates.lat && coordinates.lng) {
                    const lat = parseFloat(coordinates.lat);
                    const lng = parseFloat(coordinates.lng);

                    // Validate geocoded coordinates
                    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                        businessData.location = {
                            type: 'Point',
                            coordinates: [lng, lat]
                        };
                        console.log("✅ Created location from geocoded coordinates:", businessData.location);
                    } else {
                        console.warn("⚠️ Invalid geocoded coordinates:", coordinates);
                    }
                } else {
                    console.warn("⚠️ Could not geocode address:", address);
                }
            } catch (geocodeError) {
                console.error("❌ Error geocoding address:", geocodeError);
            }
        }

        // Check if business already exists
        const existingBusiness = await Business.findOne({
            address1: businessData.address1,
            address2: businessData.address2,
            city: businessData.city,
            state: businessData.state,
            zip: businessData.zip,
        }).maxTimeMS(3000);

        if (existingBusiness) {
            return Response.json(
                {
                    success: false,
                    message: 'Business with this address already exists'
                },
                { status: 409 }
            );
        }

        // Add timestamps
        businessData.created_at = new Date();
        businessData.updated_at = new Date();

        // Insert business data
        console.log("💾 Inserting business data...");
        const newBusiness = new Business(businessData);
        const result = await newBusiness.save();
        console.log("✅ Business registered successfully:", result._id);

        // FIXED: Return structure that matches frontend expectations
        return Response.json({
            success: true,
            message: 'Business registered successfully',
            businessId: result._id,
            business: result
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Business registration error:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error during business registration: ' + error.message
            },
            { status: 500 }
        );
    }
}

// ========== GET BUSINESS ==========

/**
 * Handle getting a specific business - FIXED response structure
 */
async function handleGetBusiness(request) {
    try {
        // Ensure database connection
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return Response.json(
                {
                    success: false,
                    message: 'Business ID is required'
                },
                { status: 400 }
            );
        }

        // Find business by ID
        const business = await Business.findById(id).lean().maxTimeMS(3000);

        if (!business) {
            return Response.json(
                {
                    success: false,
                    message: 'Business not found'
                },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: 'Business retrieved successfully',
            result: business
        });

    } catch (error) {
        console.error('❌ Error getting business:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error getting business: ' + error.message
            },
            { status: 500 }
        );
    }
}

// ========== UPDATE BUSINESS (NON-ADMIN) ==========

/**
 * Handle business updates without requiring admin privileges - FIXED response structure
 */
async function handleUpdateBusinessNoAdmin(request) {
    try {
        // Ensure database connection
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }

        // Get business data from request
        const businessData = await request.json();
        const businessId = businessData.businessId;

        // Validate business ID
        if (!businessId) {
            return Response.json(
                {
                    success: false,
                    message: 'Business ID is required'
                },
                { status: 400 }
            );
        }

        // Remove businessId from update data
        delete businessData.businessId;

        // Check if business exists
        const existingBusiness = await Business.findById(businessId).maxTimeMS(3000);

        if (!existingBusiness) {
            return Response.json(
                {
                    success: false,
                    message: 'Business not found'
                },
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
                        console.log("✅ Geocoded coordinates:", coordinates);
                    } else {
                        console.warn("⚠️ Could not geocode address:", address);
                    }
                } catch (geocodeError) {
                    console.error("❌ Geocoding error:", geocodeError);
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
            }).maxTimeMS(3000);

            if (duplicateBusiness) {
                return Response.json(
                    {
                        success: false,
                        message: 'Another business with this name and address already exists'
                    },
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
        ).maxTimeMS(5000);

        // If this is a chain business and the name was updated, also update all locations
        if (existingBusiness.is_chain && businessData.bname && businessData.bname !== existingBusiness.bname) {
            // Update chain_name for all locations
            await Business.updateMany(
                { chain_id: businessId },
                { $set: { chain_name: businessData.bname } }
            ).maxTimeMS(5000);
        }

        return Response.json({
            success: true,
            message: existingBusiness.is_chain ? 'Chain updated successfully' : 'Business updated successfully',
            businessId: result._id,
            business: result
        });

    } catch (error) {
        console.error('❌ Error updating business:', error);
        return Response.json(
            {
                success: false,
                message: 'Server error updating business: ' + error.message
            },
            { status: 500 }
        );
    }
}