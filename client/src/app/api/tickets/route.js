import { NextResponse } from 'next/server';
import Event from "@/models/Event";
import Ticket from "@/models/Ticket";
import dbConnect from '@/lib/dbConnect';
import { mintTicketNFT } from '@/lib/blockchain';


//route for creating tickets
export async function POST(req) {
  try {
    await dbConnect();

    const { eventId, userId } = await req.json();


    const event = await Event.findById(eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }
    let ticketPrice = event.price; // default regular price
    if (
      event.earlyBird?.enabled &&
      new Date() <= new Date(event.earlyBird.endDate) &&
      event.earlyBird.soldCount < event.earlyBird.maxTickets
    ) {
      ticketPrice = event.earlyBird.discountPrice;
      event.earlyBird.soldCount += 1; // track early bird sales
    }


    if (event.remainingTickets <= 0) {
      return new Response(JSON.stringify({ error: "Tickets sold out" }), { status: 400 });
    }

    const platformWallet = process.env.PLATFORM_CUSTODY_ADDRESS;

    // Mint the NFT
    let mintResult = { txHash: null, tokenId: null };
    try {
      // Internal metadata URL that serves JSON for the NFT
      const metadataUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tickets/metadata/${eventId}`;
      mintResult = await mintTicketNFT(platformWallet, metadataUri);
    } catch (mintError) {
      console.error("Minting failed:", mintError);
      // We still create the ticket but mark it as failed/pending
    }

    const ticket = new Ticket({
      eventId: event._id,
      userId,
      tokenId: mintResult.tokenId,
      txHash: mintResult.txHash,
      mintStatus: mintResult.tokenId ? "minted" : "failed",
      custodial: true,
      ownerWallet: platformWallet
    });
    await ticket.save();

    event.remainingTickets -= 1;
    event.earlyBird.soldCount = (event.earlyBird.soldCount || 0) + 1; // increment sold count

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