import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';
import User from '@/models/User';

// GET all events
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get('organizerId');
    const includeAll = searchParams.get('includeAll') === '1';
    const adminId = searchParams.get('adminId');

    // Organizer view: allow fetching their own events (all statuses)
    if (organizerId) {
      const events = await Event.find({
        deleted: { $ne: true },
        organizerId,
      }).lean();
      return NextResponse.json({ success: true, events });
    }

    // Admin view: allow fetching all events (all statuses)
    if (includeAll) {
      if (!adminId) {
        return NextResponse.json({ success: false, error: 'adminId is required' }, { status: 400 });
      }
      const admin = await User.findOne({ firebase_uid: adminId }).lean();
      if (!admin || admin.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const events = await Event.find({ deleted: { $ne: true } }).lean();
      return NextResponse.json({ success: true, events });
    }

    // Exclude soft-deleted events
    // Only show approved events publicly. Legacy events without approvalStatus are treated as approved.
    const events = await Event.find({
      deleted: { $ne: true },
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
    }).lean(); 

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
