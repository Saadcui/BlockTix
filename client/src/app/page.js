'use client'
import React, { use } from 'react'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast';
import { set } from 'mongoose';


export default function Home() {

  const [events, setEvents] = useState([]);
  const router = useRouter();
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
    const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, [])
  useEffect(() => {
    setFilteredEvents([]);
    events.filter(event => {
      if(event.event.toLowerCase().includes(searchInput.toLowerCase())){
        setFilteredEvents(prev => [...prev, event])
      }
    })
  },[searchInput])



  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try { 
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }finally {
        setLoading(false);
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
    <div>
      <div className='flex flex-col items-center justify-center min-h-screen shadow-xl'>
      <h1 className='sm:text-6xl font-bold m-0 w-3/4 text-center text-gray-900 dark:text-gray-100'>Discover and attend events with       <span
        className={`text-primary-500 dark:text-purple-400 inline-block transition-opacity transition-transform duration-700 ease-out ${
          show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
        }`}
      >blockchain security</span></h1>
      <p className='text-xl text-gray-500 dark:text-gray-400 w-1/2 text-center'>Find and purchase tickets for the best events near you, secured by blockchain technology to prevent fraud and ensure authenticity.</p>
      
    
      <div className='relative'>
      <input type="text" placeholder="Search for events..." className='border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded-2xl m-2 sm:w-80 focus:border-primary-500 dark:focus:border-purple-400 focus:outline-none transition-colors duration-300' onChange={(e) => setSearchInput(e.target.value)} />
      {searchInput && (
        <div className='absolute rounded-md w-80 max-h-60 overflow-y-auto z-10 bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 pl-2 ml-4 mt-2'>
          {
              filteredEvents.length > 0 ? (filteredEvents.map(event =>(
              <div key={event._id} onClick={() => router.push(`/event/${event.eventId}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200">

                <p className="text-gray-900 dark:text-gray-100">{event.event}</p>
              </div>))
            ):(<p className="p-2 text-gray-600 dark:text-gray-400">No events found</p>)
          }
        </div>
      )}
      </div>


      <div>
      <button className='bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md w-32 cursor-pointer transition-colors duration-300' onClick={() => router.push('/discover')}>Explore</button>
      <button className='bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md m-2 w-32 cursor-pointer transition-colors duration-300' onClick={handleClick}>Create Event</button>
      </div>


      </div>

      

      <div className='flex flex-col min-h-screen p-8 shadow-xl m-0'>
        <h2 className='text-4xl font-bold m-0 text-gray-900 dark:text-gray-100'>Upcoming Events</h2>
        <div className='flex flex-row justify-between'>
        <p className='text-gray-500 dark:text-gray-400 ml-4'>Discover the hottest events happening soon</p>
        <button className='bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md m-2 w-32 cursor-pointer transition-colors duration-300' onClick={() => router.push('/discover')}>View All</button>
        </div>

        <div className='flex flex-row flex-wrap gap-6 max-h-96 overflow-y-auto m-10 justify-center card p-10'>
         {events.map(event => ( 
           <div
                key={event._id}
                className="card hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer w-80"
                onClick={() => {
                  router.push(`/event/${event.eventId}`)
                }}
              >
                {/* Event Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-purple-100 dark:from-purple-900 to-gray-100 dark:to-gray-800 flex items-center justify-center">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.event}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-lg">No Image</span>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{event.event}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
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
