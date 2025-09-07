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
    paymentId: String,
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
    }
});

// Use your existing collection name
export default mongoose.models.Donation || mongoose.model('Donation', DonationSchema, 'donations');