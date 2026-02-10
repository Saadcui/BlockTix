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
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  async function handleBuyTicket() {
    if (!user) {
      toast.error('Login to buy tickets', { duration: 4000 });
      return;
    }
    try {
      setIsBuying(true);
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event._id,
          userId: user.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        return;
      }

      toast.success('🎟️ Ticket purchased successfully!');
      await fetchEvent();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsBuying(false);
    }
  }

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

  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen animate-pulse">
        {/* Hero Skeleton */}
        <div className="h-[500px] w-full bg-gray-200" />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-64 rounded-3xl bg-gray-100" />
            </div>
            <div className="lg:col-span-1">
              <div className="h-96 rounded-3xl bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!event) return <p className="p-6">No event found.</p>;

  const earlyBirdActive = () => {
    const eb = event?.earlyBird;
    const now = new Date();
    const isTimeValid =
      eb?.enabled && eb.endDate && now <= new Date(eb.endDate);
    const isQuotaValid =
      eb?.enabled &&
      typeof eb.maxTickets === 'number' &&
      (eb.soldCount ?? 0) < eb.maxTickets;

    return eb?.enabled && (isTimeValid || isQuotaValid);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div
        className="relative flex h-[500px] w-full items-end bg-cover bg-center"
        style={{ backgroundImage: `url(${event.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 w-full p-8">
          <div className="mx-auto max-w-7xl">
            <div className="space-y-4 text-white">
              <h1 className="text-4xl font-extrabold drop-shadow-lg md:text-5xl">
                {event.event}
              </h1>
              <div className="flex flex-wrap gap-4 text-base">
                <div className="flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                  <FaCalendarAlt className="mr-2" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                  <FaClock className="mr-2" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* About Section */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-white/10 backdrop-blur-md p-10 shadow-lg transition hover:shadow-2xl border">
              <h3 className="mb-6 text-3xl font-bold text-gray-900">
                About This Event
              </h3>
              <p className="text-lg leading-relaxed text-gray-600">
                Join us for an unforgettable experience! This event promises to
                deliver amazing moments and create lasting memories. Don’t miss
                out on this incredible opportunity to be part of something truly
                special.
              </p>
            </div>
          </div>

          {/* Ticket Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-3xl border border-purple-100 bg-white/10 p-8 shadow-xl backdrop-blur-md">
              <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
                Get Tickets
              </h2>

              {/* Price */}
              <div className="mb-8 text-center">
                {earlyBirdActive() ? (
                  <div className="space-y-2">
                    <div className="text-4xl font-extrabold text-purple-600">
                      Rs {event.earlyBird.discountPrice}
                    </div>
                    <div className="text-lg text-gray-500 line-through">
                      Rs {event.price}
                    </div>
                    <span className="rounded-full px-4 py-1 text-sm font-semibold text-green-800 bg-green-200">
                      🎉 Early Bird Special
                    </span>
                  </div>
                ) : (
                  <div className="text-4xl font-extrabold text-purple-600">
                    Rs {event.price}
                  </div>
                )}
              </div>

              {/* Tickets Availability */}
              <div className="mb-8">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">Tickets Available</span>
                  <span className="font-bold text-gray-900">
                    {event.remainingTickets} / {event.totalTickets}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{
                      width: `${(event.remainingTickets / event.totalTickets) * 100
                        }%`,
                    }}
                  />
                </div>
              </div>

              {/* Buy Button */}
              <button
                className={`w-full transform rounded-xl py-4 px-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:-translate-y-1 
                ${event.remainingTickets > 0
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-2xl'
                    : 'cursor-not-allowed bg-gray-400 text-gray-100'
                  }`}
                onClick={handleBuyTicket}
                disabled={event.remainingTickets === 0}
              >
                {event.remainingTickets > 0 ? 'Buy Tickets' : 'Sold Out'}
              </button>

              {/* Security Notice */}
              <div className="mt-6 rounded-xl border border-blue-200 bg-white/30 p-4 text-center">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">🔒 Secure Purchase</span>
                  <br />
                  BlockTix protects against fraud and ensures authentic tickets
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Loading Overlay */}
      {isBuying && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl transition-all duration-500">
          <div className="relative flex flex-col items-center p-12 rounded-3xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden group">
            {/* Animated Background Pulse */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse"></div>

            {/* Main Spinner */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-purple-500 animate-spin"></div>
              <div className="absolute inset-0 h-24 w-24 rounded-full border-r-4 border-l-4 border-pink-500 animate-spin duration-1000 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="text-3xl">🎟️</span>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-bold text-white tracking-wide text-center">
              Minting Your Secured NFT Ticket
            </h2>
            <p className="mt-4 text-purple-200 text-center max-w-xs leading-relaxed animate-bounce">
              Securing your spot on the blockchain... This may take a few seconds.
            </p>

            <div className="mt-8 flex gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-purple-300 animate-bounce"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Event;