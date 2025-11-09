import mongoose from 'mongoose';

const IncentiveSchema = new mongoose.Schema({
    // Preserve your existing field structure exactly
    business_id: {
        type: String, // This is String in your database, not ObjectId
        required: true,
        index: true
    },
    is_available: {
        type: Boolean,
        default: true
    },
    // UPDATED: Changed from single type to array of eligible categories
    eligible_categories: {
        type: [String],
        required: true,
        validate: {
            validator: function(categories) {
                if (!categories || categories.length === 0) {
                    return false;
                }
                const validCategories = ['VT', 'AD', 'FR', 'SP', 'OT', 'NA', 'NC'];
                return categories.every(cat => validCategories.includes(cat));
            },
            message: 'At least one valid category is required (VT, AD, FR, SP, OT, NA, NC)'
        }
    },
    // Keep old 'type' field for backward compatibility during migration
    type: {
        type: String,
        enum: ['VT', 'AD', 'FR', 'SP', 'OT', '', 'NC'],
        required: false
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    information: String,
    other_description: {
        type: String,
        default: ''
    },

    // Preserve existing metadata fields
    created_by: String, // Can be String or ObjectId based on your usage
    updated_by: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
IncentiveSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Indexes for efficient querying
IncentiveSchema.index({ business_id: 1, is_available: 1 });
IncentiveSchema.index({ type: 1, is_available: 1 });

export default mongoose.models.Incentive || mongoose.model('Incentive', IncentiveSchema, 'incentives');