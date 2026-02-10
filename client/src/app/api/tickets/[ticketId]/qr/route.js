import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';
import { generateTicketQR } from '@/lib/qr';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { ticketId } = await params;

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // Generate a fresh signed QR code
        const qrToken = generateTicketQR(ticket.ticketId, ticket.userId);

        return NextResponse.json({ qrCode: qrToken }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
