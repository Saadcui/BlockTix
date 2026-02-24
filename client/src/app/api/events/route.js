import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';

// GET all events
export async function GET() {
  try {
    await dbConnect();

    // Exclude soft-deleted events
    const events = await Event.find({ deleted: { $ne: true } }).lean(); 

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
