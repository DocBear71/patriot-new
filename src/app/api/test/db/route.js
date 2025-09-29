import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import { User, Business, Incentive, Chain } from '../../../../models';

export async function GET() {
    try {
        // Connect to database
        await connectDB();

        // Test each model with a simple count query
        const results = {
            timestamp: new Date().toISOString(),
            database: process.env.MONGODB_DB,
            tests: {}
        };

        // Test User model
        try {
            const userCount = await User.countDocuments();
            results.tests.users = {
                status: 'success',
                count: userCount,
                collection: 'users'
            };
        } catch (error) {
            results.tests.users = {
                status: 'error',
                error: error.message
            };
        }

        // Test Business model
        try {
            const businessCount = await Business.countDocuments();
            results.tests.businesses = {
                status: 'success',
                count: businessCount,
                collection: 'business'
            };
        } catch (error) {
            results.tests.businesses = {
                status: 'error',
                error: error.message
            };
        }

        // Test Incentive model
        try {
            const incentiveCount = await Incentive.countDocuments();
            results.tests.incentives = {
                status: 'success',
                count: incentiveCount,
                collection: 'incentives'
            };
        } catch (error) {
            results.tests.incentives = {
                status: 'error',
                error: error.message
            };
        }

        // Test Chain model
        try {
            const chainCount = await Chain.countDocuments();
            results.tests.chains = {
                status: 'success',
                count: chainCount,
                collection: 'patriot_thanks_chains'
            };
        } catch (error) {
            results.tests.chains = {
                status: 'error',
                error: error.message
            };
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('Database test failed:', error);
        return NextResponse.json(
            {
                error: 'Database connection failed',
                details: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}