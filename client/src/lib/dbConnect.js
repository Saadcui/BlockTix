import mongoose from 'mongoose';
import dns from 'dns';


dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable in .env');
}

/**
 * Using a global variable to prevent multiple connections 
 * during hot reloads in development (npm run dev).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents the 10-second hang if connection fails
      family: 4,             // Forces IPv4 to avoid resolution issues on some local networks
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Database connection error:', e.message);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;