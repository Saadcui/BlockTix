import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';
import { verifyTicketQR } from '@/lib/qr';
import { redeemNFT } from '@/lib/blockchain';

export async function POST(req) {
    try {
        await dbConnect();
        const { qrToken } = await req.json();

        const decoded = verifyTicketQR(qrToken);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 400 });
        }

        const { ticketId, userId } = decoded;

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found in database" }, { status: 404 });
        }

        if (ticket.isRedeemed || ticket.status === "used") {
            return NextResponse.json({ error: "Ticket already redeemed" }, { status: 400 });
        }

        // Verify userId matches (optional, but good for security)
        if (ticket.userId !== userId) {
            return NextResponse.json({ error: "Owner mismatch" }, { status: 403 });
        }

        // Mark as redeemed in DB
        ticket.isRedeemed = true;
        ticket.status = "used";
        await ticket.save();

        // Mark as redeemed on blockchain (if minted)
        if (ticket.tokenId) {
            try {
                await redeemNFT(ticket.tokenId);
            } catch (bcError) {
                console.error("Blockchain redemption failed:", bcError);
                // We still allow entry if DB is updated, but log the error
            }
        }

        return NextResponse.json({
            success: true,
            message: "Ticket verified! Enjoy the event.",
            ticketId: ticket.ticketId
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
