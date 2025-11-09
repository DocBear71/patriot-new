import mongoose from 'mongoose';

// Preserve your exact existing Chain schema
const ChainSchema = new mongoose.Schema({
    chain_name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    business_type: {
        type: String,
        required: true,
        index: true
    },
    universal_incentives: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive'],
        index: true
    },

    // Corporate information (optional)
    corporate_info: {
        headquarters: String,
        website: String,
        phone: String,
        description: String
    },

    // Chain-wide incentives stored directly in the chain document
    incentives: [{
        // NEW: eligible_categories array for multi-category support
        eligible_categories: {
            type: [String],
            required: true,
            validate: {
                validator: function(categories) {
                    if (!categories || categories.length === 0) {
                        return false;
                    }
                    const validCategories = ['VT', 'AD', 'FR', 'SP', 'OT', 'NA', 'NC', 'WS', 'MR'];
                    return categories.every(cat => validCategories.includes(cat));
                },
                message: 'At least one valid category is required (VT, AD, FR, SP, OT, NA, NC, WS, MR)'
            }
        },
        // Keep old 'type' field for backward compatibility during migration
        type: {
            type: String,
            enum: ['VT', 'AD', 'FR', 'SP', 'OT', '', 'NC', 'WS', 'MR'],
            required: false
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        description: String,
        other_description: String, // For "OT" type
        information: String,
        discount_type: {
            type: String,
            default: 'percentage',
            enum: ['percentage', 'dollar']
        },
        is_active: {
            type: Boolean,
            default: true,
            index: true
        },
        created_date: {
            type: Date,
            default: Date.now
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Metadata
    created_date: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_date: {
        type: Date,
        default: Date.now
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Preserve your existing indexes
ChainSchema.index({ chain_name: 1, status: 1 });
ChainSchema.index({ business_type: 1, status: 1 });
ChainSchema.index({ 'incentives.type': 1, 'incentives.is_active': 1 });

// Preserve your existing virtual and methods
ChainSchema.virtual('location_count', {
    ref: 'Business',
    localField: '_id',
    foreignField: 'chain_id',
    count: true
});

ChainSchema.set('toJSON', { virtuals: true });
ChainSchema.set('toObject', { virtuals: true });

// Preserve your existing instance methods
ChainSchema.methods.getActiveIncentives = function() {
    return this.incentives.filter(incentive => incentive.is_active !== false);
};

ChainSchema.methods.addIncentive = function(incentiveData) {
    this.incentives.push({
        ...incentiveData,
        created_date: new Date(),
        is_active: true
    });
    this.updated_date = new Date();
    return this.save();
};

ChainSchema.methods.removeIncentive = function(incentiveId) {
    this.incentives.id(incentiveId).remove();
    this.updated_date = new Date();
    return this.save();
};

// Preserve your existing static methods
ChainSchema.statics.findByName = function(name) {
    return this.findOne({
        chain_name: { $regex: new RegExp(`^${name}$`, 'i') },
        status: 'active'
    });
};

ChainSchema.statics.searchByName = function(name) {
    return this.find({
        chain_name: { $regex: new RegExp(name, 'i') },
        status: 'active'
    }).sort({ chain_name: 1 });
};

ChainSchema.statics.getWithLocationCounts = async function(query = {}) {
    const chains = await this.find({ ...query, status: 'active' })
        .sort({ chain_name: 1 })
        .lean();

    const Business = mongoose.model('Business');

    return Promise.all(
        chains.map(async (chain) => {
            const locationCount = await Business.countDocuments({chain_id: chain._id});
            const universalEnabledCount = await Business.countDocuments({
                chain_id: chain._id,
                universal_incentives: true
            });

            return {
                ...chain,
                location_count: locationCount,
                universal_enabled_count: universalEnabledCount,
                incentive_count: chain.incentives ?
                    chain.incentives.filter(i => i.is_active !== false).length : 0,
                needs_sync: locationCount > 0 && universalEnabledCount < locationCount
            };
        })
    );
};

// Preserve your existing pre-save middleware
ChainSchema.pre('save', function() {
    this.updated_date = new Date();
});

// Use your existing collection name
export default mongoose.models.Chain || mongoose.model('Chain', ChainSchema, 'patriot_thanks_chains');