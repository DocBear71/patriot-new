// file: /src/app/api/places/route.js v1 - Next.js 13+ app router conversion for Google Places
import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Handle GET requests - Places search and details
 */
export async function GET(request) {
    try {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Check if it's a details request
        if (pathname.includes('/details/')) {
            const placeId = pathname.split('/details/')[1];
            return handlePlaceDetails(request, placeId);
        } else {
            // Handle search request
            return handlePlacesSearch(request);
        }
    } catch (error) {
        console.error('Places API error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error in Places API',
            error: error.message
        }, { status: 500 });
    }
}

/**
 * Handle Places search
 */
async function handlePlacesSearch(request) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('query');
        const latitude = url.searchParams.get('latitude');
        const longitude = url.searchParams.get('longitude');
        const radius = url.searchParams.get('radius') || 50000;
        const type = url.searchParams.get('type');

        if (!query) {
            return NextResponse.json({
                success: false,
                message: 'Query parameter is required'
            }, { status: 400 });
        }

        // Get API key from environment variables
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Google Maps API key is not configured');
            return NextResponse.json({
                success: false,
                message: 'Server configuration error: Google Maps API key is missing'
            }, { status: 500 });
        }

        // Log API key info for debugging (first 10 characters only)
        console.log("API Key length:", apiKey.length);
        console.log("API Key first 10 chars:", apiKey.slice(0, 10));

        // Build the Places API URL
        let searchUrl;
        if (latitude && longitude) {
            // If we have coordinates, use them to bias the search
            searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radius}&key=${apiKey}`;
        } else {
            // Otherwise just search by query
            searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
        }

        // Add type filter if specified
        if (type) {
            searchUrl += `&type=${type}`;
        }

        console.log(`Making Places API request with query: ${query}`);
        const response = await axios.get(searchUrl);

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            console.error(`Places API error: ${response.data.status}`);
            return NextResponse.json({
                success: false,
                message: `Places API error: ${response.data.status}`,
                error: response.data.error_message || 'Unknown error'
            }, { status: 400 });
        }

        // Process and return the results
        const places = response.data.results.map(place => ({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            },
            types: place.types,
            business_status: place.business_status,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            price_level: place.price_level,
            photos: place.photos ? place.photos.map(photo => ({
                photo_reference: photo.photo_reference,
                height: photo.height,
                width: photo.width
            })) : [],
            opening_hours: place.opening_hours ? {
                open_now: place.opening_hours.open_now
            } : null
        }));

        return NextResponse.json({
            success: true,
            results: places,
            next_page_token: response.data.next_page_token || null,
            status: response.data.status
        });

    } catch (error) {
        console.error('Places search error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error during places search',
            error: error.message
        }, { status: 500 });
    }
}

/**
 * Handle Place Details
 */
async function handlePlaceDetails(request, placeId) {
    try {
        if (!placeId) {
            return NextResponse.json({
                success: false,
                message: 'Place ID parameter is required'
            }, { status: 400 });
        }

        // Get API key from environment variables
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Google Maps API key is not configured');
            return NextResponse.json({
                success: false,
                message: 'Server configuration error: Google Maps API key is missing'
            }, { status: 500 });
        }

        // Use the Place Details API to get comprehensive information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,geometry,types,address_components,website,opening_hours,rating,user_ratings_total,reviews,photos&key=${apiKey}`;

        console.log(`Getting details for place ID: ${placeId}`);
        const response = await axios.get(detailsUrl);

        if (response.data.status !== 'OK') {
            console.error(`Place Details API error: ${response.data.status}`);
            return NextResponse.json({
                success: false,
                message: `Place Details API error: ${response.data.status}`,
                error: response.data.error_message || 'Unknown error'
            }, { status: 400 });
        }

        const place = response.data.result;

        // Process and structure the place details
        const placeDetails = {
            place_id: placeId,
            name: place.name,
            formatted_address: place.formatted_address,
            formatted_phone_number: place.formatted_phone_number,
            website: place.website,
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            },
            types: place.types,
            address_components: place.address_components,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            opening_hours: place.opening_hours ? {
                open_now: place.opening_hours.open_now,
                periods: place.opening_hours.periods,
                weekday_text: place.opening_hours.weekday_text
            } : null,
            photos: place.photos ? place.photos.map(photo => ({
                photo_reference: photo.photo_reference,
                height: photo.height,
                width: photo.width,
                html_attributions: photo.html_attributions
            })) : [],
            reviews: place.reviews ? place.reviews.map(review => ({
                author_name: review.author_name,
                author_url: review.author_url,
                language: review.language,
                profile_photo_url: review.profile_photo_url,
                rating: review.rating,
                relative_time_description: review.relative_time_description,
                text: review.text,
                time: review.time
            })) : []
        };

        return NextResponse.json({
            success: true,
            result: placeDetails
        });

    } catch (error) {
        console.error('Place details error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error getting place details',
            error: error.message
        }, { status: 500 });
    }
}

/**
 * Handle POST requests - Nearby search
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { latitude, longitude, radius = 1500, type, keyword } = body;

        if (!latitude || !longitude) {
            return NextResponse.json({
                success: false,
                message: 'Latitude and longitude are required'
            }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Google Maps API key is not configured');
            return NextResponse.json({
                success: false,
                message: 'Server configuration error: Google Maps API key is missing'
            }, { status: 500 });
        }

        // Build nearby search URL
        let nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${apiKey}`;

        if (type) {
            nearbyUrl += `&type=${type}`;
        }

        if (keyword) {
            nearbyUrl += `&keyword=${encodeURIComponent(keyword)}`;
        }

        console.log(`Making Nearby Search API request near: ${latitude},${longitude}`);
        const response = await axios.get(nearbyUrl);

        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
            console.error(`Nearby Search API error: ${response.data.status}`);
            return NextResponse.json({
                success: false,
                message: `Nearby Search API error: ${response.data.status}`,
                error: response.data.error_message || 'Unknown error'
            }, { status: 400 });
        }

        // Process results
        const places = response.data.results.map(place => ({
            place_id: place.place_id,
            name: place.name,
            vicinity: place.vicinity,
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            },
            types: place.types,
            business_status: place.business_status,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            price_level: place.price_level,
            opening_hours: place.opening_hours ? {
                open_now: place.opening_hours.open_now
            } : null
        }));

        return NextResponse.json({
            success: true,
            results: places,
            next_page_token: response.data.next_page_token || null,
            status: response.data.status
        });

    } catch (error) {
        console.error('Nearby search error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error during nearby search',
            error: error.message
        }, { status: 500 });
    }
}

/**
 * Handle PUT requests - Not supported
 */
export async function PUT(request) {
    return NextResponse.json({
        success: false,
        message: 'PUT method not supported for places API'
    }, { status: 405 });
}

/**
 * Handle DELETE requests - Not supported
 */
export async function DELETE(request) {
    return NextResponse.json({
        success: false,
        message: 'DELETE method not supported for places API'
    }, { status: 405 });
}