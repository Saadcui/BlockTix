import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { eventId } = await params;

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Standard OpenSea/ERC721 Metadata format
        const metadata = {
            name: `${event.event} Ticket`,
            description: `Official ticket for ${event.event} at ${event.location} on ${new Date(event.date).toLocaleDateString()}.`,
            image: event.image || "https://blocktix.platform/default-ticket.png",
            attributes: [
                { trait_type: "Event", value: event.event },
                { trait_type: "Location", value: event.location },
                { trait_type: "Date", value: new Date(event.date).toLocaleDateString() },
                { trait_type: "Time", value: event.time },
                { trait_type: "Category", value: event.category }
            ]
        };

        return NextResponse.json(metadata);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
