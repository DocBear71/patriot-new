// file: /src/utils/googlePlaces.js v1 - Google Places API integration for server-side searches

/**
 * Search for businesses using Google Places API (Text Search or Nearby Search)
 * @param {string|Array} query - Search query (business name, type, etc.) or array of types for nearby search
 * @param {number} lat - Latitude for location bias
 * @param {number} lng - Longitude for location bias
 * @param {number} radius - Search radius in meters (default 40234 = 25 miles)
 * @param {string} searchType - 'textSearch' or 'nearbySearch' (default: 'textSearch')
 * @returns {Promise<Array>} Array of place results
 */
export async function searchGooglePlaces(query, lat = null, lng = null, radius = 40234, searchType = 'textSearch') {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Server-side API key

    if (!apiKey) {
        console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables');
        return [];
    }

    try {
        // NEARBY SEARCH: Use when we have an array of types (for generic location searches)
        if (searchType === 'nearbySearch' && Array.isArray(query)) {
            console.log('🎯 Using Google Places NEARBY SEARCH with types:', query);

            if (!lat || !lng) {
                console.error('❌ Nearby search requires coordinates');
                return [];
            }

            // Make multiple requests for different business types and combine results
            const allResults = [];
            const seenPlaceIds = new Set();

            // Limit to first 5 types to avoid too many API calls
            const typesToSearch = query.slice(0, 5);

            for (const type of typesToSearch) {
                try {
                    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

                    console.log(`🔍 Nearby search for type: ${type}`);

                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.status === 'OK' && data.results) {
                        // Filter out duplicates
                        const uniqueResults = data.results.filter(place => {
                            if (seenPlaceIds.has(place.place_id)) {
                                return false;
                            }
                            seenPlaceIds.add(place.place_id);
                            return true;
                        });

                        console.log(`  ✅ Found ${uniqueResults.length} unique results for ${type}`);
                        allResults.push(...uniqueResults);
                    }

                    // Add small delay to respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (typeError) {
                    console.error(`❌ Error searching type ${type}:`, typeError);
                }
            }

            console.log(`✅ Total nearby search results: ${allResults.length} unique places`);

            // Transform and return results
            return allResults.map(place => transformPlaceResult(place));
        }

        // TEXT SEARCH: Use when we have a specific query string
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?key=${apiKey}`;

        // Add query
        if (query && typeof query === 'string' && query.trim()) {
            url += `&query=${encodeURIComponent(query.trim())}`;
        } else if (!query || (typeof query === 'string' && !query.trim())) {
            console.warn('⚠️ No search query provided for text search');
            return [];
        }

        // Add location bias if coordinates provided
        if (lat && lng) {
            url += `&location=${lat},${lng}`;
            url += `&radius=${radius}`;
        }

        console.log('🔍 Google Places API Text Search:', { query, lat, lng, radius });

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
            console.log(`✅ Google Places text search returned ${data.results.length} results`);
            return data.results.map(place => transformPlaceResult(place));
        } else if (data.status === 'ZERO_RESULTS') {
            console.log('ℹ️ Google Places text search returned zero results');
            return [];
        } else {
            console.warn('⚠️ Google Places API error:', data.status, data.error_message);
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching from Google Places:', error);
        return [];
    }
}

/**
 * Transform a Google Place result to match your business schema
 * @param {Object} place - Raw Google Place result
 * @returns {Object} Transformed business object
 */
function transformPlaceResult(place) {
    // First, try to extract from address_components (available in Place Details API)
    let city = '';
    let state = '';
    let zip = '';
    let streetAddress = '';

    if (place.address_components && place.address_components.length > 0) {
        // Use address_components if available (Place Details API)
        city = extractCityFromComponents(place.address_components);
        state = extractStateFromComponents(place.address_components);
        zip = extractZipFromComponents(place.address_components);
        streetAddress = extractStreetAddress(place.address_components);
        console.log('📍 Extracted from address_components:', { city, state, zip, streetAddress });
    } else {
        // Fallback: Parse the formatted_address string (Text Search API)
        const addressParts = parseFormattedAddress(place.formatted_address || place.vicinity || '');
        city = addressParts.city;
        state = addressParts.state;
        zip = addressParts.zip;
        streetAddress = addressParts.street;
        console.log('📍 Parsed from formatted_address:', { city, state, zip, streetAddress });
    }

    // Map Google Place types to our business types
    const businessType = mapGoogleTypeToBusinessType(place.types || []);

    return {
        // Use a temporary ID that can be identified as Google Place
        _id: `google_${place.place_id}`,
        placeId: place.place_id,

        // Business info - Use extracted/parsed address components
        bname: place.name,
        address1: streetAddress || place.vicinity || '',
        address2: '',
        city: city,
        state: state,
        zip: zip,
        phone: place.formatted_phone_number || place.international_phone_number || '',
        type: businessType, // NEW: Map Google types to our business type

        // Location data
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
        location: place.geometry?.location ? {
            type: 'Point',
            coordinates: [
                place.geometry.location.lng,
                place.geometry.location.lat
            ]
        } : null,

        // Additional Google Places data
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || 0,
        types: place.types || [],
        business_status: place.business_status || 'OPERATIONAL',

        // Flags for frontend
        isGooglePlace: true,
        isFromDatabase: false,
        markerColor: 'nearby', // Blue marker
        google_place_id: place.place_id,

        // No incentives from Google Places
        incentives: [],
        hasIncentives: false,

        // Status
        status: 'google_place' // Special status to identify Google Places
    };
}

/**
 * Map Google Place types to our business type codes
 * @param {Array} googleTypes - Array of Google Place type strings
 * @returns {string} Our business type code (or empty string if no match)
 */
function mapGoogleTypeToBusinessType(googleTypes) {
    if (!googleTypes || googleTypes.length === 0) return '';

    // Mapping from Google types to our codes
    const typeMapping = {
        // Restaurant/Food
        'restaurant': 'REST',
        'food': 'REST',
        'cafe': 'REST',
        'bakery': 'REST',
        'bar': 'REST',
        'meal_delivery': 'REST',
        'meal_takeaway': 'REST',

        // Automotive
        'car_dealer': 'AUTO',
        'car_rental': 'AUTO',
        'car_repair': 'AUTO',
        'car_wash': 'AUTO',

        // Grocery
        'grocery_or_supermarket': 'GROC',
        'supermarket': 'GROC',

        // Gas/Convenience
        'gas_station': 'FUEL',
        'convenience_store': 'CONV',

        // Hotel/Lodging
        'lodging': 'HOTEL',
        'hotel': 'HOTEL',
        'motel': 'HOTEL',

        // Health
        'pharmacy': 'RX',
        'drugstore': 'RX',
        'hospital': 'HEAL',
        'doctor': 'HEAL',
        'dentist': 'HEAL',
        'health': 'HEAL',
        'gym': 'HEAL',

        // Beauty
        'beauty_salon': 'BEAU',
        'hair_care': 'BEAU',
        'spa': 'BEAU',

        // Retail/Shopping
        'department_store': 'DEPT',
        'shopping_mall': 'DEPT',
        'clothing_store': 'CLTH',
        'shoe_store': 'CLTH',
        'jewelry_store': 'JEWL',
        'electronics_store': 'ELEC',
        'furniture_store': 'FURN',
        'home_goods_store': 'FURN',
        'hardware_store': 'HARDW',
        'pet_store': 'RETAIL',
        'florist': 'GIFT',
        'book_store': 'BOOK',

        // Entertainment
        'movie_theater': 'ENTR',
        'amusement_park': 'ENTR',
        'bowling_alley': 'ENTR',
        'casino': 'ENTR',
        'night_club': 'ENTR',
        'stadium': 'ENTR',

        // Sporting Goods
        'sporting_goods_store': 'SPRT',

        // Services
        'bank': 'SERV',
        'atm': 'SERV',
        'insurance_agency': 'SERV',
        'real_estate_agency': 'SERV',
        'travel_agency': 'SERV',
        'laundry': 'SERV',
        'locksmith': 'SERV',
        'electrician': 'SERV',
        'plumber': 'SERV',

        // Store (generic)
        'store': 'RETAIL'
    };

    // Check each Google type and return first match
    for (const googleType of googleTypes) {
        const lowerType = googleType.toLowerCase();
        if (typeMapping[lowerType]) {
            console.log(`🏷️ Mapped Google type "${googleType}" to "${typeMapping[lowerType]}"`);
            return typeMapping[lowerType];
        }
    }

    // No match found
    console.log('⚠️ No business type mapping for:', googleTypes);
    return '';
}

/**
 * Get detailed information about a specific place
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object|null>} Place details or null
 */
export async function getPlaceDetails(placeId) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error('❌ GOOGLE_MAPS_API_KEY not found');
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address,formatted_phone_number,geometry,address_components,website,rating,user_ratings_total,types`;

        console.log('🔍 Fetching place details for:', placeId);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            const place = data.result;

            return {
                placeId: placeId,
                bname: place.name,
                address1: extractStreetAddress(place.address_components),
                address2: '',
                city: extractCityFromComponents(place.address_components),
                state: extractStateFromComponents(place.address_components),
                zip: extractZipFromComponents(place.address_components),
                phone: place.formatted_phone_number || '',
                website: place.website || '',
                lat: place.geometry?.location?.lat || 0,
                lng: place.geometry?.location?.lng || 0,
                rating: place.rating || null,
                user_ratings_total: place.user_ratings_total || 0,
                types: place.types || []
            };
        } else {
            console.warn('⚠️ Could not fetch place details:', data.status);
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching place details:', error);
        return null;
    }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Extract city from place result
 */
