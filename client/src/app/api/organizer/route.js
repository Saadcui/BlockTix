//route for saving event

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';

export async function POST(req) {
    try{

        
        await dbConnect();
        const { event, date, time, location, latitude, longitude, category, price, totalTickets, image, organizerId, earlyBird, resaleCapEnabled, resaleCapPercent } = await req.json();

        const newEvent = await Event.create({
        event,
        date,
        time,
        location,
        latitude,
        longitude,
        category,
        price,
        totalTickets,
        remainingTickets: totalTickets,
        image,
                organizerId,
                resaleCapEnabled: !!resaleCapEnabled,
                resaleCapPercent: Number.isFinite(Number(resaleCapPercent))
                    ? Math.max(0, Math.min(1000, Number(resaleCapPercent)))
                    : 0,
        approvalStatus: 'pending',
        submittedAt: new Date(),
        ...(earlyBird && typeof earlyBird === 'object' ? { earlyBird } : {})
        });

        return NextResponse.json({ message: 'Event created successfully' }, { status: 201 });
    } catch (error) {
        
        return NextResponse.json({ message: 'Error creating event' }, { status: 500 });
    }

}
