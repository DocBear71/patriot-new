import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    recurring: {
        type: Boolean,
        default: false
    },
    message: String,
    paymentMethod: {
        type: String,
        required: true
    },
    // Keep existing field for backwards compatibility
    paymentId: String,
    // Add new fields for API compatibility
    paymentIntentId: String,    // For Stripe payments
    paypalOrderId: String,      // For PayPal payments
    transactionId: String,
    status: {
        type: String,
        default: 'pending'
    },
    cancelledAt: Date,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: Date            // Add this for API compatibility
});

// Use your existing collection name
export default mongoose.models.Donation || mongoose.model('Donation', DonationSchema, 'donations');