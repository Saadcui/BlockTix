'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTag, FaShoppingCart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/app/components/ProtectedRoute';

function MarketplacePage() {
  const [resaleTickets, setResaleTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [buyingTicketId, setBuyingTicketId] = useState(null);
  
  const { user } = useAuth();
  const router = useRouter();

  const categories = [
    'All',
    'Art',
    'Sports',
    'Food And Drink',
    'Education',
    'Festival',
    'Music',
    'Other',
  ];

  useEffect(() => {
    fetchResaleTickets();
  }, []);

  const fetchResaleTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets/resale');
      const data = await res.json();
      if (res.ok) {
        setResaleTickets(data.tickets || []);
      } else {
        toast.error(data.error || 'Failed to fetch resale tickets');
      }
    } catch (error) {
      console.error('Error fetching resale tickets:', error);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = async (ticket) => {
    if (!user) {
      toast.error('Please login to buy tickets');
      router.push('/login');
      return;
    }

    if (ticket.userId === user.uid) {
      toast.error('You already own this ticket');
      return;
    }

    try {
      setBuyingTicketId(ticket.ticketId);
      const res = await fetch(`/api/tickets/${ticket.ticketId}/resale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buy',
          buyerId: user.uid
        })
      });

      const data = await res.json();

      if (res.ok) {
        const royalty = data.paymentDetails?.royaltyAmount;
        const royaltyMsg = royalty ? ` (Rs ${royalty.toFixed(2)} royalty to organizer)` : '';
        toast.success(`🎟️ Ticket purchased!${royaltyMsg} Check your dashboard to claim it.`);
        // Refresh the list
        fetchResaleTickets();
      } else {
        toast.error(data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error buying ticket:', error);
      toast.error('Failed to purchase ticket');
    } finally {
      setBuyingTicketId(null);
    }
  };

  const filteredTickets = resaleTickets.filter(ticket => {
    const event = ticket.eventId;
    if (!event) return false;

    // Search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      if (!searchRegex.test(event.event || '') && !searchRegex.test(event.location || '')) {
        return false;
      }
    }

    // Category filter
    if (category && category !== 'All') {
      if (event.category?.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen px-6 py-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Resale Marketplace
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Buy tickets from other users. Royalties go to the original organizer.
          </p>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-md mb-8 border">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Filter Tickets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search events or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 h-64" />
              ))}
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="max-w-7xl mx-auto text-center py-12">
            <p className="text-xl text-gray-600">
              {resaleTickets.length === 0 
                ? 'No tickets available for resale at the moment.' 
                : 'No tickets match your filters.'}
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => {
                const event = ticket.eventId;
                if (!event) return null;

                const isBuying = buyingTicketId === ticket.ticketId;
                const isOwned = ticket.userId === user?.uid;

                return (
                  <div
                    key={ticket.ticketId}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Event Image */}
                    {event.image && (
                      <div className="h-48 w-full overflow-hidden relative">
                        <Image
                          src={event.image}
                          alt={event.event}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="p-6">
                      {/* Event Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {event.event}
                      </h3>

                      {/* Event Details */}
                      <div className="space-y-2 mb-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-indigo-500" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2">
                            <FaClock className="text-indigo-500" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-indigo-500" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                        {event.category && (
                          <div className="flex items-center gap-2">
                            <FaTag className="text-indigo-500" />
                            <span>{event.category}</span>
                          </div>
                        )}
                      </div>

                      {/* Price Info */}
                      <div className="border-t pt-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Resale Price:</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            Rs {ticket.resalePrice?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        {ticket.originalPurchasePrice && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Original Price:</span>
                            <span className="text-sm text-gray-500 line-through">
                              Rs {ticket.originalPurchasePrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-xs text-amber-700">
                              {(() => {
                                const bps = typeof ticket.royaltyBps === 'number' ? ticket.royaltyBps : 0;
                                const pct = Math.max(0, Math.min(1000, bps)) / 100;
                                const receiver = ticket.royaltyReceiverWallet;

                                const receiverLabel = receiver
                                  ? ` (receiver: ${receiver.slice(0, 6)}...${receiver.slice(-4)})`
                                  : '';

                                return `${pct}% royalty goes to the original event organizer on every resale${receiverLabel}`;
                              })()}
                          </p>
                        </div>
                      </div>

                      {/* Buy Button */}
                      <button
                        onClick={() => handleBuyTicket(ticket)}
                        disabled={isBuying || isOwned}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                          isOwned
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : isBuying
                            ? 'bg-indigo-400 text-white cursor-wait'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isBuying ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Processing...
                          </>
                        ) : isOwned ? (
                          'You Own This Ticket'
                        ) : (
                          <>
                            <FaShoppingCart />
                            Buy Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

export default MarketplacePage;
