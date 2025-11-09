// file: /src/app/api/migrate-chain-incentives/route.js v1 - API endpoint to migrate chain incentives
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';
import Chain from '../../../models/Chain.js';

export async function POST(request) {
    try {
        console.log('🔄 Starting chain incentives migration...\n');

        await connectDB();
        console.log('✅ Connected to database\n');

        // Get all chains
        const allChains = await Chain.find({});
        console.log(`📊 Found ${allChains.length} total chains\n`);

        let totalIncentives = 0;
        let migratedIncentives = 0;
        let skippedIncentives = 0;
        let errorIncentives = 0;
        let chainsUpdated = 0;
        const logs = [];

        for (const chain of allChains) {
            try {
                logs.push(`\n${'='.repeat(60)}`);
                logs.push(`Processing chain: ${chain.chain_name} (ID: ${chain._id})`);
                logs.push(`Total incentives in chain: ${chain.incentives ? chain.incentives.length : 0}`);

                if (!chain.incentives || chain.incentives.length === 0) {
                    logs.push(`  ⏭️  SKIP: No incentives to migrate`);
                    continue;
                }

                let chainModified = false;

                for (let i = 0; i < chain.incentives.length; i++) {
                    const incentive = chain.incentives[i];
                    totalIncentives++;

                    logs.push(`\n  Processing incentive ${i + 1}/${chain.incentives.length}`);
                    logs.push(`    Incentive ID: ${incentive._id}`);
                    logs.push(`    Current type: "${incentive.type || '(empty)'}"`);
                    logs.push(`    Current eligible_categories: ${incentive.eligible_categories || '(none)'}`);

                    // Skip if already has eligible_categories
                    if (incentive.eligible_categories && incentive.eligible_categories.length > 0) {
                        logs.push(`    ⏭️  SKIP: Already has eligible_categories`);
                        skippedIncentives++;
                        continue;
                    }

                    // Determine the migration path
                    let newCategories = [];

                    if (incentive.type && incentive.type.trim() !== '') {
                        // Has a type field with a value - convert to array
                        newCategories = [incentive.type.toUpperCase()];
                        logs.push(`    🔄 Migrating type "${incentive.type}" to eligible_categories: [${newCategories.join(', ')}]`);
                    } else {
                        // No type or empty type - this is a "not available" incentive
                        newCategories = ['NA'];
                        logs.push(`    🔄 Empty/blank type detected - setting eligible_categories: [${newCategories.join(', ')}] (Not Available)`);
                        logs.push(`    ℹ️  Note: This incentive has is_active: ${incentive.is_active}`);
                    }

                    // Update the incentive
                    chain.incentives[i].eligible_categories = newCategories;
                    chainModified = true;
                    migratedIncentives++;
                    logs.push(`    ✅ SUCCESS: Migrated to eligible_categories: [${newCategories.join(', ')}]`);
                }

                // Save the chain if any incentives were modified
                if (chainModified) {
                    try {
                        await chain.save();
                        chainsUpdated++;
                        logs.push(`\n  ✅ Chain "${chain.chain_name}" saved successfully`);
                    } catch (saveError) {
                        logs.push(`\n  ❌ ERROR saving chain "${chain.chain_name}": ${saveError.message}`);
                        errorIncentives++;
                    }
                }

            } catch (error) {
                logs.push(`\n❌ ERROR processing chain ${chain.chain_name}: ${error.message}`);
                errorIncentives++;
            }
        }

        // Summary
        logs.push('\n\n' + '='.repeat(60));
        logs.push('📊 MIGRATION SUMMARY');
        logs.push('='.repeat(60));
        logs.push(`Total chains processed: ${allChains.length}`);
        logs.push(`Total incentives found: ${totalIncentives}`);
        logs.push(`✅ Successfully migrated: ${migratedIncentives}`);
        logs.push(`⏭️  Skipped (already migrated): ${skippedIncentives}`);
        logs.push(`❌ Errors: ${errorIncentives}`);
        logs.push(`📝 Chains updated: ${chainsUpdated}`);
        logs.push('='.repeat(60));

        const summary = {
            totalChains: allChains.length,
            totalIncentives,
            migrated: migratedIncentives,
            skipped: skippedIncentives,
            errors: errorIncentives,
            chainsUpdated,
            success: errorIncentives === 0
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