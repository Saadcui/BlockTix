//route for saving event

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';

export async function POST(req) {
    try{

        
        await dbConnect();
        const { event, date, time, location, category, price, totalTickets, image, organizerId, earlyBird } = await req.json();

        const newEvent = await Event.create({
        event,
        date,
        time,
        location,
        category,
        price,
        totalTickets,
        remainingTickets: totalTickets,
        image,
        organizerId,
        ...(earlyBird && typeof earlyBird === 'object' ? { earlyBird } : {})
        });

        return NextResponse.json({ message: 'Event created successfully' }, { status: 201 });
    } catch (error) {
        
        return NextResponse.json({ message: 'Error creating event' }, { status: 500 });
    }

}
