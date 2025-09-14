import connectDB from './mongodb.js';
import { User, Business, Incentive, Chain, AdminCode, Donation } from '../models/index';

/**
 * Validate existing data structure
 */
export async function validateDataStructure() {
    await connectDB();

    const report = {
        timestamp: new Date().toISOString(),
        collections: {}
    };

    // Check Users collection
    try {
        const sampleUser = await User.findOne().lean();
        const userCount = await User.countDocuments();

        report.collections.users = {
            count: userCount,
            sampleFields: sampleUser ? Object.keys(sampleUser) : [],
            status: 'success'
        };
    } catch (error) {
        report.collections.users = {
            status: 'error',
            error: error.message
        };
    }

    // Check Business collection
    try {
        const sampleBusiness = await Business.findOne().lean();
        const businessCount = await Business.countDocuments();

        report.collections.businesses = {
            count: businessCount,
            sampleFields: sampleBusiness ? Object.keys(sampleBusiness) : [],
            status: 'success'
        };
    } catch (error) {
        report.collections.businesses = {
            status: 'error',
            error: error.message
        };
    }

    // Check Incentives collection
    try {
        const sampleIncentive = await Incentive.findOne().lean();
        const incentiveCount = await Incentive.countDocuments();

        report.collections.incentives = {
            count: incentiveCount,
            sampleFields: sampleIncentive ? Object.keys(sampleIncentive) : [],
            status: 'success'
        };
    } catch (error) {
        report.collections.incentives = {
            status: 'error',
            error: error.message
        };
    }

    // Check Chains collection
    try {
        const sampleChain = await Chain.findOne().lean();
        const chainCount = await Chain.countDocuments();

        report.collections.chains = {
            count: chainCount,
            sampleFields: sampleChain ? Object.keys(sampleChain) : [],
            status: 'success'
        };
    } catch (error) {
        report.collections.chains = {
            status: 'error',
            error: error.message
        };
    }

    return report;
}

/**
 * Migrate user passwords to bcrypt (if needed)
 */
export async function migrateUserPasswords() {
    await connectDB();

    // Find users with non-bcrypt passwords (bcrypt hashes start with $2)
    const usersNeedingMigration = await User.find({
        password: { $not: /^\$2[aby]\$/ }
    });

    console.log(`Found ${usersNeedingMigration.length} users needing password migration`);

    const results = {
        total: usersNeedingMigration.length,
        migrated: 0,
        errors: []
    };

    for (const user of usersNeedingMigration) {
        try {
            // The pre-save middleware will automatically hash the password
            user.markModified('password'); // Force mongoose to hash it
            await user.save();
            results.migrated++;
        } catch (error) {
            results.errors.push({
                userId: user._id,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Add missing geolocation data to businesses
 */
export async function addBusinessGeolocation() {
    await connectDB();

    // Find businesses without location coordinates
    const businessesNeedingGeo = await Business.find({
        $or: [
            { 'location.coordinates': { $exists: false } },
            { 'location.coordinates': null },
            { 'location.coordinates': [] }
        ]
    });

    console.log(`Found ${businessesNeedingGeo.length} businesses needing geolocation`);

    const results = {
        total: businessesNeedingGeo.length,
        processed: 0,
        errors: []
    };

    for (const business of businessesNeedingGeo) {
        try {
            // Set up the location structure if it doesn't exist
            if (!business.location) {
                business.location = {
                    type: 'Point',
                    coordinates: [0, 0] // Default coordinates - you'd replace with real geocoding
                };
            }

            await business.save();
            results.processed++;
        } catch (error) {
            results.errors.push({
                businessId: business._id,
                error: error.message
            });
        }
    }

    return results;
}