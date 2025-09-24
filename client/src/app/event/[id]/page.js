'use client';

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

function Event() {
  const params = useParams();
  const id = params.id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  async function handleBuyTicket() {
    if (!user) {
      toast.error('Login to buy tickets', { duration: 4000 });
      return;
    }

    if (event.remainingTickets <= 0) {
      toast.error('No tickets available', { duration: 4000 });
      return;
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventId: event._id,
          userId: user.uid
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.success("Ticket purchased successfully!");
      setEvent(prev => ({
        ...prev,
        remainingTickets: prev.remainingTickets - 1
      }));
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  }

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-red-500 text-lg">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">No event found.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
        {/* Left: Poster */}
        <div className="lg:w-1/3">
          <div className="rounded-xl overflow-hidden shadow-lg">
            {event.image ? (
              <img
                src={event.image}
                alt={event.event}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Right: Event Info */}
        <div className="lg:w-2/3 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {event.event}
            </h1>
            <p className="text-purple-500 font-semibold text-lg mb-4">
              {event.location}
            </p>

            <div className="flex flex-wrap gap-6 text-gray-600 dark:text-gray-300 mb-6">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-purple-500" />
                {new Date(event.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="text-purple-500" />
                {event.time}
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-purple-500" />
                {event.location}
              </div>
            </div>

            {/* Ticket Price Bar */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {event.price ? `Rs ${event.price}` : "Free"}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {event.remainingTickets > 0
                    ? "Tickets available"
                    : "Join waitlist for tickets"}
                </p>
              </div>

              <button
                className={`px-6 py-3 rounded-lg font-bold text-lg shadow-md transition-all ${
                  event.remainingTickets <= 0
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
                onClick={handleBuyTicket}
              >
                {event.remainingTickets <= 0 ? "Join Waitlist" : "Buy Ticket"}
              </button>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                About
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {event.description ||
                  "Join us for an amazing event experience. More details will be available soon."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Event;
