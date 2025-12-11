'use client';
import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { user } = useAuth();
  const router = useRouter();

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

  const now = new Date();
  const upcomingTickets = tickets.filter(
    (t) => t.eventId?.date && new Date(t.eventId.date) >= now
  );
  const pastTickets = tickets.filter(
    (t) => t.eventId?.date && new Date(t.eventId.date) < now
  );

  const totalSpent = tickets.reduce(
    (sum, t) => sum + (t.eventId?.price || 0),
    0
  );

  function TicketCard({ ticket }) {
    const event = ticket.eventId;
    if (!event)
      return (
        <div className="border p-4 m-2 rounded-xl shadow-md w-60 text-red-500 bg-white/70 backdrop-blur-md border-purple-100/40">
          Invalid Ticket Data
        </div>
      );

    return (
      <div className="bg-white/70 backdrop-blur-lg border border-purple-100/40 rounded-2xl shadow-md hover:shadow-lg hover:shadow-purple-300/40 transition w-[360px] p-5">
        {event.image ? (
          <img
            src={event.image}
            alt="Event"
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        ) : (
          <div className="h-48 bg-purple-100 flex items-center justify-center text-purple-400 rounded-xl mb-4">
            No Image
          </div>
        )}

        <h4 className="font-semibold text-gray-900 text-lg truncate">
          {event.event}
        </h4>
        <p className="text-gray-600 text-sm mt-1">
          Date: {new Date(event.date).toLocaleDateString()}
        </p>
        <p className="text-gray-600 text-sm">Time: {event.time}</p>
        <p className="text-purple-600 font-medium mt-2 text-sm">
          Price: Rs {event.price}
        </p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage your event tickets and view details easily.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/60 backdrop-blur-md border border-purple-100/40 rounded-2xl shadow-md p-6 flex flex-col items-center">
            <p className="text-gray-600">Total Tickets</p>
            <h3 className="text-3xl font-bold text-purple-600 mt-1">
              {tickets.length}
            </h3>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-purple-100/40 rounded-2xl shadow-md p-6 flex flex-col items-center">
            <p className="text-gray-600">Upcoming Events</p>
            <h3 className="text-3xl font-bold text-purple-600 mt-1">
              {upcomingTickets.length}
            </h3>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-purple-100/40 rounded-2xl shadow-md p-6 flex flex-col items-center">
            <p className="text-gray-600">Total Spent</p>
            <h3 className="text-3xl font-bold text-purple-600 mt-1">
              Rs {totalSpent}
            </h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full mt-10 mb-6">
          <div className="flex w-full bg-white/40 backdrop-blur-md border border-purple-100/40 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 min-w-[140px] text-center px-6 py-2 rounded-full font-medium transition-all duration-300 ease-in-out ${
                activeTab === "upcoming"
                  ? "bg-purple-500 text-white shadow-md"
                  : "text-gray-700 hover:text-purple-600"
              }`}
            >
              Upcoming ({upcomingTickets.length})
            </button>

            <button
              onClick={() => setActiveTab("past")}
              className={`flex-1 min-w-[140px] text-center px-6 py-2 rounded-full font-medium transition-all duration-300 ease-in-out ${
                activeTab === "past"
                  ? "bg-purple-500 text-white shadow-md"
                  : "text-gray-700 hover:text-purple-600"
              }`}
            >
              Past ({pastTickets.length})
            </button>
          </div>
        </div>

        {/* Ticket Sections */}
        {loading ? (
          <p className="text-gray-600 text-center mt-10">Loading tickets...</p>
        ) : (
          <div className="mt-6">
            {activeTab === "upcoming" ? (
              upcomingTickets.length === 0 ? (
                <div className="flex flex-col items-center mt-20 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No Upcoming Events
                  </h3>
                  <p className="text-gray-600 mb-5">
                    You don't have any upcoming events. Discover new ones to
                    attend!
                  </p>
                  <button
                    onClick={() => router.push("/discover")}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-md"
                  >
                    Browse Events
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-start">
                  {upcomingTickets.map((ticket) => (
                    <TicketCard key={ticket._id} ticket={ticket} />
                  ))}
                </div>
              )
            ) : pastTickets.length === 0 ? (
              <div className="flex flex-col items-center mt-20 text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  No Past Events
                </h3>
                <p className="text-gray-600">
                  You haven’t attended any events yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-start">
                {pastTickets.map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        )}
    </ProtectedRoute>
  );
}
