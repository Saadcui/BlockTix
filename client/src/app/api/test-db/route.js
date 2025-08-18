import connectDB from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Mongoose readyState:', mongoose.connection.readyState);

    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return Response.json({
        message: 'Failed to connect to MongoDB',
        readyState: mongoose.connection.readyState,
        error: 'Check server logs for details',
      }, { status: 500 });
    }

    return Response.json({
      message: 'Connected to MongoDB!',
      connected: true,
      readyState: mongoose.connection.readyState,
    });
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return Response.json({ 
      message: 'Connection failed', 
      error: error.message 
    }, { status: 500 });
  }
}