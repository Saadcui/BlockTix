'use client';
import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrToken, setQrToken] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [reselling, setReselling] = useState(false);
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

  const fetchQrCode = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/qr`);
      const data = await res.json();
      if (data.qrCode) {
        setQrToken(data.qrCode);
      }
    } catch (error) {
      console.error("Error fetching QR:", error);
    }
  };

  useEffect(() => {
    let interval;
    if (showQrModal && selectedTicket) {
      fetchQrCode(selectedTicket.ticketId);
      // Rotate QR every 45s (safe buffer for 60s TTL)
      interval = setInterval(() => {
        fetchQrCode(selectedTicket.ticketId);
      }, 45000);
    }
    return () => clearInterval(interval);
  }, [showQrModal, selectedTicket]);

  const handleClaim = async (ticketId) => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return;
    }

    try {
      setClaiming(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      const res = await fetch(`/api/tickets/${ticketId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: walletAddress })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket claimed to your wallet!");
        setTickets(tickets.map(t => t.ticketId === ticketId ? { ...t, custodial: false, ownerWallet: walletAddress } : t));
        setShowQrModal(false);
      } else {
        toast.error(data.error || "Claim failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setClaiming(false);
    }
  };

  const handleResale = async (ticketId, price) => {
    try {
      setReselling(true);
      const res = await fetch(`/api/tickets/${ticketId}/resale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', price: parseFloat(price) })
      });

      if (res.ok) {
        toast.success("Ticket listed for resale!");
        setTickets(tickets.map(t => t.ticketId === ticketId ? { ...t, isForResale: true, resalePrice: price } : t));
        setShowQrModal(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Listing failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReselling(false);
    }
  };

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

        <button
          onClick={() => {
            setSelectedTicket(ticket);
            setShowQrModal(true);
          }}
          className="w-full mt-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
        >
          View Ticket / QR
        </button>
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
        <div className="bg-white/20 backdrop-blur-md border border-purple-100/40 rounded-2xl shadow-md p-6 flex flex-col items-center">
          <p className="text-gray-600">Total Tickets</p>
          <h3 className="text-3xl font-bold text-purple-600 mt-1">
            {tickets.length}
          </h3>
        </div>

        <div className="bg-white/20 backdrop-blur-md border border-purple-100/40 rounded-2xl shadow-md p-6 flex flex-col items-center">
          <p className="text-gray-600">Upcoming Events</p>
          <h3 className="text-3xl font-bold text-purple-600 mt-1">
            {upcomingTickets.length}
          </h3>
        </div>

        <div className="bg-white/20 backdrop-blur-md border border-purple-100/40 rounded-2xl shadow-md p-6 flex flex-col items-center">
          <p className="text-gray-600">Total Spent</p>
          <h3 className="text-3xl font-bold text-purple-600 mt-1">
            Rs {totalSpent}
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full mt-10 mb-6">
        <div className="flex w-full bg-white/10 backdrop-blur-md border border-purple-100/40 p-1 rounded-full">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 min-w-[140px] text-center px-6 py-2 rounded-full font-medium transition-all duration-300 ease-in-out ${activeTab === "upcoming"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white/20 hover:text-purple-600"
              }`}
          >
            Upcoming ({upcomingTickets.length})
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex-1 min-w-[140px] text-center px-6 py-2 rounded-full font-medium transition-all duration-300 ease-in-out ${activeTab === "past"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white/20 hover:text-purple-600"
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
                  You do not have any upcoming events. Discover new ones to
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

      {/* QR & Management Modal */}
      {showQrModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
            >
              ✕
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.eventId?.event}</h2>
              <div className="bg-gray-50 p-6 rounded-2xl inline-block mb-6 border border-gray-100 shadow-inner">
                {qrToken ? (
                  <QRCodeCanvas value={qrToken} size={200} />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                    Generating QR...
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                ⚠️ This QR code rotates every 60 seconds. Do not screenshot it.
              </p>

              <div className="space-y-3">
                {selectedTicket.custodial ? (
                  <>
                    <button
                      onClick={() => handleClaim(selectedTicket.ticketId)}
                      disabled={claiming}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {claiming ? "Transferring..." : "Claim to My MetaMask"}
                    </button>
                    {!selectedTicket.isForResale && (
                      <button
                        onClick={() => {
                          const p = prompt("Enter resale price (Rs):");
                          if (p) handleResale(selectedTicket.ticketId, p);
                        }}
                        disabled={reselling}
                        className="w-full py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition"
                      >
                        List for Resale
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100">
                    ✓ This ticket is in your private wallet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
