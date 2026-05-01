import { NextResponse } from 'next/server';
import Event from "@/models/Event";
import Ticket from "@/models/Ticket";
import dbConnect from '@/lib/dbConnect';
import { mintTicketNFT } from '@/lib/blockchain';
import User from '@/models/User';
import { getStripe, fromStripeAmount } from '@/lib/stripe';


//route for creating tickets
export async function POST(req) {
  try {
    await dbConnect();

    const { eventId, userId, stripeSessionId } = await req.json();

    if (!eventId || !userId || !stripeSessionId) {
      return new Response(JSON.stringify({
        error: "A completed Stripe payment is required before a ticket can be issued."
      }), { status: 400 });
    }

    const existingPaidTicket = await Ticket.findOne({ stripeCheckoutSessionId: stripeSessionId });
    if (existingPaidTicket) {
      return new Response(JSON.stringify({ success: true, ticket: existingPaidTicket, alreadyProcessed: true }), { status: 200 });
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId, {
      expand: ['payment_intent'],
    });

    if (checkoutSession.payment_status !== 'paid') {
      return new Response(JSON.stringify({
        error: "Payment was not completed. Your ticket has not been created."
      }), { status: 402 });
    }

    if (checkoutSession.metadata?.userId !== userId) {
      return new Response(JSON.stringify({
        error: "This payment session does not belong to the current user."
      }), { status: 403 });
    }

    if (checkoutSession.metadata?.eventId !== String(eventId)) {
      return new Response(JSON.stringify({
        error: "This payment session does not match the selected event."
      }), { status: 400 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
    }

    if (event.remainingTickets <= 0) {
      return new Response(JSON.stringify({
        error: "Tickets sold out. Payment was received, but no ticket was issued. Please contact support for a refund."
      }), { status: 409 });
    }

    const paidAmount = fromStripeAmount(checkoutSession.amount_total || 0, checkoutSession.currency);
    const ticketPrice = Number(checkoutSession.metadata?.price);

    if (!Number.isFinite(ticketPrice) || Math.abs(paidAmount - ticketPrice) > 0.01) {
      return new Response(JSON.stringify({
        error: "Payment amount could not be verified. Your ticket has not been created."
      }), { status: 400 });
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
  
    let mintResult = { txHash: null, tokenId: null };
    try {
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const forwardedHost = req.headers.get('x-forwarded-host');
      const host = forwardedHost || req.headers.get('host');
      const protocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'https');

      const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim())
        ? process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/+$/, '')
        : null;

      const inferredBaseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
      const baseUrl = configuredBaseUrl || inferredBaseUrl;

      const isLocalMetadataUrl = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(baseUrl);
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || '';
      const isLocalRpc = /(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(rpcUrl);
      if (isLocalMetadataUrl && !isLocalRpc) {
        throw new Error(
          "Refusing to mint with a localhost metadata URL on a non-local RPC. Set NEXT_PUBLIC_BASE_URL to your deployed HTTPS domain (e.g. https://block-tix-theta.vercel.app)."
        );
      }

      const metadataUri = `${baseUrl}/api/tickets/metadata/${eventId}`;

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
      royaltyReceiverWallet: organizerWalletAddress,
      paymentProvider: "stripe",
      paymentStatus: "paid",
      stripeCheckoutSessionId: checkoutSession.id,
      stripePaymentIntentId: typeof checkoutSession.payment_intent === 'string'
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id,
      amountPaid: paidAmount,
      paymentCurrency: checkoutSession.currency
    };

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
      if (saveError.code === 11000) {
        const duplicateField = Object.keys(saveError.keyPattern || {})[0];
        if (duplicateField === 'stripeCheckoutSessionId') {
          const existingTicket = await Ticket.findOne({ stripeCheckoutSessionId: checkoutSession.id });
          return new Response(JSON.stringify({
            success: true,
            ticket: existingTicket,
            alreadyProcessed: true
          }), { status: 200 });
        } else if (duplicateField === 'txHash') {

          const existingTicket = await Ticket.findOne({ txHash: mintResult.txHash });
          return new Response(JSON.stringify({
            error: "This transaction has already been processed",
            ticket: existingTicket
          }), { status: 409 });
        } else if (duplicateField === 'tokenId' || saveError.message.includes('contractAddress_1_tokenId_1')) {
          console.error("Duplicate tokenId detected - this should not happen with blockchain sequential IDs");
          return new Response(JSON.stringify({
            error: "A ticket with this tokenId already exists. Please contact support."
          }), { status: 409 });
        }
      }
      throw saveError;
    }

    event.remainingTickets -= 1;
    if (checkoutSession.metadata?.earlyBirdActive === 'true' && event.earlyBird?.enabled) {
      event.earlyBird.soldCount = (event.earlyBird.soldCount || 0) + 1;
    }

    await event.save();

    // Record purchase as recommendation signal
    if (userId && event.category) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/preferences/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: userId, category: event.category }),
      }).catch(() => {});
    }

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
