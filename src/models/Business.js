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
    google_place_id: String,
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

    // Veteran-Owned Business Status - Enhanced with multiple owners
    veteranOwned: {
        isVeteranOwned: {
            type: Boolean,
            default: false
        },
        verificationStatus: {
            type: String,
            enum: ['self_attested', 'pending_verification', 'verified', 'certified', 'denied'],
            default: 'self_attested'
        },
        verificationDate: Date,

        // Multiple owners support
        owners: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            ownerName: String,
            ownershipPercentage: Number,
            isPrimaryContact: Boolean,
            verificationStatus: String,
            addedDate: Date
        }],

        // Primary owner (for backwards compatibility and quick access)
        primaryOwnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        displayBadge: {
            type: Boolean,
            default: true
        },

        // Badge level based on verification
        badgeLevel: {
            type: String,
            enum: ['bronze', 'silver', 'gold', 'platinum'],
            default: 'bronze' // bronze = self-attested, silver = verified, gold = certified, platinum = SBA certified
        },

        certifications: {
            sba_vosb: Boolean, // SBA Veteran-Owned Small Business
            sba_sdvosb: Boolean, // Service-Disabled Veteran-Owned Small Business
            certificationNumber: String,
            certificationDate: Date,
            expirationDate: Date
        },

        verificationNotes: String,

        // Priority and featured placement
        priority: {
            isPriority: {
                type: Boolean,
                default: true // Auto-enabled for verified veteran-owned
            },
            isFeatured: {
                type: Boolean,
                default: false // Admin can enable
            },
            featuredUntil: Date,
            priorityScore: {
                type: Number,
                default: 10 // Higher score = higher in search results
            }
        },

        // Ownership transfer history
        ownershipHistory: [{
            previousOwnerId: mongoose.Schema.Types.ObjectId,
            newOwnerId: mongoose.Schema.Types.ObjectId,
            transferDate: Date,
            transferReason: String,
            approvedBy: mongoose.Schema.Types.ObjectId
        }]
    },

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

// Enhanced indexes for veteran-owned businesses
BusinessSchema.index({ 'veteranOwned.isVeteranOwned': 1, 'veteranOwned.priority.isPriority': -1 });
BusinessSchema.index({ 'veteranOwned.priority.isFeatured': 1, 'veteranOwned.priority.featuredUntil': -1 });
BusinessSchema.index({ 'veteranOwned.badgeLevel': 1 });

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