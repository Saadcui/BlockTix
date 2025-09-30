'use client'
import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from '@/context/AuthContext';
  
export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user} = useAuth();

  useEffect(() => {
      if (!user) return;
    const fetchTickets = async () => {
      try {
        const res = await fetch(`/api/tickets?userId=${user.uid}`); 
        const data = await res.json();
        setTickets(data.tickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  function Ticket({ ticket }) {
  const event = ticket.eventId;

  if (!event) {
    return (
      <div className="border p-4 m-2 rounded shadow-md w-60 text-red-500">
        Invalid Ticket Data
      </div>
    );
  }

  return (
    <div className="border p-4 m-2 rounded shadow-md w-60">
      {event.image ? (
        <img src={event.image} alt="Ticket" className="w-full h-40 object-cover rounded" />
      ) : (
        <div className="h-40 w-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
          No Image
        </div>
      )}
      <h4>{event.event}</h4>
      <p>Price: {event.price}</p>
      <p>Date: {new Date(event.date).toLocaleDateString()}</p>
      <p>Time: {event.time}</p>
      <p>Remaining: {event.remainingTickets}</p>
    </div>
  );
}

  return (
    <ProtectedRoute>
      <h1>Welcome to Dashboard</h1>
      <h3>My Tickets</h3>

      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets available.</p>
      ) : (
        <div className="flex flex-wrap">
          {tickets.map((ticket) => (
            <Ticket key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </ProtectedRoute>
  );
}
