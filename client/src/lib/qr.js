import jwt from 'jsonwebtoken';

const QR_SECRET = process.env.QR_SECRET || 'fallback-secret-for-dev-only';

/**
 * Generates a signed QR payload for a ticket.
 * Payload includes ticketId and a short expiration.
 */
export function generateTicketQR(ticketId, userId) {
    const payload = {
        ticketId,
        userId,
        timestamp: Date.now()
    };

    // Sign with a short expiration (e.g., 60 seconds)
    return jwt.sign(payload, QR_SECRET, { expiresIn: '60s' });
}

/**
 * Verifies a QR payload.
 */
export function verifyTicketQR(token) {
    try {
        return jwt.verify(token, QR_SECRET);
    } catch (error) {
        return null; // Invalid or expired
    }
}
