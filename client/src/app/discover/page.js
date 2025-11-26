'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DiscoverPage() {
  const [events, setEvents] = useState([]); // All events
  const [filteredEvents, setFilteredEvents] = useState([]); // Filtered events
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
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

  //  Fetch events through the unified MovieLens-backed recommendations API.
  //  Logged-in users are mapped to a MovieLens user id on the server so their
  //  event ordering reflects CSV-based preferences.
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const query = user?.uid ? `?firebase_uid=${user.uid}` : '';
        const res = await fetch(`/api/recommendations${query}`);

        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
          setFilteredEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();
  }, [user]);

  // 🔹 Apply filters (purely client-side, no API calls)
  useEffect(() => {
    let result = [...events];

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      result = result.filter((e) => searchRegex.test(e.event || ''));
    }

    if (category && category !== 'All') {
      result = result.filter(
        (e) => e.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (location.trim()) {
      const locRegex = new RegExp(location.trim(), 'i');
      result = result.filter((e) => locRegex.test(e.location || ''));
    }

    setFilteredEvents(result);
  }, [search, category, location, events]);

  // 🔹 Handle click on event and record a simple preference signal
  const handleEventClick = async (event) => {
    router.push(`/event/${event.eventId}`);

    // Fire-and-forget preference update; we don't block navigation on this.
    if (user?.uid && event.category) {
      try {
        fetch('/api/preferences/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: user.uid,
            category: event.category,
          }),
        }).catch(() => {});
      } catch {
        // Intentionally ignore errors here
      }
    }
  };

  return (
    <main className="min-h-screen px-6 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Discover Events
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Find and attend events that interest you
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-md mb-8 border">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          Filter Events
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {/* Search */}
          <div>
            <label className="label font-semibold">Search by Event</label>
            <input
              type="text"
              placeholder="e.g., Music Concert"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="label font-semibold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="label font-semibold">Location</label>
            <input
              type="text"
              placeholder="e.g., Punjab"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-6">
          <button
            onClick={() => {
              setSearch('');
              setCategory('All');
              setLocation('');
              setFilteredEvents(events);
            }}
            className="btn font-bold"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Event Grid */}
      <div className="max-w-7xl mx-auto bg-white/20 backdrop-blur-md p-10 rounded-lg">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            No events match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eb = event.earlyBird;
              const now = new Date();
              const isTimeValid =
                eb?.enabled && eb.endDate && now <= new Date(eb.endDate);
              const isQuotaValid =
                eb?.enabled &&
                typeof eb.maxTickets === 'number' &&
                (eb.soldCount ?? 0) < eb.maxTickets;

              const earlyBirdActive =
                eb?.enabled && (isTimeValid || isQuotaValid);

              return (
                <div
                  key={event._id}
                  className="bg-white/10 backdrop-blur-md rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  {/* Event Image */}
                  <div className="h-40 bg-gradient-to-br from-purple-100 to-gray-100 flex items-center justify-center">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.event}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg">No Image</span>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {event.event}
                    </h3>
                    <p className="text-gray-600">
                      <strong>Date:</strong>{' '}
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Location:</strong> {event.location}
                    </p>

                    {earlyBirdActive ? (
                      <p className="text-green-600 font-semibold">
                        Early Bird Price: Rs {event.earlyBird.discountPrice}
                        <span className="line-through text-gray-500 ml-2 text-sm">
                          ${event.price}
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-800 font-semibold">
                        Price: Rs {event.price}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
