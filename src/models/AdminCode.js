
import mongoose from 'mongoose';

const AdminCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  expiration: Date,
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Use your existing collection name
export default mongoose.models.AdminCode || mongoose.model('AdminCode', AdminCodeSchema, 'admin_codes');