import { geocodeAddress } from '../../../utils/geocoding.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address') || '52402';

        console.log('Testing geocoding with address:', address);

        const result = await geocodeAddress(address);

        return Response.json({
            success: !!result,
            address: address,
            result: result,
            apiKey: process.env.GEOCODING_API_KEY ? 'Using GEOCODING_API_KEY' : 'Using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
            keyExists: !!(process.env.GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}