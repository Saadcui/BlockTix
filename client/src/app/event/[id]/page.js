'use client';

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

import { useParams } from 'next/navigation';

function Event() {
  const params = useParams();
  const id = params.id
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <p className="p-6 text-gray-500">Loading event...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!event) return <p className="p-6">No event found.</p>;

  return (
    <>
    <div  className="w-full h-[400px] bg-cover flex justify-between" style={{ backgroundImage: `url(${event.image})` } }>
    <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent"></div>

      <div className='flex flex-col justify-end p-12 box-border'>
      <h1 >{event.event}</h1>
      <div className='flex flex-row'>
      <FaCalendarAlt className="pl-3 pt-4 pr-1" />
      <p className="text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
      
      <FaClock className="pl-3 pt-4 pr-1"/>
      <p className="text-gray-600 ">{event.time}</p>

      <FaMapMarkerAlt className="pl-3 pt-4 pr-1"/>
      <p className="text-gray-600">{event.location}</p>
      </div>
    </div>
      

    <div className='w-[300px] border border-gray-100'>
      <h2>Get Tickets</h2>
      <div className='flex flex-col justify-end'>
      {event.price}
      <button className='btn w-[200px]'>Buy ticket</button>
      </div>
    </div>

    </div>

 

</>
);
}

export default Event;
