// file: /src/app/api/search/route.js v3 - Added Google Places integration for server-side fallback
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';
import { Business, Incentive } from '../../../models/index.js';
import { searchGooglePlaces } from '../../../utils/googlePlaces.js';

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
        const category = searchParams.get('category'); // Category filter from dropdown

        // Enhanced validation - allow search with new parameters
        if (!businessName && !address && !zip && !query && !city && !lat && !serviceType && !category) {
            return NextResponse.json(
                { error: 'At least one search parameter is required (business name, address, city, location, category, or keyword)' },
                { status: 400 }
            );
        }

// Log the search parameters for debugging
        console.log('📋 Search parameters:', {
            businessName,
            address,
            zip,
            query,
            city,
            state,
            category,
            serviceType,
            lat,
            lng
        });

        // Build business search query
        let businessQuery = { status: 'active' };
        let searchConditions = [];

        // ENHANCED: Business Name Search with fuzzy matching
// Store business name for later filtering but DON'T add it to query if we have location
// This allows us to get ALL businesses in radius, then prioritize name matches
        let businessNameFilter = null;
        let fuzzyBusinessNameFilter = null;

        if (businessName && businessName.trim()) {
            // Create exact pattern (with punctuation)
            businessNameFilter = new RegExp(businessName.trim(), 'i');

            // Create fuzzy pattern (remove punctuation and extra spaces for more flexible matching)
            const fuzzyName = businessName.trim()
                .replace(/['''`]/g, '') // Remove apostrophes and quotes
                .replace(/[^\w\s]/g, '') // Remove other punctuation
                .replace(/\s+/g, '\\s*') // Allow flexible spacing
                .trim();
            fuzzyBusinessNameFilter = new RegExp(fuzzyName, 'i');

            console.log('🔍 Search patterns:', {
                original: businessName.trim(),
                exact: businessNameFilter.source,
                fuzzy: fuzzyBusinessNameFilter.source
            });

            // Only add name filter to query if NO location search
            // If we have location, we'll filter/sort after getting all nearby businesses
            if (!lat && !lng && !address) {
                searchConditions.push({
                    $or: [
                        { bname: businessNameFilter },
                        { chain_name: businessNameFilter },
                        // Also try fuzzy matching
                        { bname: fuzzyBusinessNameFilter },
                        { chain_name: fuzzyBusinessNameFilter }
                    ]
                });
            }
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
            const queryTerm = query.trim();
            const queryPattern = new RegExp(queryTerm, 'i');

            // Also create a lookup for category codes
            // If someone searches "restaurant", we want to match type "REST"
            const categoryMapping = {
                'auto': 'AUTO',
                'automotive': 'AUTO',
                'beauty': 'BEAU',
                'book': 'BOOK',
                'bookstore': 'BOOK',
                'clothing': 'CLTH',
                'clothes': 'CLTH',
                'convenience': 'CONV',
                'gas': 'CONV',
                'department': 'DEPT',
                'electronics': 'ELEC',
                'entertainment': 'ENTR',
                'furniture': 'FURN',
                'fuel': 'FUEL',
                'gift': 'GIFT',
                'grocery': 'GROC',
                'hardware': 'HARDW',
                'health': 'HEAL',
                'hotel': 'HOTEL',
                'motel': 'HOTEL',
                'jewelry': 'JEWL',
                'pharmacy': 'RX',
                'restaurant': 'REST',
                'dining': 'REST',
                'food': 'REST',
                'retail': 'RETAIL',
                'service': 'SERV',
                'specialty': 'SPEC',
                'sporting': 'SPRT',
                'sports': 'SPRT',
                'technology': 'TECH',
                'tech': 'TECH',
                'toys': 'TOYS'
            };

            // Check if query matches a category keyword
            const matchedCategory = categoryMapping[queryTerm.toLowerCase()];

            const searchOr = [
                { bname: queryPattern },
                { address1: queryPattern },
                { type: queryPattern },
                { chain_name: queryPattern }
            ];

            // If we found a category match, add exact type match
            if (matchedCategory) {
                searchOr.push({ type: matchedCategory });
                console.log(`🏷️ Keyword "${queryTerm}" mapped to category: ${matchedCategory}`);
            }

            searchConditions.push({ $or: searchOr });
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

        // Support both 'type' and 'category' parameters (use category first, fallback to type)
        const categoryParam = category || type;
        if (categoryParam && categoryParam.trim()) {
            const categoryValue = categoryParam.trim().toUpperCase();
            searchConditions.push({ type: categoryValue });
            console.log(`🏷️ Category filter applied: ${categoryValue}`);
        }

        // Location-based search (from coordinates OR geocoded zip)
        const searchLat = lat || geocodedLocation?.lat;
        const searchLng = lng || geocodedLocation?.lng;
        const searchRadius = geocodedLocation?.radius || radius;

        if (searchLat && searchLng) {
            const earthRadiusInMiles = 3959;
            const radiusInRadians = searchRadius / earthRadiusInMiles;

            console.log(`📍 Using location-based search: [${searchLat}, ${searchLng}] with ${searchRadius} mile radius`);

            // CRITICAL: Remove zip conditions when doing ANY location-based radius search
            // This includes both geocoded zips AND coordinate-based searches
            if (searchLat && searchLng) {
                console.log('🗑️ Removing exact zip/city/state match since we are doing radius search from coordinates');
                searchConditions = searchConditions.filter(condition => {
                    // Remove any condition that has 'zip', 'city', or 'state' property
                    // because we're doing a proximity search instead
                    return !condition.hasOwnProperty('zip') &&
                        !condition.hasOwnProperty('city') &&
                        !condition.hasOwnProperty('state');
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
        if (serviceType && searchConditions.length === 0 && !searchLat) {
            // Service type only search - get all businesses first
            businesses = await Business.find(businessQuery).lean();
        } else {
            // Normal business search
            // NOTE: When using $geoWithin with $centerSphere, results are NOT automatically sorted by distance
            businesses = await Business.find(businessQuery)
                .limit(500) // Increased limit for proximity searches
                .lean();

            // If this is a location-based search, calculate distances and sort
            if (searchLat && searchLng) {
                console.log('📍 Calculating distances and sorting results by proximity');
                businesses = businesses.map(business => {
                    // Calculate distance for sorting
                    const distance = calculateDistance(
                        searchLat, searchLng,
                        business.location.coordinates[1], business.location.coordinates[0]
                    );

                    // Check if business name matches (exact or fuzzy)
                    let nameMatches = false;
                    let isExactMatch = false;

                    if (businessNameFilter || fuzzyBusinessNameFilter) {
                        // Check exact match first
                        isExactMatch = businessNameFilter && (
                            businessNameFilter.test(business.bname) ||
                            businessNameFilter.test(business.chain_name)
                        );

                        // If no exact match, try fuzzy match
                        const isFuzzyMatch = !isExactMatch && fuzzyBusinessNameFilter && (
                            fuzzyBusinessNameFilter.test(business.bname?.replace(/['''`]/g, '').replace(/[^\w\s]/g, '')) ||
                            fuzzyBusinessNameFilter.test(business.chain_name?.replace(/['''`]/g, '').replace(/[^\w\s]/g, ''))
                        );

                        nameMatches = isExactMatch || isFuzzyMatch;

                        if (nameMatches) {
                            console.log(`✓ Name match: ${business.bname} (exact: ${isExactMatch}, fuzzy: ${isFuzzyMatch})`);
                        }
                    }

                    return {
                        ...business,
                        distanceFromSearch: distance,
                        nameMatches: nameMatches,
                        isExactNameMatch: isExactMatch
                    };
                });

                // Sort: Featured VBOs first, then regular VBOs, then name matches, then distance
                businesses.sort((a, b) => {
                    // Check VBO status and featured status
                    const aIsFeaturedVBO = a.veteranOwned?.isVeteranOwned && a.veteranOwned?.priority?.isFeatured;
                    const bIsFeaturedVBO = b.veteranOwned?.isVeteranOwned && b.veteranOwned?.priority?.isFeatured;
                    const aIsVBO = a.veteranOwned?.isVeteranOwned;
                    const bIsVBO = b.veteranOwned?.isVeteranOwned;

                    // Priority 1: Featured VBOs come first
                    if (aIsFeaturedVBO !== bIsFeaturedVBO) {
                        return bIsFeaturedVBO - aIsFeaturedVBO;
                    }

                    // Priority 2: Regular VBOs come next
                    if (aIsVBO !== bIsVBO) {
                        return bIsVBO - aIsVBO;
                    }

                    // Priority 3: Name matches
                    if (a.nameMatches !== b.nameMatches) {
                        return b.nameMatches - a.nameMatches;
                    }

                    // Priority 4: Distance
                    return a.distanceFromSearch - b.distanceFromSearch;
                });

                console.log(`✅ Found ${businesses.filter(b => b.veteranOwned?.isVeteranOwned).length} VBOs (${businesses.filter(b => b.veteranOwned?.priority?.isFeatured).length} featured)`);

                console.log(`✅ Found ${businesses.filter(b => b.nameMatches).length} name matches and ${businesses.filter(b => !b.nameMatches).length} nearby businesses`);
            } else {
                // No location search - sort alphabetically
                businesses.sort((a, b) => a.bname.localeCompare(b.bname));
            }
        }

        console.log(`Found ${businesses.length} businesses matching search criteria`);

        // ========== GOOGLE PLACES INTEGRATION ==========
        // Always fetch Google Places results to supplement database results
        let googlePlacesResults = [];

        console.log('🔍 GOOGLE PLACES CHECK:', {
            hasCoordinates: !!(searchLat && searchLng),
            searchLat,
            searchLng,
            radius,
            businessName,
            query,
            category
        });

        if (searchLat && searchLng) {
            // We have coordinates - search Google Places in that area
            const radiusInMeters = radius * 1609.34; // Convert miles to meters

            // ENHANCED: Build Google Places query with better defaults
            let placesQuery = '';
            let searchType = 'textSearch'; // Can be 'textSearch' or 'nearbySearch'

            if (businessName && businessName.trim()) {
                placesQuery = businessName.trim();
                searchType = 'textSearch';
            } else if (query && query.trim()) {
                placesQuery = query.trim();
                searchType = 'textSearch';
            } else if (category) {
                // Map category codes to search terms
                const categorySearchTerms = {
                    'AUTO': 'automotive',
                    'BEAU': 'beauty salon',
                    'BOOK': 'bookstore',
                    'CLTH': 'clothing store',
                    'CONV': 'convenience store',
                    'DEPT': 'department store',
                    'ELEC': 'electronics store',
                    'ENTR': 'entertainment',
                    'FURN': 'furniture store',
                    'FUEL': 'gas station',
                    'GIFT': 'gift shop',
                    'GROC': 'grocery store',
                    'HARDW': 'hardware store',
                    'HEAL': 'health',
                    'HOTEL': 'hotel',
                    'JEWL': 'jewelry store',
                    'RX': 'pharmacy',
                    'REST': 'restaurant',
                    'RETAIL': 'retail store',
                    'SERV': 'service',
                    'SPEC': 'specialty store',
                    'SPRT': 'sporting goods',
                    'TECH': 'technology store',
                    'TOYS': 'toy store'
                };
                placesQuery = categorySearchTerms[category] || 'restaurant';
                searchType = 'textSearch';
            } else {
                // CRITICAL FIX: For generic "Near Me" searches, use a curated list
                // of business types that typically offer military discounts
                // This prevents random law offices and consultants from appearing

                console.log('🎯 Generic location search - using curated business types');

                // OPTION 1: Skip Google Places for generic searches (most conservative)
                // placesQuery = null; // This will skip Google Places below

                // OPTION 2: Search for specific relevant types (recommended)
                // We'll search for common businesses that offer military discounts
                const relevantTypes = [
                    'restaurant',
                    'grocery_or_supermarket',
                    'department_store',
                    'clothing_store',
                    'home_goods_store',
                    'electronics_store',
                    'gas_station',
                    'pharmacy',
                    'hardware_store',
                    'furniture_store',
                    'sporting_goods_store',
                    'car_repair',
                    'beauty_salon',
                    'hair_care',
                    'gym'
                ];

                // Use nearby search with multiple types instead of text search
                placesQuery = relevantTypes; // Pass array for nearby search
                searchType = 'nearbySearch';
            }

            console.log(`🌍 Google Places search type: ${searchType}`);
            console.log(`🌍 Fetching Google Places for "${Array.isArray(placesQuery) ? 'multiple types' : placesQuery}" near [${searchLat}, ${searchLng}], radius: ${radius} miles (${radiusInMeters}m)`);

            try {
                // Only call Google Places if we have a query
                if (placesQuery && (typeof placesQuery === 'string' || Array.isArray(placesQuery))) {
                    googlePlacesResults = await searchGooglePlaces(
                        placesQuery,
                        searchLat,
                        searchLng,
                        radiusInMeters,
                        searchType // NEW: Pass search type to the utility function
                    );
                } else {
                    console.log('ℹ️ Skipping Google Places search (no query specified)');
                    googlePlacesResults = [];
                }

                console.log(`✅ Google Places returned ${googlePlacesResults.length} results`);

                if (googlePlacesResults.length === 0) {
                    console.log('⚠️ Google Places returned ZERO results - this might indicate an API issue');
                } else {
                    console.log('📋 First few Google Places results:',
                        googlePlacesResults.slice(0, 3).map(p => ({
                            name: p.bname,
                            address: p.address1,
                            lat: p.lat,
                            lng: p.lng
                        }))
                    );
                }

                // Filter out Google Places that are already in our database
                const originalGoogleCount = googlePlacesResults.length;
                googlePlacesResults = googlePlacesResults.filter(googlePlace => {
                    // Check if we already have this place in our database
                    const isDuplicate = businesses.some(dbBusiness => {
                        // Check 1: Google Place ID match
                        if (dbBusiness.google_place_id && googlePlace.placeId) {
                            return dbBusiness.google_place_id === googlePlace.placeId;
                        }

                        // Check 2: Coordinate proximity (within ~100 meters)
                        if (dbBusiness.location?.coordinates && googlePlace.location?.coordinates) {
                            const distance = calculateDistance(
                                dbBusiness.location.coordinates[1], // lat
                                dbBusiness.location.coordinates[0], // lng
                                googlePlace.location.coordinates[1], // lat
                                googlePlace.location.coordinates[0]  // lng
                            );
                            // If within 0.06 miles (~100 meters), consider it a duplicate
                            return distance < 0.06;
                        }

                        return false;
                    });

                    if (isDuplicate) {
                        console.log(`🔄 Filtered duplicate: ${googlePlace.bname}`);
                    }

                    return !isDuplicate;
                });

                console.log(`✅ After deduplication: ${googlePlacesResults.length} unique Google Places results (removed ${originalGoogleCount - googlePlacesResults.length} duplicates)`);

                // Calculate distance from search point for Google Places results
                googlePlacesResults = googlePlacesResults.map(place => ({
                    ...place,
                    distanceFromSearch: calculateDistance(
                        searchLat,
                        searchLng,
                        place.lat,
                        place.lng
                    )
                }));

            } catch (placesError) {
                console.error('❌ Google Places search FAILED:', placesError);
                console.error('Error details:', placesError.message);
                console.error('Stack trace:', placesError.stack);
                // Don't fail the entire search if Google Places fails
            }
        } else {
            console.log('ℹ️ No coordinates available for Google Places search - skipping Google Places');
        }

        // Combine database results with Google Places results
        // Database results come first, then Google Places sorted by distance
        const dbCount = businesses.length;
        const googleCount = googlePlacesResults.length;

        businesses = [
            ...businesses,
            ...googlePlacesResults.sort((a, b) =>
                (a.distanceFromSearch || 0) - (b.distanceFromSearch || 0)
            )
        ];

        console.log(`📊 FINAL RESULTS: ${businesses.length} total (${dbCount} from database, ${googleCount} from Google Places)`);
        // ========== END GOOGLE PLACES INTEGRATION ==========

        // Get incentives for found businesses
        const businessIds = businesses.map(b => b._id.toString()).filter(id => !id.startsWith('google_'));
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
                type: categoryParam || type, // category filter
                serviceType,
                location: (searchLat && searchLng) ? {
                    lat: parseFloat(searchLat),
                    lng: parseFloat(searchLng),
                    radius: searchRadius,
                    source: geocodedLocation ? 'geocoded_zip' : 'coordinates'
                } : null
            },
            // VBO Statistics - NEW
            vboStats: {
                total: results.filter(r => r.veteranOwned?.isVeteranOwned).length,
                featured: results.filter(r => r.veteranOwned?.priority?.isFeatured).length,
                premium: results.filter(r => r.veteranOwned?.priority?.isPremium).length
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

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}