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

