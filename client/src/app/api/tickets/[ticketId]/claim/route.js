import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';
import { claimNFT } from '@/lib/blockchain';

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { ticketId } = await params;
        const { userWallet } = await req.json();

        if (!userWallet) {
            return NextResponse.json({ error: "User wallet address is required" }, { status: 400 });
        }

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        if (!ticket.custodial) {
            return NextResponse.json({ error: "Ticket already claimed to a private wallet" }, { status: 400 });
        }

        if (!ticket.tokenId) {
            return NextResponse.json({ error: "Ticket NFT not minted yet" }, { status: 400 });
        }

        // Call blockchain to transfer NFT
        try {
            await claimNFT(ticket.tokenId, userWallet);
        } catch (bcError) {
            console.error("Blockchain transfer failed:", bcError);
            return NextResponse.json({ error: "Blockchain transfer failed: " + bcError.message }, { status: 500 });
        }

        // Update DB
        ticket.custodial = false;
        ticket.ownerWallet = userWallet;
        await ticket.save();

        return NextResponse.json({
            success: true,
            message: "Ticket successfully transferred to your wallet!",
            ownerWallet: userWallet
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
