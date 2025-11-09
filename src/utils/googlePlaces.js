// file: /src/utils/googlePlaces.js v1 - Google Places API integration for server-side searches

/**
 * Search for businesses using Google Places API (Text Search)
 * @param {string} query - Search query (business name, type, etc.)
 * @param {number} lat - Latitude for location bias
 * @param {number} lng - Longitude for location bias
 * @param {number} radius - Search radius in meters (default 40234 = 25 miles)
 * @returns {Promise<Array>} Array of place results
 */
export async function searchGooglePlaces(query, lat = null, lng = null, radius = 40234) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Server-side API key

    if (!apiKey) {
        console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables');
        return [];
    }

    try {
        // Build the API URL
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?key=${apiKey}`;

        // Add query
        if (query && query.trim()) {
            url += `&query=${encodeURIComponent(query.trim())}`;
        }

        // Add location bias if coordinates provided
        if (lat && lng) {
            url += `&location=${lat},${lng}`;
            url += `&radius=${radius}`;
        }

        console.log('🔍 Google Places API Request:', { query, lat, lng, radius });

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
            console.log(`✅ Google Places returned ${data.results.length} results`);

            // Transform Google Places results to match your business schema
            const transformedResults = data.results.map(place => ({
                // Use a temporary ID that can be identified as Google Place
                _id: `google_${place.place_id}`,
                placeId: place.place_id,

                // Business info
                bname: place.name,
                address1: place.formatted_address || '',
                address2: '',
                city: extractCity(place),
                state: extractState(place),
                zip: extractZip(place),
                phone: place.formatted_phone_number || '',

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
            }));

            return transformedResults;
        } else if (data.status === 'ZERO_RESULTS') {
            console.log('ℹ️ Google Places returned zero results');
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