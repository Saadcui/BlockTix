import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';

// GET /api/tickets/resale - Get all tickets listed for resale
export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");

        // Build query
        const query = { 
            isForResale: true,
            status: 'valid',
            isRedeemed: false
        };

        if (eventId) {
            query.eventId = eventId;
        }

        const resaleTickets = await Ticket.find(query)
            .populate({
                path: 'eventId',
                select: 'event date time location price image organizerId category resaleCapEnabled resaleCapPercent',
                match: { deleted: { $ne: true } } // Exclude soft-deleted events
            })
            .sort({ createdAt: -1 });
        
        // Filter out tickets where event was deleted
        const validTickets = resaleTickets.filter(ticket => ticket.eventId !== null);

        return NextResponse.json({ 
            tickets: validTickets,
            count: validTickets.length
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching resale tickets:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
