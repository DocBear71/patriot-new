// file: /src/utils/businessUtils.js v1 - Business utility functions
// Extracted utility functions from API routes to fix Next.js export restrictions

import connectDB from '../lib/mongodb.js';
import mongoose from 'mongoose';
import Business from '../models/Business.js';
import Chain from '../models/Chain.js';

/**
 * ENHANCED: Enhanced incentive retrieval with proper chain inheritance handling
 * This replaces the function that was previously exported from the API route
 */
export async function getBusinessIncentivesWithChainInheritance(businessId) {
    console.log(`🎁 ENHANCED INCENTIVES: Getting incentives for business ${businessId}`);

    try {
        await connectDB();

        const business = await Business.findById(businessId);

        if (!business) {
            console.error(`❌ Business not found: ${businessId}`);
            return [];
        }

        console.log(`📊 Business details for incentives:`);
        console.log(`   - Name: ${business.bname}`);
        console.log(`   - Chain ID: ${business.chain_id || 'None'}`);
        console.log(`   - Universal Incentives: ${business.universal_incentives}`);
        console.log(`   - Is Chain Location: ${business.is_chain_location || false}`);

        // If this is a chain location with universal incentives enabled
        if (business.chain_id && business.universal_incentives) {
            console.log(`🔗 CHAIN INCENTIVES: Loading chain incentives for ${business.bname}`);

            try {
                const chainDetails = await Chain.findById(business.chain_id);

                if (chainDetails && chainDetails.incentives && chainDetails.incentives.length > 0) {
                    // Convert chain incentives to standard format
                    const chainIncentives = chainDetails.incentives
                        .filter(incentive => incentive.is_active)
                        .map(incentive => ({
                            _id: incentive._id,
                            business_id: businessId, // Associate with this location
                            is_available: incentive.is_active,
                            type: incentive.type,
                            amount: incentive.amount,
                            information: incentive.information,
                            other_description: incentive.other_description,
                            created_at: incentive.created_date,
                            is_chain_wide: true // Mark as chain-wide
                        }));

                    console.log(`✅ Found ${chainIncentives.length} chain incentives for ${business.bname}`);
                    return chainIncentives;
                } else {
                    console.log(`❌ No active chain incentives found for chain ${business.chain_id}`);
                    return [];
                }
            } catch (chainError) {
                console.error("❌ Error loading chain incentives:", chainError);
                return [];
            }
        } else {
            // Check for location-specific incentives
            const Incentive = mongoose.model('Incentive');
            const locationIncentives = await Incentive.find({
                business_id: businessId,
                is_available: true
            });

            console.log(`📍 Found ${locationIncentives.length} location-specific incentives`);
            return locationIncentives;
        }

    } catch (error) {
        console.error("❌ Error in getBusinessIncentivesWithChainInheritance:", error);
        return [];
    }
}

/**
 * Get business details with chain information
 */
export async function getBusinessWithChainDetails(businessId) {
    try {
        await connectDB();

        const business = await Business.findById(businessId);

        if (!business) {
            return null;
        }

        // If this business is part of a chain, get chain details
        if (business.chain_id) {
            const chainDetails = await Chain.findById(business.chain_id);
            if (chainDetails) {
                return {
                    ...business.toObject(),
                    chainDetails: {
                        _id: chainDetails._id,
                        chain_name: chainDetails.chain_name,
                        universal_incentives: chainDetails.universal_incentives,
                        incentives: chainDetails.incentives || []
                    }
                };
            }
        }

        return business.toObject();
    } catch (error) {
        console.error("❌ Error getting business with chain details:", error);
        return null;
    }
}

/**
 * Validate business data before creation/update
 */
export function validateBusinessData(businessData, isUpdate = false) {
    const errors = [];

    // Required fields for new businesses
    if (!isUpdate) {
        if (!businessData.bname && !businessData.name) {
            errors.push('Business name is required');
        }
        if (!businessData.type) {
            errors.push('Business type is required');
        }
    }

    // If not a chain, require address fields
    if (!businessData.is_chain) {
        if (!businessData.address1) {
            errors.push('Address is required for non-chain businesses');
        }
        if (!businessData.city) {
            errors.push('City is required for non-chain businesses');
        }
        if (!businessData.state) {
            errors.push('State is required for non-chain businesses');
        }
        if (!businessData.zip) {
            errors.push('ZIP code is required for non-chain businesses');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Format business data for database storage
 */
export function formatBusinessDataForStorage(businessData) {
    const formatted = {
        bname: businessData.bname || businessData.name,
        address1: businessData.address1 || '',
        address2: businessData.address2 || '',
        city: businessData.city || '',
        state: businessData.state || '',
        zip: businessData.zip || '',
        phone: businessData.phone || '',
        type: businessData.type || 'OTHER',
        status: businessData.status || 'active',
        created_by: businessData.created_by || 'system',
        updated_at: new Date()
    };

    // Add creation timestamp if not updating
    if (!businessData._id) {
        formatted.created_at = new Date();
    }

    // Handle chain data
    if (businessData.chain_id) {
        formatted.chain_id = businessData.chain_id;
        formatted.is_chain_location = true;
    }

    // Handle location coordinates
    if (businessData.lat && businessData.lng) {
        formatted.location = {
            type: 'Point',
            coordinates: [
                parseFloat(businessData.lng),
                parseFloat(businessData.lat)
            ]
        };
    }

    return formatted;
}

/**
 * Get business type label from code
 */
export function getBusinessTypeLabel(typeCode) {
    const types = {
        'AUTO': 'Automotive',
        'BEAU': 'Beauty',
        'BOOK': 'Bookstore',
        'CLTH': 'Clothing',
        'CONV': 'Convenience Store',
        'DEPT': 'Department Store',
        'ELEC': 'Electronics',
        'ENTR': 'Entertainment',
        'FURN': 'Furniture',
        'FUEL': 'Fuel Station',
        'GIFT': 'Gift Shop',
        'GROC': 'Grocery',
        'HARDW': 'Hardware',
        'HEAL': 'Health',
        'HOTEL': 'Hotel/Motel',
        'JEWL': 'Jewelry',
        'OTHER': 'Other',
        'RX': 'Pharmacy',
        'REST': 'Restaurant',
        'RETAIL': 'Retail',
        'SERV': 'Service',
        'SPEC': 'Specialty',
        'SPRT': 'Sporting Goods',
        'TECH': 'Technology',
        'TOYS': 'Toys'
    };
    return types[typeCode] || typeCode;
}