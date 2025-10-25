// file: /src/app/api/search/route.js v2 - Enhanced to handle businessName and address parameters
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';
import { Business, Incentive } from '../../../models/index.js';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Enhanced search parameters
        const businessName = searchParams.get('businessName');
        const address = searchParams.get('address');
        const zip = searchParams.get('zip');

        // Legacy parameters (maintained for backward compatibility)
        const query = searchParams.get('q');
        const city = searchParams.get('city');
        const state = searchParams.get('state');
        const type = searchParams.get('type');
        const serviceType = searchParams.get('serviceType'); // VT, AD, FR, SP
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const radius = parseInt(searchParams.get('radius')) || 25; // miles

        // Enhanced validation - allow search with new parameters
        if (!businessName && !address && !zip && !query && !city && !lat && !serviceType) {
            return NextResponse.json(
                { error: 'At least one search parameter is required (business name, address, city, location, or service type)' },
                { status: 400 }
            );
        }

        // Build business search query
        let businessQuery = { status: 'active' };
        let searchConditions = [];

        // ENHANCED: Business Name Search
        if (businessName && businessName.trim()) {
            const namePattern = new RegExp(businessName.trim(), 'i');
            searchConditions.push({
                $or: [
                    { bname: namePattern },
                    { chain_name: namePattern }
                ]
            });
        }

        // ENHANCED: Address Search (supports full addresses, zip codes, etc.)
        let geocodedLocation = null;
        if (address && address.trim()) {
            const addressTerm = address.trim();

            // Check if it's a zip code (5 digits or 5+4 format)
            const zipPattern = /^\d{5}(-\d{4})?$/;

            if (zipPattern.test(addressTerm)) {
                // Zip code search - geocode to coordinates for radius search
                console.log('🔍 Zip code detected, will geocode for radius search:', addressTerm);

                try {
                    const { geocodeAddress } = await import('../../../utils/geocoding.js');
                    const coords = await geocodeAddress(addressTerm);

                    if (coords) {
                        geocodedLocation = {
                            lat: coords.lat,
                            lng: coords.lng,
                            radius: radius // Use default radius (25 miles)
                        };
                        console.log('✅ Geocoded zip code:', geocodedLocation);
                    } else {
                        // Fallback to exact zip match if geocoding fails
                        console.warn('⚠️ Could not geocode zip, falling back to exact match');
                        searchConditions.push({
                            zip: addressTerm.replace('-', '')
                        });
                    }
                } catch (geocodeError) {
                    console.error('❌ Geocoding error:', geocodeError);
                    // Fallback to exact zip match
                    searchConditions.push({
                        zip: addressTerm.replace('-', '')
                    });
                }
            } else {
                // General address search - search all address components
                const escapedTerm = addressTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const addressPattern = new RegExp(escapedTerm, 'i');
                searchConditions.push({
                    $or: [
                        { address1: addressPattern },
                        { address2: addressPattern },
                        { city: addressPattern },
                        { state: addressPattern },
                        { zip: addressPattern }
                    ]
                });
            }
        }

        // Handle legacy zip parameter
        if (zip && zip.trim()) {
            searchConditions.push({ zip: zip.trim().replace('-', '') });
        }

        // LEGACY: Original query parameter (keywords/general search)
        if (query && query.trim()) {
            const queryPattern = new RegExp(query.trim(), 'i');
            searchConditions.push({
                $or: [
                    { bname: queryPattern },
                    { address1: queryPattern },
                    { type: queryPattern },
                    { chain_name: queryPattern }
                ]
            });
        }

        // LEGACY: Specific field searches
        if (city && city.trim()) {
            const escapedCity = city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            searchConditions.push({ city: new RegExp(escapedCity, 'i') });
        }

        if (state && state.trim()) {
            // State should be exact match (case-insensitive)
            searchConditions.push({ state: new RegExp(`^${state.trim()}$`, 'i') });
        }

        if (type && type.trim()) {
            searchConditions.push({ type: type.trim().toUpperCase() });
        }

        // Location-based search (from coordinates OR geocoded zip)
        const searchLat = lat || geocodedLocation?.lat;
        const searchLng = lng || geocodedLocation?.lng;
        const searchRadius = geocodedLocation?.radius || radius;

        if (searchLat && searchLng) {
            const earthRadiusInMiles = 3959;
            const radiusInRadians = searchRadius / earthRadiusInMiles;

            console.log(`📍 Using location-based search: [${searchLat}, ${searchLng}] with ${searchRadius} mile radius`);

            // CRITICAL: Remove zip conditions when doing geocoded radius search
            if (geocodedLocation) {
                console.log('🗑️ Removing exact zip match since we are doing radius search from geocoded zip');
                searchConditions = searchConditions.filter(condition => {
                    // Remove any condition that has 'zip' property
                    return !condition.hasOwnProperty('zip');
                });
            }

            businessQuery.location = {
                $geoWithin: {
                    $centerSphere: [[parseFloat(searchLng), parseFloat(searchLat)], radiusInRadians]
                }
            };
        }

        // NOW combine all search conditions AFTER filtering
        if (searchConditions.length > 0) {
            if (searchConditions.length === 1) {
                // Single condition
                Object.assign(businessQuery, searchConditions[0]);
            } else {
                // Multiple conditions - use AND logic
                businessQuery.$and = searchConditions;
            }
        }

        console.log('Enhanced search query:', JSON.stringify(businessQuery, null, 2));

        // Execute business search
        let businesses;
        if (serviceType && searchConditions.length === 0 && !lat) {
            // Service type only search - get all businesses first
            businesses = await Business.find(businessQuery).lean();
        } else {
            // Normal business search with sorting and limits
            businesses = await Business.find(businessQuery)
                .sort({
                    // Prioritize exact business name matches
                    bname: 1
                })
                .limit(100) // Increased limit for better results
                .lean();
        }

        console.log(`Found ${businesses.length} businesses matching search criteria`);

        // Get incentives for found businesses
        const businessIds = businesses.map(b => b._id.toString());
        let incentiveQuery = {
            business_id: { $in: businessIds },
            is_available: true
        };

        if (serviceType && serviceType.trim()) {
            incentiveQuery.type = serviceType.trim().toUpperCase();
        }

        const incentives = await Incentive.find(incentiveQuery).lean();

        // Group incentives by business
        const incentivesByBusiness = incentives.reduce((acc, incentive) => {
            const businessId = incentive.business_id;
            if (!acc[businessId]) acc[businessId] = [];
            acc[businessId].push(incentive);
            return acc;
        }, {});

        // Filter businesses that have incentives (if serviceType specified)
        if (serviceType && serviceType.trim()) {
            businesses = businesses.filter(business =>
                incentivesByBusiness[business._id.toString()]
            );
        }

        // Add incentives to business objects and enhance with additional data
        const results = businesses.map(business => ({
            ...business,
            incentives: incentivesByBusiness[business._id.toString()] || [],
            // Add flags for frontend logic
            hasIncentives: (incentivesByBusiness[business._id.toString()] || []).length > 0,
            isChain: !!business.chain_id || !!business.chain_name
        }));

        // Enhanced response with more detailed filters
        const response = {
            results,
            total: results.length,
            searchType: getSearchType(businessName, address, query, city, serviceType),
            filters: {
                businessName,
                address,
                zip,
                query, // legacy
                city,
                state,
                type,
                serviceType,
                location: (searchLat && searchLng) ? {
                    lat: parseFloat(searchLat),
                    lng: parseFloat(searchLng),
                    radius: searchRadius,
                    source: geocodedLocation ? 'geocoded_zip' : 'coordinates'
                } : null
            },
            // Additional metadata
            hasLocationSearch: !!(lat && lng),
            hasBusinessNameSearch: !!(businessName && businessName.trim()),
            hasAddressSearch: !!(address && address.trim()),
            searchQuery: businessQuery // For debugging (remove in production)
        };

        console.log(`Returning ${results.length} results for search`);
        return NextResponse.json(response);

    } catch (error) {
        console.error('Enhanced search error:', error);
        return NextResponse.json(
            { error: 'Search failed', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Determine the type of search being performed for analytics/debugging
 */
function getSearchType(businessName, address, query, city, serviceType) {
    if (businessName && address) return 'business_and_location';
    if (businessName) return 'business_name';
    if (address) return 'address';
    if (serviceType && !query && !city) return 'service_type_only';
    if (city) return 'city';
    if (query) return 'keyword';
    return 'unknown';
}