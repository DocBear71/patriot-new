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

            // Fetch detailed information for each place to get address_components
            const detailedResults = await Promise.all(
                data.results.slice(0, 20).map(async (place) => {
                    // Get full details including address_components
                    const details = await getPlaceDetails(place.place_id);
                    if (details) {
                        // Merge the details with the original place data
                        return {
                            ...place,
                            // Override with detailed info
                            address_components_available: true,
                            detailedInfo: details
                        };
                    }
                    return place;
                })
            );

            return detailedResults.map(place => transformPlaceResult(place));
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
 * @param {Object} place - Raw Google Place result (may include detailedInfo)
 * @returns {Object} Transformed business object
 */
function transformPlaceResult(place) {
    let city = '';
    let state = '';
    let zip = '';
    let streetAddress = '';
    let phone = '';
    let businessType = '';

    // If we have detailed info from Place Details API, use it (most accurate)
    if (place.detailedInfo) {
        console.log('📍 Using detailed Place API data for:', place.name);
        city = place.detailedInfo.city || '';
        state = place.detailedInfo.state || '';
        zip = place.detailedInfo.zip || '';
        streetAddress = place.detailedInfo.address1 || '';
        phone = place.detailedInfo.phone || '';
    } else if (place.address_components && place.address_components.length > 0) {
        // Fallback: Use address_components if available
        console.log('📍 Using address_components for:', place.name);
        city = extractCityFromComponents(place.address_components);
        state = extractStateFromComponents(place.address_components);
        zip = extractZipFromComponents(place.address_components);
        streetAddress = extractStreetAddress(place.address_components);
        phone = place.formatted_phone_number || place.international_phone_number || '';
    } else {
        // Last resort: Parse formatted_address string
        console.log('📍 Parsing formatted_address for:', place.name);
        const addressParts = parseFormattedAddress(place.formatted_address || place.vicinity || '');
        city = addressParts.city;
        state = addressParts.state;
        zip = addressParts.zip;
        streetAddress = addressParts.street;
        phone = place.formatted_phone_number || place.international_phone_number || '';
    }

    // Map Google Place types to our business types
    businessType = mapGoogleTypeToBusinessType(place.types || []);

    console.log('✅ Transformed place:', {
        name: place.name,
        city,
        state,
        zip,
        type: businessType
    });

    return {
        _id: `google_${place.place_id}`,
        placeId: place.place_id,
        bname: place.name,
        address1: streetAddress || place.vicinity || '',
        address2: '',
        city: city,
        state: state,
        zip: zip,
        phone: phone,
        type: businessType,
        lat: place.geometry?.location?.lat || place.detailedInfo?.lat || 0,
        lng: place.geometry?.location?.lng || place.detailedInfo?.lng || 0,
        location: place.geometry?.location ? {
            type: 'Point',
            coordinates: [
                place.geometry.location.lng,
                place.geometry.location.lat
            ]
        } : null,
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || 0,
        types: place.types || [],
        business_status: place.business_status || 'OPERATIONAL',
        website: place.detailedInfo?.website || '',
        isGooglePlace: true,
        isFromDatabase: false,
        markerColor: 'nearby',
        google_place_id: place.place_id,
        incentives: [],
        hasIncentives: false,
        status: 'google_place'
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
 * Handles formats like:
 * - "4420 220th Trail, Amana, IA 52203, USA"
 * - "123 Main St, Cedar Rapids, IA 52402"
 * - "456 Oak Ave, Portland, OR"
 */
function parseFormattedAddress(formattedAddress) {
    console.log('🔍 Parsing formatted address:', formattedAddress);

    if (!formattedAddress) {
        console.log('⚠️ No address to parse');
        return { street: '', city: '', state: '', zip: '' };
    }

    const parts = formattedAddress.split(',').map(p => p.trim());
    console.log('📍 Address parts:', parts);

    // Common format: "Street, City, State Zip, Country" (4 parts)
    // Or: "Street, City, State Zip" (3 parts)
    if (parts.length >= 3) {
        const street = parts[0];
        const city = parts[1];

        // The state/zip is usually in position 2 (0-indexed)
        // Format: "IA 52203" or "Iowa 52203" or just "IA"
        const stateZipPart = parts[2];

        // Try multiple regex patterns for state + zip
        // Pattern 1: "IA 52203" (2-letter state code + 5-digit zip)
        let stateZipMatch = stateZipPart.match(/^\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/i);

        if (stateZipMatch) {
            const result = {
                street: street,
                city: city,
                state: stateZipMatch[1].toUpperCase(),
                zip: stateZipMatch[2]
            };
            console.log('✅ Parsed address (pattern 1):', result);
            return result;
        }

        // Pattern 2: Just state code "IA" (no zip in this part, check other parts)
        const stateOnlyMatch = stateZipPart.match(/^\s*([A-Z]{2})\s*$/i);
        if (stateOnlyMatch) {
            // Look for zip in remaining parts
            let zip = '';
            for (let i = 3; i < parts.length; i++) {
                const zipMatch = parts[i].match(/(\d{5}(?:-\d{4})?)/);
                if (zipMatch) {
                    zip = zipMatch[1];
                    break;
                }
            }

            const result = {
                street: street,
                city: city,
                state: stateOnlyMatch[1].toUpperCase(),
                zip: zip
            };
            console.log('✅ Parsed address (pattern 2 - state only):', result);
            return result;
        }

        // Pattern 3: Full state name "Iowa 52203"
        const fullStateMatch = stateZipPart.match(/^\s*([A-Za-z]+)\s+(\d{5}(?:-\d{4})?)/i);
        if (fullStateMatch) {
            const stateAbbr = getStateAbbreviation(fullStateMatch[1]);
            const result = {
                street: street,
                city: city,
                state: stateAbbr,
                zip: fullStateMatch[2]
            };
            console.log('✅ Parsed address (pattern 3 - full state name):', result);
            return result;
        }
    }

    // Fallback: Try to find state and zip anywhere in the string
    const fullMatch = formattedAddress.match(/,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/i);
    if (fullMatch) {
        const beforeMatch = formattedAddress.substring(0, formattedAddress.indexOf(fullMatch[0]));
        const addressParts = beforeMatch.split(',').map(p => p.trim());

        const result = {
            street: addressParts[0] || '',
            city: addressParts[addressParts.length - 1] || '',
            state: fullMatch[1].toUpperCase(),
            zip: fullMatch[2]
        };
        console.log('✅ Parsed address (fallback regex):', result);
        return result;
    }

    // Last resort fallback
    console.log('⚠️ Could not parse address, using fallback');
    return {
        street: parts[0] || '',
        city: parts[1] || '',
        state: '',
        zip: ''
    };
}

/**
 * Convert full state name to abbreviation
 */
function getStateAbbreviation(stateName) {
    const stateMap = {
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
        'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
        'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
        'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
        'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
        'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
        'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
        'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
        'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
        'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
        'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
    };

    const normalized = stateName.toLowerCase().trim();
    return stateMap[normalized] || stateName.toUpperCase().substring(0, 2);
}