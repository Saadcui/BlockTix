'use client'
import React from 'react'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast';




export default function Home() {

  const [events, setEvents] = useState([]);
  const router = useRouter();
  const { user } = useAuth();

  const searchInput = React.useRef('');


  const handleSearch = () => {
    const query = searchInput.current.value;
    events.filter(event => event.name.toLowerCase().includes(query.toLowerCase()));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try { 
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();
  }, []);

 const handleClick = () => {

  if(!user){
    toast.error('Login As an Organizer to create an event', { duration: 4000 });
    router.push('/login');
    return;
  }
  if(user.role !== 'organizer'){
    toast.error('Only organizers can create events', { duration: 4000 });
    return;
  }
  router.push('/dashboard/organizer');
 }

  return (
    <div >
      <div className='flex flex-col items-center justify-center min-h-screen shadow-xl'>
      <h1 className='sm:text-6xl font-bold m-0 w-3/4 text-center'>Discover and attend events with <span className='text-[#7C3AED]'>blockchain security</span></h1>
      <p className='text-xl text-gray-500 w-1/2 text-center'>Find and purchase tickets for the best events near you, secured by blockchain technology to prevent fraud and ensure authenticity.</p>
      <input type="text" placeholder="Search for events..." className='border border-gray-300 p-2 rounded-3xl m-2 sm:w-80' ref={searchInput} />
      <div>
      <button className='bg-[#7C3AED] text-white py-2 px-4 rounded-md w-32' onClick={() => router.push('/discover')}>Explore</button>
      <button className='bg-[#7C3AED] text-white py-2 px-4 rounded-md m-2 w-32' onClick={handleClick}>Create Event</button>
      </div>
      </div>

      <div className='flex flex-col min-h-screen  p-8 m-4'>
        <h2 className='text-4xl font-bold m-0'>Upcoming Events</h2>
        <div className='flex flex-row justify-between'>
        <p className='text-gray-500 ml-4'>Discover the hottest events happening soon</p>
        <button className='bg-[#7C3AED] text-white py-2 px-4 rounded-md m-2 w-32' onClick={() => router.push('/discover')}>View All</button>
        </div>

        <div className='flex flex-row flex-wrap gap-6 max-h-96 overflow-y-auto m-10 justify-center'>
         {events.map(event => ( 
           <div
                key={event._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer w-80"
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
        
      </div>
    </div>
  )
}
