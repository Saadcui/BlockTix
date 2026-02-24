'use client';
import React, { useEffect, useState } from "react";
import Image from 'next/image';
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
  const [delisting, setDelisting] = useState(false);
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
        await refreshTickets();
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

  const refreshTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?userId=${user.uid}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets);
        // Update selectedTicket if modal is open
        if (selectedTicket) {
          const updated = data.tickets.find(t => t.ticketId === selectedTicket.ticketId);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Error refreshing tickets:', err);
    }
  };

  const handleResale = async (ticketId, price) => {
    if (!user) {
      toast.error("Please login to list tickets");
      return;
    }

    try {
      setReselling(true);
      const res = await fetch(`/api/tickets/${ticketId}/resale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'list', 
          price: parseFloat(price),
          sellerId: user.uid 
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket listed for resale! NFT is now in platform custody.");
        await refreshTickets();
      } else {
        toast.error(data.error || "Listing failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReselling(false);
    }
  };

  const handleDelist = async (ticketId) => {
    if (!user) return;

    try {
      setDelisting(true);
      const res = await fetch(`/api/tickets/${ticketId}/resale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delist',
          sellerId: user.uid
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket removed from marketplace. You can now claim it back to your wallet.");
        await refreshTickets();
      } else {
        toast.error(data.error || "Failed to delist");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDelisting(false);
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
      <div className="bg-white/70 backdrop-blur-lg border border-purple-100/40 rounded-2xl shadow-md hover:shadow-lg hover:shadow-purple-300/40 transition w-[360px] p-5 relative">
        {/* Status badges */}
        {ticket.isForResale && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow">
            Listed for Resale
          </div>
        )}
        {ticket.custodial && !ticket.isForResale && (
          <div className="absolute top-3 right-3 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow">
            Platform Custody
          </div>
        )}
        {!ticket.custodial && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow">
            In Your Wallet
          </div>
        )}

        {event.image ? (
          <div className="w-full h-48 rounded-xl mb-4 overflow-hidden relative">
            <Image
              src={event.image}
              alt="Event"
              fill
              sizes="360px"
              className="object-cover"
            />
          </div>
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
        {ticket.isForResale && (
          <p className="text-blue-600 font-medium text-sm">
            Resale Price: Rs {ticket.resalePrice}
          </p>
        )}

        <button
          onClick={() => {
            setSelectedTicket(ticket);
            setShowQrModal(true);
          }}
          className="w-full mt-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
        >
          {ticket.isForResale ? "Manage Listing" : "View Ticket / QR"}
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-8 relative overflow-hidden">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
            >
              ✕
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedTicket.eventId?.event}</h2>

              <div className="w-full flex flex-col md:flex-row rounded-3xl overflow-hidden border border-gray-100 shadow-inner bg-white mb-6">
                {/* Main body */}
                <div className="flex-1">
                  <div className="relative h-44 md:h-56 w-full">
                    {selectedTicket.eventId?.image ? (
                      <Image
                        src={selectedTicket.eventId.image}
                        alt={selectedTicket.eventId?.event || 'Event'}
                        fill
                        sizes="(max-width: 768px) 100vw, 70vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <div className="text-white font-extrabold tracking-wide text-2xl md:text-3xl leading-tight">
                        EVENT TICKET
                      </div>
                      <div className="text-white/90 text-sm mt-1 line-clamp-1">
                        {selectedTicket.eventId?.event}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Date</div>
                        <div className="text-gray-900 font-bold">
                          {selectedTicket.eventId?.date ? new Date(selectedTicket.eventId.date).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Time</div>
                        <div className="text-gray-900 font-bold">{selectedTicket.eventId?.time || '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 sm:col-span-2">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Location</div>
                        <div className="text-gray-900 font-bold line-clamp-1">{selectedTicket.eventId?.location || '—'}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Ticket Id</div>
                        <div className="text-gray-900 font-mono text-xs break-all">{selectedTicket.ticketId}</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Token Id</div>
                        <div className="text-gray-900 font-bold">{selectedTicket.tokenId ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stub */}
                <div className="w-full md:w-64 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-5 flex flex-col justify-between">
                  <div className="text-left">
                    <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Entry QR (rotates)</div>
                    <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center justify-center">
                      {qrToken ? (
                        <QRCodeCanvas value={qrToken} size={140} />
                      ) : (
                        <div className="w-[140px] h-[140px] flex items-center justify-center text-gray-400 text-sm">
                          Generating...
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      ⚠️ QR rotates every 60 seconds. Do not screenshot.
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="h-10 rounded-xl bg-white border border-gray-100 overflow-hidden flex">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full ${i % 3 === 0 ? 'w-[3px]' : 'w-[2px]'} ${i % 4 === 0 ? 'bg-gray-800' : 'bg-gray-300'}`}
                        />
                      ))}
                    </div>

                    <div className="mt-3 space-y-2 text-left text-xs">
                      <div>
                        <div className="text-gray-500">Royalty</div>
                        <div className="font-semibold text-gray-900">
                          {(() => {
                            const bps = typeof selectedTicket.royaltyBps === 'number' ? selectedTicket.royaltyBps : 0;
                            return `${Math.max(0, Math.min(1000, bps)) / 100}%`;
                          })()}
                        </div>
                      </div>

                      {selectedTicket.royaltyReceiverWallet && (
                        <div>
                          <div className="text-gray-500">Receiver</div>
                          <div className="font-mono break-all text-[11px] text-gray-800">{selectedTicket.royaltyReceiverWallet}</div>
                        </div>
                      )}

                      <div>
                        <div className="text-gray-500">Mint Tx</div>
                        <div className="font-mono break-all text-[11px] text-gray-800">{selectedTicket.txHash || '—'}</div>
                      </div>

                      <div>
                        <div className="text-gray-500">Claim Tx</div>
                        <div className="font-mono break-all text-[11px] text-gray-800">{selectedTicket.claimTxHash || '—'}</div>
                      </div>

                      <div>
                        <div className="text-gray-500">Last On-Chain Tx</div>
                        <div className="font-mono break-all text-[11px] text-gray-800">{selectedTicket.lastOnChainTxHash || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* ── CUSTODIAL TICKET (in platform custody) ── */}
                {selectedTicket.custodial ? (
                  <>
                    {/* Claim to wallet — only if NOT listed for resale */}
                    {!selectedTicket.isForResale && (
                      <button
                        onClick={() => handleClaim(selectedTicket.ticketId)}
                        disabled={claiming}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
                      >
                        {claiming ? "Transferring..." : "Claim to My MetaMask"}
                      </button>
                    )}

                    {/* List for resale — only if NOT already listed */}
                    {!selectedTicket.isForResale && (
                      <button
                        onClick={() => {
                          const p = prompt("Enter resale price (Rs):");
                          if (p && !isNaN(parseFloat(p)) && parseFloat(p) > 0) {
                            handleResale(selectedTicket.ticketId, p);
                          } else if (p) {
                            toast.error("Please enter a valid price");
                          }
                        }}
                        disabled={reselling}
                        className="w-full py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition disabled:opacity-50"
                      >
                        {reselling ? "Listing..." : "List for Resale"}
                      </button>
                    )}

                    {/* Currently listed — show status + cancel button */}
                    {selectedTicket.isForResale && (
                      <>
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                          ✓ Listed for resale at Rs {selectedTicket.resalePrice}
                        </div>
                        <button
                          onClick={() => handleDelist(selectedTicket.ticketId)}
                          disabled={delisting}
                          className="w-full py-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {delisting ? "Removing..." : "Cancel Listing & Remove from Marketplace"}
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                          After cancelling, you can claim the ticket back to your wallet.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  /* ── CLAIMED TICKET (in user's personal wallet) ── */
                  <>
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 mb-3">
                      ✓ This ticket is in your private wallet
                    </div>
                    {!selectedTicket.isForResale && (
                      <button
                        onClick={() => {
                          const p = prompt("Enter resale price (Rs):");
                          if (p && !isNaN(parseFloat(p)) && parseFloat(p) > 0) {
                            handleResale(selectedTicket.ticketId, p);
                          } else if (p) {
                            toast.error("Please enter a valid price");
                          }
                        }}
                        disabled={reselling}
                        className="w-full py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition disabled:opacity-50"
                      >
                        {reselling ? "Listing (returning to platform custody)..." : "List for Resale"}
                      </button>
                    )}
                    {selectedTicket.isForResale && (
                      <>
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                          ✓ Listed for resale at Rs {selectedTicket.resalePrice}
                        </div>
                        <button
                          onClick={() => handleDelist(selectedTicket.ticketId)}
                          disabled={delisting}
                          className="w-full py-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {delisting ? "Removing..." : "Cancel Listing & Remove from Marketplace"}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
