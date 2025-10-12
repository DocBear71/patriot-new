// file: src/lib/mongodb.js v3 - Optimized for Vercel serverless with connection pooling and timeout handling

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI_PATRIOT;
const MONGODB_DB = process.env.MONGODB_DB_PATRIOT;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI_PATRIOT environment variable');
}

if (!MONGODB_DB) {
    throw new Error('Please define the MONGODB_DB_PATRIOT environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // If we have a cached connection and it's ready, return it
    if (cached.conn && mongoose.connection.readyState === 1) {
        console.log('✅ Using cached MongoDB connection');
        return cached.conn;
    }

    // If connection exists but is not ready, wait for it
    if (cached.conn && mongoose.connection.readyState === 2) {
        console.log('⏳ Waiting for existing connection to establish...');
        try {
            await cached.promise;
            return cached.conn;
        } catch (e) {
            console.error('❌ Existing connection failed:', e.message);
            cached.promise = null;
            cached.conn = null;
        }
    }

    // If we don't have a promise for a connection, create one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // CRITICAL: Disable mongoose buffering for serverless
            dbName: MONGODB_DB,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 8000, // Timeout after 8 seconds trying to select a server
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            // Add connection retry logic
            retryWrites: true,
            retryReads: true,
        };

        console.log('🔄 Creating new MongoDB connection to:', MONGODB_DB);

        cached.promise = mongoose.connect(MONGODB_URI, opts)
            .then((mongoose) => {
                console.log('✅ MongoDB connected successfully to:', MONGODB_DB);
                return mongoose;
            })
            .catch((error) => {
                console.error('❌ MongoDB connection error:', error.message);
                cached.promise = null; // Reset promise on error so next request can retry
                cached.conn = null;
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        cached.conn = null;
        console.error('❌ Failed to establish MongoDB connection:', e.message);
        throw e;
    }

    return cached.conn;
}

// Optional: Add connection event handlers for better debugging
mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('📴 Mongoose disconnected from MongoDB');
});

export default connectDB;