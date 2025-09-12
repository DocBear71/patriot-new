// file: /src/app/api/business-management/route.js v2 - Fixed Next.js route exports
// Handles create, update, and enhanced business operations with chain inheritance

import connectDB from '../../../lib/mongodb.js';
import Business from '../../../models/Business.js';
import Chain from '../../../models/Chain.js';
import { geocodeAddress } from '../../../utils/geocoding.js';

/**
 * POST handler - Business creation and management
 */
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');

        switch (operation) {
            case 'create':
                return await handleCreateBusiness(request);
            case 'update':
                return await handleUpdateBusiness(request);
            case 'add':
                return await handleAddBusiness(request);
            default:
                return Response.json(
                    { message: 'Invalid POST operation for business management' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in business management POST:', error);
        return Response.json(
            { message: 'Server error: ' + error.message },
            { status: 500 }
        );
    }
}

/**
 * GET handler - Business management info
 */
export async function GET(request) {
    return Response.json(
        {
            message: 'Business Management API is available',
            operations: ['create', 'update', 'add']
        },
        { status: 200 }
    );
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

// ========== CREATE BUSINESS ==========

/**
 * Handle creating a business (regular or chain)
 */
async function handleCreateBusiness(request) {
    try {
        await connectDB();

        // Get business data from request
        const businessData = await request.json();

        // Validate required fields
        const requiredFields = ['bname', 'type'];

        // If not a chain, also require address fields
        if (!businessData.is_chain) {
            requiredFields.push('address1', 'city', 'state', 'zip');
        }

        const missingFields = requiredFields.filter(field => !businessData[field]);

        if (missingFields.length > 0) {
            return Response.json(
                { message: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Add geospatial data if coordinates are provided and it's not a chain
        if (!businessData.is_chain && businessData.lat && businessData.lng) {
            businessData.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(businessData.lng),
                    parseFloat(businessData.lat)
                ]
            };
        } else if (!businessData.is_chain && businessData.address1 && businessData.city && businessData.state) {
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

        // If it's a chain, initialize the locations array
        if (businessData.is_chain && !businessData.locations) {
            businessData.locations = [];
        }

        // Add timestamps
        businessData.created_at = new Date();
        businessData.updated_at = new Date();

        // Insert business data
        const newBusiness = new Business(businessData);
        const result = await newBusiness.save();

        return Response.json({
            message: businessData.is_chain ? 'Chain created successfully' : 'Business created successfully',
            result: result
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating business:', error);
        return Response.json(
            { message: 'Error creating business', error: error.message },
            { status: 500 }
        );
    }
}

// ========== UPDATE BUSINESS ==========

/**
 * Handle updating a business (regular or chain)
 */
async function handleUpdateBusiness(request) {
    try {
        await connectDB();

        // Get business data from request
        const businessData = await request.json();

        if (!businessData._id) {
            return Response.json(
                { message: 'Business ID is required' },
                { status: 400 }
            );
        }

        // Find the business to check if it exists
        const existingBusiness = await Business.findById(businessData._id);

        if (!existingBusiness) {
            return Response.json(
                { message: 'Business not found' },
                { status: 404 }
            );
        }

        // Update geospatial data if coordinates are provided and it's not a chain
        if (!businessData.is_chain && businessData.lat && businessData.lng) {
            businessData.location = {
                type: 'Point',
                coordinates: [
                    parseFloat(businessData.lng),
                    parseFloat(businessData.lat)
                ]
            };
        } else if (!businessData.is_chain && businessData.address1 && businessData.city && businessData.state) {
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

        // Update timestamp
        businessData.updated_at = new Date();

        // Update business
        const result = await Business.findByIdAndUpdate(
            businessData._id,
            businessData,
            { new: true }
        );

        return Response.json({
            message: businessData.is_chain ? 'Chain updated successfully' : 'Business updated successfully',
            result: result
        });

    } catch (error) {
        console.error('Error updating business:', error);
        return Response.json(
            { message: 'Error updating business', error: error.message },
            { status: 500 }
        );
    }
}

// ========== ENHANCED BUSINESS ADD WITH CHAIN INHERITANCE ==========

/**
 * UPDATED: Enhanced business add operation with proper chain inheritance
 */
async function handleAddBusiness(request) {
    console.log("🏢 BUSINESS ADD: Enhanced add with chain inheritance");

    try {
        const businessData = await request.json();
        console.log("📝 Business data received:", businessData);

        // Validate required fields
        if (!businessData.name || !businessData.address1) {
            return Response.json(
                { message: 'Business name and address are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // ENHANCED: Handle chain inheritance
        let chainInheritanceData = {};

        if (businessData.chain_id) {
            console.log(`🔗 CHAIN INHERITANCE: Processing chain ID ${businessData.chain_id}`);

            try {
                // Get chain details from chains collection
                const chainDetails = await Chain.findById(businessData.chain_id);

                if (chainDetails) {
                    console.log(`✅ Chain found: ${chainDetails.chain_name}`);
                    console.log(`   - Universal Incentives: ${chainDetails.universal_incentives}`);

                    // CRITICAL FIX: Inherit chain properties
                    chainInheritanceData = {
                        chain_id: businessData.chain_id,
                        chain_name: chainDetails.chain_name,
                        is_chain_location: true,
                        // CRITICAL: Inherit universal_incentives from parent chain
                        universal_incentives: chainDetails.universal_incentives
                    };

                    console.log(`🔗 Chain inheritance data:`, chainInheritanceData);
                } else {
                    console.warn(`⚠️ Chain not found for ID: ${businessData.chain_id}`);
                }
            } catch (chainError) {
                console.error("❌ Error getting chain details for inheritance:", chainError);
            }
        }

        // Create the business document with inherited chain properties
        const newBusiness = {
            bname: businessData.name,
            address1: businessData.address1,
            address2: businessData.address2 || '',
            city: businessData.city || '',
            state: businessData.state || '',
            zip: businessData.zip || '',
            phone: businessData.phone || '',
            type: businessData.type || 'OTHER',
            status: 'active',

            // Location data
            location: businessData.location || {
                type: 'Point',
                coordinates: [
                    parseFloat(businessData.lng) || 0,
                    parseFloat(businessData.lat) || 0
                ]
            },

            // ENHANCED: Include all chain inheritance data
            ...chainInheritanceData,

            // Set universal_incentives from chain or default to false
            universal_incentives: chainInheritanceData.universal_incentives || false,

            // Metadata
            created_by: businessData.created_by || 'system',
            created_at: new Date(),
            updated_at: new Date()
        };

        console.log("💾 Final business document to save:", newBusiness);

        // Save the business
        const savedBusiness = await Business.create(newBusiness);

        console.log(`✅ Business saved successfully: ${savedBusiness._id}`);
        console.log(`   - Chain ID: ${savedBusiness.chain_id || 'None'}`);
        console.log(`   - Universal Incentives: ${savedBusiness.universal_incentives}`);

        return Response.json({
            success: true,
            message: 'Business added successfully',
            businessId: savedBusiness._id,
            chainInfo: chainInheritanceData.chain_id ? {
                chainId: chainInheritanceData.chain_id,
                chainName: chainInheritanceData.chain_name,
                universalIncentives: chainInheritanceData.universal_incentives
            } : null
        }, { status: 201 });

    } catch (error) {
        console.error("❌ Error in enhanced business add:", error);
        return Response.json(
            { success: false, message: 'Error adding business: ' + error.message },
            { status: 500 }
        );
    }
}