function extractCity(place) {
    if (!place.address_components) return '';

    const cityComponent = place.address_components.find(component =>
        component.types.includes('locality') ||
        component.types.includes('sublocality')
    );

    return cityComponent?.long_name || '';
}

/**
 * Extract state from place result
 */
function extractState(place) {
    if (!place.address_components) return '';

    const stateComponent = place.address_components.find(component =>
        component.types.includes('administrative_area_level_1')
    );

    return stateComponent?.short_name || '';
}

/**
 * Extract zip code from place result
 */
function extractZip(place) {
    if (!place.address_components) return '';

    const zipComponent = place.address_components.find(component =>
        component.types.includes('postal_code')
    );

    return zipComponent?.long_name || '';
}

/**
 * Extract street address from address components
 */
function extractStreetAddress(addressComponents) {
    if (!addressComponents) return '';

    const streetNumber = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
    const route = addressComponents.find(c => c.types.includes('route'))?.long_name || '';

    return `${streetNumber} ${route}`.trim();
}

/**
 * Extract city from address components (for place details)
 */
function extractCityFromComponents(addressComponents) {
    if (!addressComponents) return '';

    const cityComponent = addressComponents.find(component =>
        component.types.includes('locality') ||
        component.types.includes('sublocality')
    );

    return cityComponent?.long_name || '';
}

