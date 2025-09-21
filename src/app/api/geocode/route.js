// file: /src/app/api/geocode/route.js v1 - Next.js 13+ app router conversion for geocoding
import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Handle GET requests - Geocode address to coordinates
 */
export async function GET(request) {
    try {
        const url = new URL(request.url);
        const address = url.searchParams.get('address');

        if (!address) {
            return NextResponse.json({
                success: false,
                message: 'Address parameter is required'
            }, { status: 400 });
        }

        // Use Google Maps Geocoding API
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

        const encodedAddress = encodeURIComponent(address);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

        console.log(`Geocoding address: ${address}`);

        const response = await axios.get(geocodeUrl);

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            const formattedAddress = response.data.results[0].formatted_address;
            const addressComponents = response.data.results[0].address_components;

            return NextResponse.json({
                success: true,
                location: {
                    lat: location.lat,
                    lng: location.lng
                },
                formatted_address: formattedAddress,
                address_components: addressComponents,
                place_id: response.data.results[0].place_id
            });
        } else {
            console.warn(`Geocoding failed with status: ${response.data.status}`);
            return NextResponse.json({
                success: false,
                message: `Geocoding failed: ${response.data.status}`,
                error: response.data.error_message || 'No results found'
            }, { status: 404 });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error while geocoding address',
            error: error.message
        }, { status: 500 });
    }
}

/**
 * Handle POST requests - Batch geocoding
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { addresses } = body;

        if (!addresses || !Array.isArray(addresses)) {
            return NextResponse.json({
                success: false,
                message: 'Addresses array is required'
            }, { status: 400 });
        }

        if (addresses.length > 10) {
            return NextResponse.json({
                success: false,
                message: 'Maximum 10 addresses allowed per batch request'
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

        console.log(`Batch geocoding ${addresses.length} addresses`);

        const results = await Promise.all(
            addresses.map(async (address, index) => {
                try {
                    const encodedAddress = encodeURIComponent(address);
                    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

                    const response = await axios.get(geocodeUrl);

                    if (response.data.status === 'OK' && response.data.results.length > 0) {
                        const location = response.data.results[0].geometry.location;
                        const formattedAddress = response.data.results[0].formatted_address;

                        return {
                            index,
                            original_address: address,
                            success: true,
                            location: {
                                lat: location.lat,
                                lng: location.lng
                            },
                            formatted_address: formattedAddress,
                            place_id: response.data.results[0].place_id
                        };
                    } else {
                        return {
                            index,
                            original_address: address,
                            success: false,
                            error: `Geocoding failed: ${response.data.status}`
                        };
                    }
                } catch (error) {
                    return {
                        index,
                        original_address: address,
                        success: false,
                        error: error.message
                    };
                }
            })
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return NextResponse.json({
            success: true,
            message: `Batch geocoding completed: ${successCount} successful, ${failureCount} failed`,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failureCount
            }
        });

    } catch (error) {
        console.error('Batch geocoding error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server error during batch geocoding',
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
        message: 'PUT method not supported for geocode API'
    }, { status: 405 });
}

/**
 * Handle DELETE requests - Not supported
 */
export async function DELETE(request) {
    return NextResponse.json({
        success: false,
        message: 'DELETE method not supported for geocode API'
    }, { status: 405 });
}