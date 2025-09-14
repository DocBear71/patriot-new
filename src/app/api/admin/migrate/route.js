import { NextResponse } from 'next/server';
import { validateDataStructure, migrateUserPasswords, addBusinessGeolocation } from '../../../../lib/migration-utils';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'validate':
                const validation = await validateDataStructure();
                return NextResponse.json(validation);

            case 'migrate-passwords':
                const passwordResults = await migrateUserPasswords();
                return NextResponse.json(passwordResults);

            case 'migrate-geolocation':
                const geoResults = await addBusinessGeolocation();
                return NextResponse.json(geoResults);

            default:
                return NextResponse.json({
                    error: 'Invalid action',
                    availableActions: ['validate', 'migrate-passwords', 'migrate-geolocation']
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: 'Migration failed', details: error.message },
            { status: 500 }
        );
    }
}