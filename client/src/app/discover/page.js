// src/app/discover/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DiscoverPage Component
 * 
 * A fully-featured event discovery interface that allows users to:
 * - View a list of upcoming events
 * - Filter events by name, category, and location
 * - Reset filters with a single click
 * 
 * Data is fetched from a MongoDB Atlas cluster via an API route.
 * Filtering is performed client-side for immediate responsiveness.
 * 
 * @returns {JSX.Element} The rendered Discover page
 */
export default function DiscoverPage() {
  // State for storing all events fetched from the database
  const [events, setEvents] = useState([]);
  const router = useRouter();

  // State for storing the currently filtered list of events
  const [filteredEvents, setFilteredEvents] = useState([]);

  // State for filter inputs
  const [search, setSearch] = useState('');      // Search by event name
  const [category, setCategory] = useState('');  // Filter by category
  const [location, setLocation] = useState('');  // Filter by location

  // Predefined list of categories for the dropdown
  const categories = [
   "All", "Art", "Sports", "Food And Drink", "Education", "Festival", "Music", "Other"
  ];

  /**
   * Effect Hook: Fetch events from the API on component mount
   * 
   * This effect runs once when the component is first rendered.
   * It fetches all events from the backend API and populates the state.
   */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
          setFilteredEvents(data.events); // Initialize filtered events with all events
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();
  }, []);

  /**
   * Effect Hook: Apply filters whenever input values or events change
   * 
   * This effect runs whenever `search`, `category`, `location`, or `events` change.
   * It filters the event list based on the current filter criteria.
   */
  useEffect(() => {
    let result = [...events]; // Work with a copy

    // Filter by event name (partial match, case-insensitive)
    if (search) {
      result = result.filter((e) =>
        e.event?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by category (exact match, case-insensitive)
    if (category && category !== 'All') {
      result = result.filter((e) =>
        e.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by location (partial match, case-insensitive)
    if (location) {
      result = result.filter((e) =>
        e.location?.toLowerCase().includes(location.toLowerCase())
      );
    }

    setFilteredEvents(result);
  }, [search, category, location, events]);

  return (
    <main className="min-h-screen px-6 py-8">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Discover Events</h1>
        <p className="text-lg text-gray-600 mt-2">
          Find and attend events that interest you
        </p>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-md mb-8 border">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Filter Events</h2>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          {/* Search by Event Name */}
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

          {/* Filter by Category */}
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

          {/* Filter by Location */}
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

        {/* Clear Filters Button */}
        <div className="mt-6">
          <button
            onClick={() => {
              setSearch('');
              setCategory('');
              setLocation('');
            }}
            className="btn font-bold"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No events match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white/10 backdrop-blur-md rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => {
                  router.push(`/event/${event.eventId}`)
                }}
              >
                {/* Event Image Placeholder */}
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

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 truncate">{event.event}</h3>
                  <p className="text-gray-600">
                    <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    <strong>Location:</strong> {event.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}