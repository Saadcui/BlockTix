import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { eventId } = params;

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const forwardedProto = req.headers.get('x-forwarded-proto');
        const forwardedHost = req.headers.get('x-forwarded-host');
        const host = forwardedHost || req.headers.get('host');
        const protocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'https');

        const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim())
            ? process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/+$/, '')
            : null;

        const inferredBaseUrl = host ? `${protocol}://${host}` : null;
        const baseUrl = configuredBaseUrl || inferredBaseUrl;

        const imageValue = (event.image || '').trim();
        const imageUrl = /^https?:\/\//i.test(imageValue)
            ? imageValue
            : (baseUrl && imageValue ? `${baseUrl}${imageValue.startsWith('/') ? '' : '/'}${imageValue}` : "");

        // Standard OpenSea / ERC-721 metadata JSON
        const metadata = {
            name: `${event.event} Ticket`,
            description: `Official ticket for ${event.event} at ${event.location} on ${new Date(event.date).toLocaleDateString()}.`,
            image: imageUrl || (baseUrl ? `${baseUrl}/default-ticket.png` : ""),
            attributes: [
                { trait_type: "Event", value: event.event },
                { trait_type: "Location", value: event.location },
                { trait_type: "Date", value: new Date(event.date).toLocaleDateString() },
                { trait_type: "Time", value: event.time },
                { trait_type: "Category", value: event.category }
            ]
        };

        return NextResponse.json(metadata, {
            headers: {
                // Wallets/marketplaces fetch this from outside your origin.
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
