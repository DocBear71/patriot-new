// file: /src/app/api/migrate-incentives/route.js v1 - API endpoint to run incentive migration
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';
import Incentive from '../../../models/Incentive.js';

export async function POST(request) {
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
        const logs = [];

        for (const incentive of allIncentives) {
            try {
                const log = {
                    id: incentive._id.toString(),
                    currentType: incentive.type || '(empty)',
                    currentCategories: incentive.eligible_categories || '(none)'
                };

                logs.push(`Processing incentive ID: ${log.id}`);
                logs.push(`  Current type: "${log.currentType}"`);
                logs.push(`  Current eligible_categories: ${log.currentCategories}`);

                // Skip if already has eligible_categories
                if (incentive.eligible_categories && incentive.eligible_categories.length > 0) {
                    logs.push(`  ⏭️  SKIP: Already has eligible_categories`);
                    skipped++;
                    continue;
                }

                // Determine the migration path
                let newCategories = [];

                if (incentive.type && incentive.type.trim() !== '') {
                    // Has a type field with a value - convert to array
                    newCategories = [incentive.type.toUpperCase()];
                    logs.push(`  🔄 Migrating type "${incentive.type}" to eligible_categories: [${newCategories.join(', ')}]`);
                } else {
                    // No type or empty type - this is a "not available" incentive
                    newCategories = ['NA'];
                    logs.push(`  🔄 Empty/blank type detected - setting eligible_categories: [${newCategories.join(', ')}] (Not Available)`);
                    logs.push(`  ℹ️  Note: This incentive has is_available: ${incentive.is_available}`);
                }

                // Update the incentive
                incentive.eligible_categories = newCategories;
                await incentive.save();

                logs.push(`  ✅ SUCCESS: Migrated to eligible_categories: [${newCategories.join(', ')}]`);
                migrated++;

            } catch (error) {
                logs.push(`  ❌ ERROR migrating incentive ${incentive._id}: ${error.message}`);
                errors++;
            }

            logs.push(''); // Empty line between incentives
        }

        // Summary
        const summary = {
            total: allIncentives.length,
            migrated,
            skipped,
            errors,
            success: errors === 0
        };

        return NextResponse.json({
            success: true,
            summary,
            logs
        });

    } catch (error) {
        console.error('❌ FATAL ERROR during migration:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}