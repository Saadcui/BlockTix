import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";

export async function GET(req, {params}) {
  const { id }= await params;  
  try {
    await dbConnect();

    const event = await Event.findOne({eventId : id});  

    if (!event) {
      return NextResponse.json(event, { status: 200 });
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

// DELETE event
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    await Event.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
