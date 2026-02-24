import { NextResponse } from 'next/server';
import Event from "@/models/Event";
import Ticket from "@/models/Ticket";
import dbConnect from '@/lib/dbConnect';
import { mintTicketNFT } from '@/lib/blockchain';
import User from '@/models/User';


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
    let royaltyBps = 500; // 5% default (basis points)

    // Organizer wallet (optional) — used for on-chain ERC-2981 receiver and off-chain royalty ledger.
    let organizerWalletAddress = null;
    try {
      if (event.organizerId) {
        const organizerUser = await User.findOne({ firebase_uid: event.organizerId }).lean();
        organizerWalletAddress = organizerUser?.walletAddress || null;
        if (typeof organizerUser?.defaultRoyaltyBps === 'number') {
          // Enforce the same cap as the model/API (0..1000)
          royaltyBps = Math.max(0, Math.min(1000, Math.floor(organizerUser.defaultRoyaltyBps)));
        }
      }
    } catch (e) {
      console.warn('Failed to look up organizer wallet address:', e);
    }

    // Mint the NFT
    // The contract uses _nextTokenId++ which ensures each mint gets a unique tokenId
    // On-chain royalty receiver is set to organizer wallet if available.
    let mintResult = { txHash: null, tokenId: null };
    try {
      // Internal metadata URL that serves JSON for the NFT
      const metadataUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tickets/metadata/${eventId}`;

      mintResult = await mintTicketNFT(platformWallet, metadataUri, royaltyBps, organizerWalletAddress);

      // Check if this transaction was already processed (prevent duplicate processing)
      if (mintResult.txHash) {
        const existingTicket = await Ticket.findOne({ txHash: mintResult.txHash });
        if (existingTicket) {
          return new Response(JSON.stringify({
            error: "This transaction has already been processed",
            ticket: existingTicket
          }), { status: 409 });
        }
      }
    } catch (mintError) {
      console.error("Minting failed:", mintError);
      // If minting fails, we still create the ticket but mark it as failed/pending
      // This allows users to retry later
    }

    const ticketData = {
      eventId: event._id,
      userId,
      mintStatus: (mintResult.tokenId !== null && mintResult.tokenId !== undefined) ? "minted" : "failed",
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      custodial: true,
      ownerWallet: platformWallet,
      originalOrganizerId: event.organizerId,
      originalPurchasePrice: ticketPrice,
      royaltyBps,
      royaltyReceiverWallet: organizerWalletAddress
    };

    // Only add tokenId and txHash if they exist to avoid unique index collisions with nulls
    if (mintResult.tokenId !== null && mintResult.tokenId !== undefined) {
      ticketData.tokenId = mintResult.tokenId;
    }
    if (mintResult.txHash) {
      ticketData.txHash = mintResult.txHash;
    }

    const ticket = new Ticket(ticketData);

    try {
      await ticket.save();
    } catch (saveError) {
      // Handle duplicate key errors (txHash or tokenId)
      if (saveError.code === 11000) {
        const duplicateField = Object.keys(saveError.keyPattern || {})[0];
        if (duplicateField === 'txHash') {
          // Transaction already processed - fetch existing ticket
          const existingTicket = await Ticket.findOne({ txHash: mintResult.txHash });
          return new Response(JSON.stringify({
            error: "This transaction has already been processed",
            ticket: existingTicket
          }), { status: 409 });
        } else if (duplicateField === 'tokenId' || saveError.message.includes('contractAddress_1_tokenId_1')) {
          // This shouldn't happen, but handle it gracefully
          console.error("Duplicate tokenId detected - this should not happen with blockchain sequential IDs");
          return new Response(JSON.stringify({
            error: "A ticket with this tokenId already exists. Please contact support."
          }), { status: 409 });
        }
      }
      throw saveError;
    }

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

    // Only show tickets for this user and exclude soft-deleted events
    const tickets = await Ticket.find({ userId })
      .populate({
        path: "eventId",
        select: "event date time location price image remainingTickets organizerId",
        match: { deleted: { $ne: true } } // Exclude soft-deleted events
      })
      .sort({ createdAt: -1 });

    // Filter out tickets where event was deleted (populate returns null)
    const validTickets = tickets.filter(ticket => ticket.eventId !== null);

    return NextResponse.json({ tickets: validTickets }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}