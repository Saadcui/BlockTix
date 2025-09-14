'use client';

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

function Event() {
  const params = useParams();
  const id = params.id
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();


  async function handleBuyTicket() {

  if(!user){
    toast.error('Login to buy tickets', { duration: 4000 });
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
      alert(data.error || "Something went wrong");
      return;
    }

    alert("Ticket purchased successfully!");
    setEvent(prev => ({
      ...prev,
      remainingTickets: prev.remainingTickets - 1
    }));
  } catch (err) {
    alert("Error: " + err.message);
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

  if (loading) return <p className="p-6 text-gray-500">Loading event...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!event) return <p className="p-6">No event found.</p>;

  return (
    <>
    <div  className="w-full h-[400px] bg-cover flex justify-between" style={{ backgroundImage: `url(${event.image})` } }>

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
      <div className='flex flex-col box-border'>
        <p className='m-2'>price : {event.price}</p>
        <p className='m-2'>ticket: {event.totalTickets}</p>
        <p className='m-2'>Remaining ticket: {event.remainingTickets}</p>

      <button className='btn w-[200px] m-2' onClick={handleBuyTicket} >Buy ticket</button>
      </div>
    </div>

    </div>

 

</>
);
}

export default Event;
