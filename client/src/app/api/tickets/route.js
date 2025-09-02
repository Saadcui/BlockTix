import { NextResponse } from 'next/server';
import Event from "@/models/Event";
import Ticket from "@/models/Ticket";
import dbConnect from '@/lib/dbConnect';


//route for creating tickets
export async function POST(req) {
  try {
    await dbConnect();

    const { eventId, userId } = await req.json();

  
    const event = await Event.findById(eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

   
    if (event.remainingTickets <= 0) {
      return new Response(JSON.stringify({ error: "Tickets sold out" }), { status: 400 });
    }

    const ticket = new Ticket({
      eventId: event._id,
      userId, 
    });
    await ticket.save();

    event.remainingTickets -= 1;
    await event.save();

    return new Response(JSON.stringify({ success: true, ticket }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}


//route for getting tickets
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); 


    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const tickets = await Ticket.find({ userId })
      .populate("eventId", "event date time location price image remainingTickets") 
      .sort({ createdAt: -1 }); 

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}