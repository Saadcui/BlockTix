import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';
import Event from '@/models/Event';
import { returnToCustody } from '@/lib/blockchain';
import User from '@/models/User';

/**
 * POST /api/tickets/[ticketId]/resale
 * 
 * Actions:
 *   list   – List a ticket for resale on the marketplace.
 *            The NFT is returned to platform custody so the platform can transfer it to the buyer.
 *   delist – Cancel a listing. Ticket is removed from marketplace and stays in platform custody.
 *            The user can then claim it back to their wallet via the claim endpoint.
 *   buy    – Purchase a listed ticket. Royalty is calculated and recorded.
 *            The organizer receives a royalty cut, the seller receives the remainder.
 *
 * body examples:
 *   { action: 'list',   sellerId: '...', price: 100 }
 *   { action: 'delist', sellerId: '...' }
 *   { action: 'buy',    buyerId: '...' }
 */
export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { ticketId } = await params;
        const { action, price, buyerId, sellerId } = await req.json();

        const ticket = await Ticket.findOne({ ticketId }).populate('eventId');
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // ───────────────────────────────────────────────
        // ACTION: LIST – Put ticket on the marketplace
        // ───────────────────────────────────────────────
        if (action === 'list') {
            if (!sellerId) {
                return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
            }
            if (ticket.userId !== sellerId) {
                return NextResponse.json({ error: "You don't own this ticket" }, { status: 403 });
            }
            if (ticket.status !== 'valid' || ticket.isRedeemed) {
                return NextResponse.json({ error: "Cannot list used or invalid ticket" }, { status: 400 });
            }
            if (ticket.isForResale) {
                return NextResponse.json({ error: "Ticket is already listed for resale" }, { status: 400 });
            }
            if (!price || price <= 0) {
                return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
            }

            // If ticket is claimed (not custodial / in user wallet), 
            // return it to platform custody so we can transfer it to the buyer later
            if (!ticket.custodial && ticket.tokenId) {
                try {
                    const receipt = await returnToCustody(ticket.tokenId);
                    ticket.lastOnChainTxHash = receipt?.hash || receipt?.transactionHash || null;
                } catch (err) {
                    return NextResponse.json({ 
                        error: "Failed to return ticket to platform for resale: " + err.message 
                    }, { status: 500 });
                }
            }

            // Update ticket state
            ticket.custodial = true;
            ticket.ownerWallet = process.env.PLATFORM_CUSTODY_ADDRESS;
            ticket.isForResale = true;
            ticket.resalePrice = price;
            ticket.listedBy = sellerId;

            // Store original organizer if not already stored
            if (!ticket.originalOrganizerId && ticket.eventId?.organizerId) {
                ticket.originalOrganizerId = ticket.eventId.organizerId;
            }

            // Ensure royalty params exist for off-chain royalty ledger
            if (typeof ticket.royaltyBps !== 'number') {
                ticket.royaltyBps = 500;
            }

            // Backfill organizer wallet on the ticket if available
            if (!ticket.royaltyReceiverWallet && ticket.originalOrganizerId) {
                try {
                    const organizer = await User.findOne({ firebase_uid: ticket.originalOrganizerId }).lean();
                    if (organizer?.walletAddress) {
                        ticket.royaltyReceiverWallet = organizer.walletAddress;
                    }
                } catch (e) {
                    console.warn('Failed to backfill organizer wallet for ticket:', e);
                }
            }

            await ticket.save();

            return NextResponse.json({ 
                success: true, 
                message: "Ticket listed for resale. NFT is held in platform custody until sold.",
                ticket 
            }, { status: 200 });
        }

        // ───────────────────────────────────────────────
        // ACTION: DELIST – Remove ticket from marketplace
        // ───────────────────────────────────────────────
        else if (action === 'delist') {
            if (!sellerId) {
                return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
            }
            if (!ticket.isForResale) {
                return NextResponse.json({ error: "Ticket is not currently listed for resale" }, { status: 400 });
            }
            // Only the person who listed it (or the current owner) can delist
            if (ticket.listedBy !== sellerId && ticket.userId !== sellerId) {
                return NextResponse.json({ error: "You are not authorized to delist this ticket" }, { status: 403 });
            }

            // Remove from marketplace — ticket stays in platform custody
            // User can claim it back to their wallet via /api/tickets/[ticketId]/claim
            ticket.isForResale = false;
            ticket.resalePrice = null;
            ticket.listedBy = null;
            // Keep custodial = true — the user needs to explicitly claim back

            await ticket.save();

            return NextResponse.json({
                success: true,
                message: "Ticket removed from marketplace. You can now claim it back to your wallet from your dashboard.",
                ticket
            }, { status: 200 });
        }

        // ───────────────────────────────────────────────
        // ACTION: BUY – Purchase a listed ticket
        // ───────────────────────────────────────────────
        else if (action === 'buy') {
            if (!ticket.isForResale) {
                return NextResponse.json({ error: "Ticket is not for sale" }, { status: 400 });
            }
            if (!buyerId) {
                return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
            }
            if (ticket.userId === buyerId) {
                return NextResponse.json({ error: "You already own this ticket" }, { status: 400 });
            }

            const resalePrice = ticket.resalePrice;
            const sellerId = ticket.listedBy || ticket.userId;

            // ── Calculate royalty (OFF-CHAIN) ──
            // IMPORTANT: Payments are off-chain (platform gateway), and resalePrice is in fiat (e.g. Rs).
            // ERC-2981's royaltyInfo expects prices in the chain's native units, so we use the stored bps.
            const royaltyBps = typeof ticket.royaltyBps === 'number' ? ticket.royaltyBps : 500;
            const royaltyAmount = (resalePrice * royaltyBps) / 10000;

            // Organizer wallet/address for display + ledger crediting
            let royaltyReceiver = ticket.royaltyReceiverWallet || ticket.originalOrganizerId || 'platform';
            let organizerCredited = false;
            if (ticket.originalOrganizerId) {
                try {
                    const organizer = await User.findOne({ firebase_uid: ticket.originalOrganizerId });
                    if (organizer) {
                        organizer.royaltyBalance = (organizer.royaltyBalance || 0) + royaltyAmount;
                        // Keep organizer wallet synced on ticket if it was missing
                        if (!ticket.royaltyReceiverWallet && organizer.walletAddress) {
                            ticket.royaltyReceiverWallet = organizer.walletAddress;
                            royaltyReceiver = organizer.walletAddress;
                        }
                        await organizer.save();
                        organizerCredited = true;
                    }
                } catch (e) {
                    console.error('Failed to credit organizer royalty balance:', e);
                }
            }

            // Seller gets resale price minus royalty
            const sellerPayout = resalePrice - royaltyAmount;

            // ── Record resale transaction for audit ──
            const resaleRecord = {
                sellerId,
                buyerId,
                resalePrice,
                royaltyAmount,
                royaltyReceiver: royaltyReceiver || 'platform',
                sellerPayout,
                transactionDate: new Date()
            };

            // ── Transfer ownership in DB ──
            const previousOwner = ticket.userId;
            if (!ticket.previousOwners) ticket.previousOwners = [];
            ticket.previousOwners.push(previousOwner);

            if (!ticket.resaleHistory) ticket.resaleHistory = [];
            ticket.resaleHistory.push(resaleRecord);

            ticket.userId = buyerId;
            ticket.isForResale = false;
            ticket.resalePrice = null;
            ticket.listedBy = null;
            // Ticket stays in platform custody — buyer can claim to their wallet
            ticket.custodial = true;
            ticket.ownerWallet = process.env.PLATFORM_CUSTODY_ADDRESS;

            await ticket.save();

            return NextResponse.json({
                success: true,
                message: "Ticket purchased! The NFT is in platform custody. You can claim it to your wallet from your dashboard.",
                ticket,
                paymentDetails: {
                    totalPrice: resalePrice,
                    sellerPayout,
                    royaltyAmount,
                    royaltyReceiver: royaltyReceiver,
                    organizerCredited
                }
            }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid action. Use 'list', 'delist', or 'buy'." }, { status: 400 });

    } catch (error) {
        console.error("Resale API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/tickets/[ticketId]/resale - Get resale info
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { ticketId } = await params;

        const ticket = await Ticket.findOne({ ticketId })
            .populate('eventId', 'event date time location image organizerId');

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            ticket,
            isForResale: ticket.isForResale,
            resalePrice: ticket.resalePrice
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
