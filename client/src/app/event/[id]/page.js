//app/event/[id]/page.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Skeleton';

// Fire-and-forget: must never throw or block the UI
function recordInteraction(firebase_uid, event_id, interaction_type) {
  if (!firebase_uid || !event_id) return;
  fetch('/api/recommendations/record', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ firebase_uid, event_id, interaction_type }),
  }).catch(() => {});
}

function Event() {
  const params = useParams();
  const router = useRouter();
  const id = params.id; // eventId UUID
  const checkoutFinalizedRef = useRef(false);

  const [event,      setEvent]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [isBuying,   setIsBuying]   = useState(false);
  const [error,      setError]      = useState(null);
  const [isSaved,    setIsSaved]    = useState(false);
  const [savingWish, setSavingWish] = useState(false);

  const { user } = useAuth();

  const EventMap = dynamic(
    () => import('@/app/components/EventMap'),
    { ssr: false }
  );

  const fetchEvent = useCallback(async () => {
    try {
      const res  = await fetch(`/api/events/${id}`);
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch event on mount
  useEffect(() => {
    if (id) fetchEvent();
  }, [id, fetchEvent]);

  // Record "view" once event is loaded and user is known
  useEffect(() => {
    if (id && user?.uid && event) {
      recordInteraction(user.uid, id, 'view');
    }
  }, [id, user?.uid, event]);

  // Check if this event is already in the user's wishlist
  useEffect(() => {
    if (!user?.uid || !id) return;
    fetch(`/api/wishlist?firebase_uid=${user.uid}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const alreadySaved = data.savedEvents.some(e => e.eventId === id);
          setIsSaved(alreadySaved);
        }
      })
      .catch(() => {});
  }, [user?.uid, id]);

  async function handleToggleWishlist() {
    if (!user) {
      toast.error('Login to save events');
      return;
    }
    try {
      setSavingWish(true);
      const res  = await fetch('/api/wishlist', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ firebase_uid: user.uid, event_id: id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Something went wrong'); return; }

      setIsSaved(data.saved);
      toast.success(data.saved ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingWish(false);
    }
  }

  async function handleBuyTicket() {
    if (!user) {
      toast.error('Login to buy tickets');
      return;
    }
    if (!event || event.remainingTickets <= 0) {
      toast.error('This event is sold out');
      return;
    }

    try {
      setIsBuying(true);
      const res = await fetch('/api/stripe/checkout', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          eventId: id,
          userId: user.uid,
          userEmail: user.email,
        }),
      });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error || 'Something went wrong'); return; }
      if (!data.url) { toast.error('Unable to open Stripe Checkout'); return; }

      window.location.href = data.url;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBuying(false);
    }
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const checkoutStatus = searchParams.get('checkout');
    const stripeSessionId = searchParams.get('session_id');

    if (checkoutStatus === 'cancelled') {
      toast.error('Payment cancelled. No ticket was created.');
      router.replace(`/event/${id}`, { scroll: false });
      return;
    }

    if (
      checkoutStatus !== 'success' ||
      !stripeSessionId ||
      !user?.uid ||
      !event?._id ||
      checkoutFinalizedRef.current
    ) {
      return;
    }

    checkoutFinalizedRef.current = true;

    async function finalizeTicketPurchase() {
      try {
        setIsBuying(true);
        const res = await fetch('/api/tickets', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            eventId: event._id,
            userId: user.uid,
            stripeSessionId,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Payment verified, but ticket creation failed.');
          return;
        }

        toast.success(data.alreadyProcessed ? 'Ticket already issued for this payment.' : 'Ticket purchased successfully!');
        recordInteraction(user.uid, id, 'purchase');
        await fetchEvent();
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsBuying(false);
        router.replace(`/event/${id}`, { scroll: false });
      }
    }

    finalizeTicketPurchase();
  }, [user?.uid, event?._id, id, router, fetchEvent]);

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* HERO SKELETON */}
        <div className="p-4 md:p-8">
          <div className="relative flex h-[500px] w-full items-end rounded-3xl overflow-hidden shadow-2xl">
            <Skeleton className="absolute inset-0 rounded-3xl" />
            <div className="relative z-10 w-full p-8">
              <div className="mx-auto max-w-7xl space-y-4">
                <Skeleton className="h-12 w-3/4" variant="rect" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-10 w-32" variant="rect" />
                  <Skeleton className="h-10 w-32" variant="rect" />
                  <Skeleton className="h-10 w-32" variant="rect" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID SKELETON */}
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ABOUT SKELETON */}
          <div className="lg:col-span-2 rounded-3xl bg-white/10 backdrop-blur-md p-10 shadow-lg border border-white/10">
            <Skeleton className="h-8 w-40 mb-6" variant="rect" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-3/4" variant="text" />
            </div>
          </div>

          {/* TICKETS SKELETON */}
          <div className="lg:col-span-1 lg:row-span-2 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-xl backdrop-blur-md">
            <Skeleton className="h-8 w-32 mx-auto mb-8" variant="rect" />
            <div className="mb-8 text-center space-y-4">
              <Skeleton className="h-10 w-24 mx-auto" variant="rect" />
              <Skeleton className="h-6 w-32 mx-auto" variant="rect" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" variant="rect" />
          </div>

          {/* LOCATION SKELETON */}
          <div className="lg:col-span-2 rounded-3xl bg-white/10 backdrop-blur-md p-8 shadow-lg border border-white/10">
            <Skeleton className="h-8 w-40 mb-6" variant="rect" />
            <Skeleton className="h-64 w-full rounded-2xl" variant="rect" />
          </div>
        </div>
      </div>
    );
  }
  if (error)   return <p className="p-6 text-red-500">{error}</p>;
  if (!event)  return <p className="p-6">No event found</p>;

  const googleMapsUrl =
    event.latitude && event.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
      : null;

  const eb           = event.earlyBird;
  const now          = new Date();
  const isTimeValid  = eb?.enabled && eb.endDate && now <= new Date(eb.endDate);
  const isQuotaValid = eb?.enabled && typeof eb.maxTickets === 'number' && (eb.soldCount ?? 0) < eb.maxTickets;
  const earlyBirdActive = eb?.enabled && isTimeValid && isQuotaValid;

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <div className="p-4 md:p-8">
        <div
          className="relative flex h-[500px] w-full items-end bg-cover bg-center rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundImage: `url(${event.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Wishlist button*/}
          {user && (
            <button
              onClick={handleToggleWishlist}
              disabled={savingWish}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-white backdrop-blur-md hover:bg-black/60 transition disabled:opacity-60"
              title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              {isSaved
                ? <FaHeart className="text-red-400 text-lg" />
                : <FaRegHeart className="text-white text-lg" />
              }
            </button>
          )}

          <div className="relative z-10 w-full p-8">
            <div className="mx-auto max-w-7xl space-y-4 text-white">
              <h1 className="text-4xl md:text-5xl font-extrabold">{event.event}</h1>
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                  <FaCalendarAlt className="mr-2" />
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <span className="flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                  <FaClock className="mr-2" />
                  {event.time}
                </span>
                <span className="flex items-center rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                  <FaMapMarkerAlt className="mr-2" />
                  {event.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ABOUT */}
        <div className="lg:col-span-2 rounded-3xl bg-white/10 backdrop-blur-md p-10 shadow-lg border border-white/10">
          <h3 className="mb-6 text-3xl font-bold text-white">About This Event</h3>
          <p className="text-lg leading-relaxed text-white/70">
            Join us for an unforgettable experience! This event promises to
            deliver amazing moments and create lasting memories.
          </p>
        </div>

        {/* TICKETS */}
        <div className="lg:col-span-1 lg:row-span-2 top-8 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-xl backdrop-blur-md">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Get Tickets</h2>

          <div className="mb-8 text-center">
            {earlyBirdActive ? (
              <div className="flex flex-col items-center">
                <span className="text-sm text-green-400 font-semibold mb-1 uppercase tracking-wider">
                  Early Bird Active
                </span>
                <div className="text-4xl font-extrabold text-green-500">
                  Rs {event.earlyBird.discountPrice}
                </div>
                <div className="text-lg line-through text-white/50 mt-1">
                  Rs {event.price}
                </div>
              </div>
            ) : (
              <div className="text-4xl font-extrabold text-[#FFA500]">
                Rs {event.price}
              </div>
            )}
          </div>

          <button
            onClick={handleBuyTicket}
            disabled={event.remainingTickets === 0 || isBuying}
            className={`w-full rounded-xl py-4 px-6 text-lg font-semibold shadow-lg transition cursor-pointer
              ${event.remainingTickets > 0 && !isBuying
                ? 'bg-gradient-to-r from-[#FFA500] to-indigo-600 text-white'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
          >
            {event.remainingTickets === 0 ? 'Sold Out' : isBuying ? 'Preparing Checkout...' : 'Buy Tickets'}
          </button>
        </div>

        {/* LOCATION */}
        <div className="lg:col-span-2 rounded-3xl bg-white/10 backdrop-blur-md p-8 shadow-lg border border-white/10">
          <h3 className="mb-6 text-2xl font-bold text-white">Event Location</h3>

          {event.latitude && event.longitude && (
            <EventMap
              latitude={event.latitude}
              longitude={event.longitude}
              title={event.event}
            />
          )}

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-block mt-6 w-auto no-underline"
            >
              Open in Google Maps
            </a>
          )}
        </div>
      </div>

      {/* BUYING OVERLAY */}
      {isBuying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="rounded-2xl border border-white/10 bg-gray-950/90 px-8 py-6 text-center shadow-2xl">
            <div className="text-white text-xl font-semibold animate-pulse">Securing your ticket...</div>
            <p className="mt-2 text-sm text-white/60">Keep this page open while payment and ticket issuance finish.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Event;
