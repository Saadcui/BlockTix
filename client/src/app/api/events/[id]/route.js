import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import Ticket from "@/models/Ticket";

export async function GET(req, {params}) {
  const { id }= await params;  
  try {
    await dbConnect();

    // Only fetch non-deleted events
    const event = await Event.findOne({
      eventId: id,
      deleted: { $ne: true }
    });  

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// UPDATE event

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const body = await req.json();
    const updatedEvent = await Event.findByIdAndUpdate(params.id, body, { new: true });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

// DELETE event (soft delete)
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Find event by eventId or _id
    const event = await Event.findOne({
      $or: [
        { eventId: id },
        { _id: id }
      ]
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // Check if event has any tickets
    const ticketCount = await Ticket.countDocuments({ eventId: event._id });
    if (ticketCount > 0) {
      // Soft delete instead of hard delete
      event.deleted = true;
      event.deletedAt = new Date();
      await event.save();
      
      return NextResponse.json({ 
        success: true, 
        message: `Event soft-deleted. ${ticketCount} ticket(s) still exist for this event.`,
        softDeleted: true
      });
    }

    // If no tickets exist, we can hard delete
    await Event.findByIdAndDelete(event._id);
    return NextResponse.json({ success: true, message: "Event deleted permanently" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, error: error.message || "Delete failed" }, { status: 500 });
  }
}
