// file: /scripts/migrate-incentives.js v2 - Migration script to convert type field to eligible_categories array
// Run this once to migrate existing incentives from old format to new format

// Load environment variables from .env.local
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the project root
config({ path: join(__dirname, '..', '.env.local') });

console.log('🔧 Environment loaded');
console.log(`📍 MongoDB URI exists: ${process.env.MONGODB_URI_PATRIOT ? 'Yes' : 'No'}\n`);

import connectDB from '../src/lib/mongodb.js';
import Incentive from '../src/models/Incentive.js';

async function migrateIncentives() {
    try {
        console.log('🔄 Starting incentive migration...\n');

        await connectDB();
        console.log('✅ Connected to database\n');

        // Get all incentives
        const allIncentives = await Incentive.find({});
        console.log(`📊 Found ${allIncentives.length} total incentives\n`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const incentive of allIncentives) {
            try {
                console.log(`\n Processing incentive ID: ${incentive._id}`);
                console.log(`   Current type: "${incentive.type || '(empty)'}"`);
                console.log(`   Current eligible_categories: ${incentive.eligible_categories || '(none)'}`);

                // Skip if already has eligible_categories
                if (incentive.eligible_categories && incentive.eligible_categories.length > 0) {
                    console.log(`   ⏭️  SKIP: Already has eligible_categories`);
                    skipped++;
                    continue;
                }

                // Determine the migration path
                let newCategories = [];

                if (incentive.type && incentive.type.trim() !== '') {
                    // Has a type field with a value - convert to array
                    newCategories = [incentive.type.toUpperCase()];
                    console.log(`   🔄 Migrating type "${incentive.type}" to eligible_categories: [${newCategories.join(', ')}]`);
                } else {
                    // No type or empty type - this is a "not available" incentive
                    // For "not available" incentives, we'll set a default category
                    // since the validation requires at least one category
                    newCategories = ['NA']; // Not Available
                    console.log(`   🔄 Empty/blank type detected - setting eligible_categories: [${newCategories.join(', ')}] (Not Available)`);
                    console.log(`   ℹ️  Note: This incentive has is_available: ${incentive.is_available}`);
                }

                // Update the incentive
                incentive.eligible_categories = newCategories;
                await incentive.save();

                console.log(`   ✅ SUCCESS: Migrated to eligible_categories: [${newCategories.join(', ')}]`);
                migrated++;

            } catch (error) {
                console.error(`   ❌ ERROR migrating incentive ${incentive._id}:`, error.message);
                errors++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total incentives: ${allIncentives.length}`);
        console.log(`✅ Successfully migrated: ${migrated}`);
        console.log(`⏭️  Skipped (already migrated): ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('='.repeat(60));

        if (errors === 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n📝 Next steps:');
            console.log('   1. Verify the migrated data in your database');
            console.log('   2. Test the application to ensure everything works');
            console.log('   3. Once confirmed, you can optionally remove the old "type" field');
        } else {
            console.log('\n⚠️  Migration completed with errors. Please review the errors above.');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ FATAL ERROR during migration:', error);
        process.exit(1);
    }
}

// Run the migration
migrateIncentives();