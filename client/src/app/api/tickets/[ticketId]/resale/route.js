import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';
import Event from '@/models/Event';
import { returnToCustody } from '@/lib/blockchain';
import User from '@/models/User';

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { ticketId } = await params;
        const { action, price, buyerId, sellerId } = await req.json();

        const ticket = await Ticket.findOne({ ticketId }).populate('eventId');
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // LIST ticket on the marketplace
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

            const capEnabled = ticket.eventId?.resaleCapEnabled === true;
            const capPercent = Number(ticket.eventId?.resaleCapPercent);
            if (capEnabled && Number.isFinite(capPercent) && capPercent >= 0) {
                const basePrice = Number(ticket.originalPurchasePrice ?? ticket.eventId?.price);
                if (Number.isFinite(basePrice) && basePrice > 0) {
                    const maxAllowed = basePrice * (1 + (capPercent / 100));
                    if (price > maxAllowed + 0.01) {
                        return NextResponse.json({
                            error: `Resale price exceeds the organizer cap. Max allowed is Rs ${maxAllowed.toFixed(2)} (${capPercent}% above original).`
                        }, { status: 400 });
                    }
                }
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

        // DELIST from marketplace
        else if (action === 'delist') {
            if (!sellerId) {
                return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
            }
            if (!ticket.isForResale) {
                return NextResponse.json({ error: "Ticket is not currently listed for resale" }, { status: 400 });
            }
            if (ticket.listedBy !== sellerId && ticket.userId !== sellerId) {
                return NextResponse.json({ error: "You are not authorized to delist this ticket" }, { status: 403 });
            }

            // Remove from marketplace
            ticket.isForResale = false;
            ticket.resalePrice = null;
            ticket.listedBy = null;

            await ticket.save();

            return NextResponse.json({
                success: true,
                message: "Ticket removed from marketplace. You can now claim it back to your wallet from your dashboard.",
                ticket
            }, { status: 200 });
        }

        // ACTION: BUY – Purchase a listed ticket
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

            // Calculate royalty (OFF-CHAIN)
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
