import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';
import User from '@/models/User';

export const runtime = 'nodejs';

async function requireAdmin(adminId) {
  if (!adminId) {
    return { ok: false, res: NextResponse.json({ error: 'adminId is required' }, { status: 400 }) };
  }

  const admin = await User.findOne({ firebase_uid: adminId }).lean();
  if (!admin || admin.role !== 'admin') {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, admin };
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');

    const adminCheck = await requireAdmin(adminId);
    if (!adminCheck.ok) return adminCheck.res;

    const pending = await Event.find({
      deleted: { $ne: true },
      approvalStatus: 'pending',
    })
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    const organizerIds = Array.from(new Set(pending.map((e) => e.organizerId).filter(Boolean)));
    const organizers = organizerIds.length
      ? await User.find({ firebase_uid: { $in: organizerIds } })
          .select('firebase_uid name email')
          .lean()
      : [];

    const organizerMap = new Map(organizers.map((o) => [o.firebase_uid, o]));

    const events = pending.map((e) => ({
      ...e,
      organizer: organizerMap.get(e.organizerId) || null,
    }));

    return NextResponse.json({ success: true, events }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();

    const { adminId, eventId, action, rejectionReason } = await req.json();

    const adminCheck = await requireAdmin(adminId);
    if (!adminCheck.ok) return adminCheck.res;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event || event.deleted) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Idempotent transitions
    if (action === 'approve') {
      event.approvalStatus = 'approved';
      event.approvedAt = new Date();
      event.approvedBy = adminId;
      event.rejectedAt = null;
      event.rejectedBy = null;
      event.rejectionReason = null;
    } else {
      event.approvalStatus = 'rejected';
      event.rejectedAt = new Date();
      event.rejectedBy = adminId;
      event.rejectionReason = rejectionReason ? String(rejectionReason).slice(0, 500) : 'Rejected by admin';
      event.approvedAt = null;
      event.approvedBy = null;
    }

    await event.save();

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
