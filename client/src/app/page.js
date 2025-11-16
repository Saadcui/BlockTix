'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setShow(true);
  }, []);

  // ✅ Fetch events — personalized if logged in, default otherwise
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let res;
        if (user?.uid) {
          // fetch personalized recommendations
          res = await fetch(`/api/recommendations?firebase_uid=${user.uid}`);
        } else {
          // fallback to all events
          res = await fetch('/api/events');
        }

        const data = await res.json();

        if (data.success) {
          setEvents(data.events);
          setFilteredEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // ✅ Search filter
  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredEvents(events);
      return;
    }

    const lowerSearch = searchInput.toLowerCase();
    const filtered = events.filter(e => e.event.toLowerCase().includes(lowerSearch));
    setFilteredEvents(filtered);
  }, [searchInput, events]);

  const handleClick = () => {
    if (!user) {
      toast.error('Login as an Organizer to create an event', { duration: 4000 });
      router.push('/login');
      return;
    }
    if (user.role !== 'organizer') {
      toast.error('Only organizers can create events', { duration: 4000 });
      return;
    }
    router.push('/dashboard/organizer');
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen shadow-xl">
        <h1 className="sm:text-6xl font-bold m-0 w-3/4 text-center">
          Discover and attend events with{' '}
          <span
            className={`text-[#7C3AED] inline-block transition-all duration-700 ease-out ${
              show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            blockchain security
          </span>
        </h1>

        <p className="text-xl text-gray-500 w-1/2 text-center">
          Find and purchase tickets for the best events near you, secured by blockchain technology to prevent fraud and ensure authenticity.
        </p>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search for events..."
            className="border border-gray-300 p-2 rounded-2xl m-2 sm:w-80"
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <div
              className="absolute rounded-md w-80 max-h-60 overflow-y-auto z-10 bg-white shadow-md pl-2 ml-4 mt-2"
              style={{ border: '1px solid #ccc' }}
            >
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div
                    key={event._id}
                    onClick={() => router.push(`/event/${event.eventId}`)}
                  >
                    <p>{event.event}</p>
                  </div>
                ))
              ) : (
                <p>No events found</p>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div>
          <button
            className="bg-[#7C3AED] text-white py-2 px-4 rounded-md w-32 cursor-pointer border-none"
            onClick={() => router.push('/discover')}
          >
            Explore
          </button>
          <button
            className="bg-[#7C3AED] text-white py-2 px-4 rounded-md m-2 w-32 cursor-pointer border-none"
            onClick={handleClick}
          >
            Create Event
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="flex flex-col min-h-screen p-8 shadow-xl m-0">
        <h2 className="text-4xl font-bold m-0">Upcoming Events</h2>
        <div className="flex flex-row justify-between">
          <p className="text-gray-500 ml-4">
            Discover the hottest events happening soon
          </p>
          <button
            className="bg-[#7C3AED] text-white py-2 px-4 rounded-md m-2 w-32 cursor-pointer"
            onClick={() => router.push('/discover')}
          >
            View All
          </button>
        </div>

        {/* Events Grid */}
        <div className="flex flex-row flex-wrap gap-6 max-h-96 overflow-y-auto m-10 justify-center bg-white/20 backdrop-blur-md p-10 rounded-lg">
          {loading ? (
            <p className="text-gray-500 text-lg">Loading events...</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-gray-500 text-lg">No events available</p>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white/10 backdrop-blur-md rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer w-80"
                onClick={() => router.push(`/event/${event.eventId}`)}
              >
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
