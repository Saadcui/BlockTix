import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Ticket from '@/models/Ticket';

// GET /api/organizer/royalties?organizerId=<firebase_uid>
// Returns total royalty earned (from resaleHistory) and recent royalty events.
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get('organizerId');

    if (!organizerId) {
      return NextResponse.json({ error: 'organizerId is required' }, { status: 400 });
    }

    // Aggregate resaleHistory events for tickets originally created by this organizer
    const pipeline = [
      { $match: { originalOrganizerId: organizerId } },
      { $unwind: '$resaleHistory' },
      {
        $project: {
          eventId: 1,
          ticketId: 1,
          tokenId: 1,
          txHash: 1,
          royaltyBps: 1,
          resaleHistory: 1,
        }
      },
      {
        $sort: {
          'resaleHistory.transactionDate': -1,
        }
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRoyaltyEarned: { $sum: '$resaleHistory.royaltyAmount' },
                resaleCount: { $sum: 1 },
              },
            },
          ],
          recent: [
            { $limit: 20 },
            {
              $lookup: {
                from: 'events',
                localField: 'eventId',
                foreignField: '_id',
                as: 'event',
              },
            },
            { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                ticketId: 1,
                tokenId: 1,
                txHash: 1,
                royaltyBps: 1,
                event: {
                  event: '$event.event',
                  date: '$event.date',
                  location: '$event.location',
                },
                resale: {
                  sellerId: '$resaleHistory.sellerId',
                  buyerId: '$resaleHistory.buyerId',
                  resalePrice: '$resaleHistory.resalePrice',
                  royaltyAmount: '$resaleHistory.royaltyAmount',
                  sellerPayout: '$resaleHistory.sellerPayout',
                  royaltyReceiver: '$resaleHistory.royaltyReceiver',
                  transactionDate: '$resaleHistory.transactionDate',
                },
              },
            },
          ],
        },
      },
    ];

    const [result] = await Ticket.aggregate(pipeline);

    const totals = (result?.totals && result.totals[0]) || { totalRoyaltyEarned: 0, resaleCount: 0 };

    return NextResponse.json(
      {
        organizerId,
        totalRoyaltyEarned: totals.totalRoyaltyEarned || 0,
        resaleCount: totals.resaleCount || 0,
        recent: result?.recent || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Organizer royalties API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
