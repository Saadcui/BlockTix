import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';

// POST /api/tickets/[ticketId]/resale
// body { action: 'list', price: 100 } OR { action: 'buy', buyerId: '...' }
export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { ticketId } = await params;
        const { action, price, buyerId } = await req.json();

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // If it's not custodial, we need to return it to custody before listing
        if (action === 'list' && !ticket.custodial) {
            try {
                const { returnToCustody } = require('@/lib/blockchain');
                await returnToCustody(ticket.tokenId);
                ticket.custodial = true;
                ticket.ownerWallet = process.env.PLATFORM_CUSTODY_ADDRESS;
            } catch (err) {
                return NextResponse.json({ error: "Failed to return ticket to platform for resale: " + err.message }, { status: 500 });
            }
        }

        if (action === 'list') {
            if (ticket.status !== 'valid' || ticket.isRedeemed) {
                return NextResponse.json({ error: "Cannot list used or invalid ticket" }, { status: 400 });
            }
            ticket.isForResale = true;
            ticket.resalePrice = price;
            await ticket.save();
            return NextResponse.json({ success: true, message: "Ticket listed for resale" }, { status: 200 });
        }

        else if (action === 'buy') {
            if (!ticket.isForResale) {
                return NextResponse.json({ error: "Ticket is not for sale" }, { status: 400 });
            }
            if (!buyerId) {
                return NextResponse.json({ error: "Buyer info missing" }, { status: 400 });
            }

            // Logic for payment should be here (Stripe/Internal balances)
            // Assuming payment is successful for this step

            // Transfer ownership internally
            ticket.userId = buyerId;
            ticket.isForResale = false;
            ticket.resalePrice = null;
            // ownerWallet remains PLATFORM_CUSTODY_WALLET since it's custodial

            await ticket.save();

            return NextResponse.json({
                success: true,
                message: "Ticket purchased successfully! Ownership transferred.",
                ticket
            }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