/**
 * Extract state from address components (for place details)
 */
function extractStateFromComponents(addressComponents) {
    if (!addressComponents) return '';

    const stateComponent = addressComponents.find(component =>
        component.types.includes('administrative_area_level_1')
    );

    return stateComponent?.short_name || '';
}

/**
 * Extract zip from address components (for place details)
 */
function extractZipFromComponents(addressComponents) {
    if (!addressComponents) return '';

    const zipComponent = addressComponents.find(component =>
        component.types.includes('postal_code')
    );

    return zipComponent?.long_name || '';
}

/**
 * Parse formatted address string to extract components
 * Handles formats like: "123 Main St, Cedar Rapids, IA 52402, USA"
 */
function parseFormattedAddress(formattedAddress) {
    if (!formattedAddress) return { street: '', city: '', state: '', zip: '' };

    const parts = formattedAddress.split(',').map(p => p.trim());

    // Common format: "Street, City, State Zip, Country"
    if (parts.length >= 3) {
        const street = parts[0];
        const city = parts[1];

        // Extract state and zip from "IA 52402" or "Iowa 52402"
        const stateZipPart = parts[2];
        const stateZipMatch = stateZipPart.match(/([A-Z]{2})\s+(\d{5})/i);

        if (stateZipMatch) {
            return {
                street: street,
                city: city,
                state: stateZipMatch[1],
                zip: stateZipMatch[2]
            };
        }

        // Try to extract just state (no zip)
        const stateMatch = stateZipPart.match(/^([A-Z]{2})/i);
        if (stateMatch) {
            return {
                street: street,
                city: city,
                state: stateMatch[1],
                zip: ''
            };
        }
    }

    // Fallback
    return {
        street: parts[0] || '',
        city: parts[1] || '',
        state: parts[2] || '',
        zip: ''
    };
}