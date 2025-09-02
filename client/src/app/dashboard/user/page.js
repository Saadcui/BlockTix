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
  
    return (
      <div className="border p-4 m-2 rounded shadow-md w-60">
        {ticket.eventId.image ? (
          <img src={ticket.eventId.image} alt="Ticket" className="w-full h-40 object-cover rounded"  />
        ) : (
          <div className="h-40 w-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
            No Image
          </div>
        )}
        <h4>{ticket.eventId.event}</h4>
        <p>Price: {ticket.eventId.price}</p>
        <p>Date: {new Date(ticket.eventId.date).toLocaleDateString()}</p>
        <p>Time: {ticket.eventId.time}</p>
        <p>Remaining: {ticket.eventId.remainingTickets}</p>
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
