// src/app/api/events/route.js
import connectDB from '@/lib/dbConnect'; // Adjust the import path as necessary
import mongoose from 'mongoose';

// Define Event model (matches your MongoDB collection)
const eventSchema = new mongoose.Schema({
  event: String,
  date: Date,
  time: String,
  location: String,
  category: String,
  price: Number,
  totalTickets: Number,
  image: String,
  organizerId: String,
  createdAt: Date,
  updatedAt: Date,
}, { collection: 'events' }); // ← Points to 'events' collection in 'test' DB

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export async function GET() {
  try {
    await connectDB();

    // Switch to the 'test' database (where your events are)
    const db = mongoose.connection.useDb('test');
    eventSchema.loadClass(class {
      get formattedDate() {
        return this.date.toLocaleDateString();
      }
      get formattedTime() {
        return this.time;
      }
    });

    const EventModel = db.model('Event', eventSchema);

    const events = await EventModel.find({}).lean(); // `.lean()` for faster performance

    return Response.json({ success: true, events });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}