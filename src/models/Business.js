import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
    // Preserve your existing field names exactly
    bname: {
        type: String,
        required: true,
        trim: true
    },
    address1: {
        type: String,
        required: true
    },
    address2: String,
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        required: true
    },
    phone: String,
    type: {
        type: String,
        required: true
    },

    // Preserve existing status and metadata fields
    status: {
        type: String,
        default: 'active'
    },
    created_by: String,
    updated_by: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },

    // Preserve existing geospatial location (exactly as you have it)
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },

    // Preserve existing chain-related fields
    chain_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chain',
        default: null
    },
    chain_name: String,
    is_chain_location: Boolean, // Based on your actual data

    // NEW: Additional modern fields
    contact: {
        email: String,
        website: String,
        socialMedia: {
            facebook: String,
            instagram: String,
            twitter: String
        }
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    slug: String,
    description: String,
    images: [String],

    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    }
});

// Preserve your existing index
BusinessSchema.index(
    { location: '2dsphere' },
    { partialFilterExpression: { 'location.type': 'Point' } }
);

// Additional indexes
BusinessSchema.index({ bname: 1, city: 1, state: 1 });
BusinessSchema.index({ type: 1, status: 1 });
BusinessSchema.index({ chain_id: 1 });

// Update timestamp before saving
BusinessSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema, 'business');