"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from '@/context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function AdminTabs() {
  const { user } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actingOnEventId, setActingOnEventId] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- LOGIC STARTS: STRICTLY UNTOUCHED ---
  useEffect(() => {
    if (!user?.uid) return;
    fetch(`/api/events?includeAll=1&adminId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events);
        setLoading(false);
      });
  }, [user?.uid]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  const attendees = users.filter((u) => u.role === "user");
  const organizers = users.filter((u) => u.role === "organizer");

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Attendees" },
    { key: "organizers", label: "Organizers" },
    { key: "approvals", label: "Approvals" },
    { key: "events", label: "Events" },
  ];

  const fetchUsersAgain = () => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  const fetchEventsAgain = useCallback(() => {
    if (!user?.uid) return;
    fetch(`/api/events?includeAll=1&adminId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => setEvents(data.events));
  }, [user?.uid]);

  const fetchPendingEventsAgain = useCallback(() => {
    if (!user?.uid) return;
    setLoadingPending(true);
    fetch(`/api/admin/events/requests?adminId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => setPendingEvents(data.events || []))
      .finally(() => setLoadingPending(false));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    fetchPendingEventsAgain();
  }, [user?.uid, fetchPendingEventsAgain]);

  const approveEvent = async (eventId) => {
    if (!user?.uid) return;
    setActingOnEventId(eventId);
    try {
      await fetch('/api/admin/events/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.uid, eventId, action: 'approve' }),
      });
      fetchPendingEventsAgain();
      fetchEventsAgain();
    } finally {
      setActingOnEventId(null);
    }
  };

  const rejectEvent = async (eventId) => {
    if (!user?.uid) return;
    const reason = prompt('Rejection reason (optional):') || '';
    setActingOnEventId(eventId);
    try {
      await fetch('/api/admin/events/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.uid, eventId, action: 'reject', rejectionReason: reason }),
      });
      fetchPendingEventsAgain();
      fetchEventsAgain();
    } finally {
      setActingOnEventId(null);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers(users.filter((u) => u._id !== id));
  };

  const updateUserRole = async (id) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    fetchUsersAgain();
  };

  const deleteEvent = async (id) => {
    if (!confirm("Sure to delete event?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents(events.filter((e) => e._id !== id));
  };

  const updateEvent = async (id) => {
    await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalTickets: 200 }),
    });
    fetchEventsAgain();
  };
  // --- LOGIC ENDS ---

  // --- NEW: CALCULATIONS FOR CHARTS ---
  const stats = useMemo(() => {
    // 1. Calculate Event Performance (Tickets Sold vs Total)
    const eventPerformance = events.map((e) => ({
      name: e.event,
      sold: e.totalTickets - e.remainingTickets,
      remaining: e.remainingTickets,
      total: e.totalTickets,
    }));

    // 2. User Distribution Data
    const userDistribution = [
      { name: "Attendees", value: attendees.length },
      { name: "Organizers", value: organizers.length },
      { name: "Admins", value: users.length - attendees.length - organizers.length },
    ];

    // 3. Global Stats
    const totalTicketsAvailable = events.reduce((acc, curr) => acc + curr.totalTickets, 0);
    const totalTicketsSold = events.reduce((acc, curr) => acc + (curr.totalTickets - curr.remainingTickets), 0);
    const sellRate = totalTicketsAvailable > 0 ? ((totalTicketsSold / totalTicketsAvailable) * 100).toFixed(1) : 0;

    return { eventPerformance, userDistribution, totalTicketsSold, sellRate };
  }, [events, users, attendees, organizers]);

  const cardClass = "bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-3">Menu</p>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active === tab.key
                      ? 'bg-purple-50 text-purple-700 border border-purple-100'
                      : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <section className="lg:col-span-9">
        {/* DASHBOARD - ENHANCED WITH CHARTS */}
        {active === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Analytics</h2>
            
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className={cardClass}>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{users.length}</p>
                <div className="mt-2 text-xs text-green-600 font-medium">Active Accounts</div>
              </div>
              <div className={cardClass}>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Events</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{events.length}</p>
                <div className="mt-2 text-xs text-indigo-600 font-medium">Currently Live</div>
              </div>
              <div className={cardClass}>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Tickets Sold</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.totalTicketsSold}</p>
                <div className="mt-2 text-xs text-emerald-600 font-medium">Confirmed Sales</div>
              </div>
              <div className={cardClass}>
                <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Sell-out Rate</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.sellRate}%</p>
                <div className="mt-2 text-xs text-orange-600 font-medium">Avg. Capacity Reached</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Sales Performance */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Ticket Sales per Event</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.eventPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" hide /> {/* Hiding X labels if names are long */}
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="sold" name="Tickets Sold" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remaining" name="Remaining" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: User Demographics */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">User Roles Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.userDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.userDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Top Performing Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800">Top Performing Events (by Sales)</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-600">
                   <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                     <tr>
                       <th className="px-6 py-3">Event Name</th>
                       <th className="px-6 py-3 text-center">Sold</th>
                       <th className="px-6 py-3 text-center">Total</th>
                       <th className="px-6 py-3 text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {stats.eventPerformance
                        .sort((a, b) => b.sold - a.sold)
                        .slice(0, 5)
                        .map((event, i) => (
                       <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-4 font-medium text-gray-900">{event.name}</td>
                         <td className="px-6 py-4 text-center">{event.sold}</td>
                         <td className="px-6 py-4 text-center">{event.total}</td>
                         <td className="px-6 py-4 text-right">
                           {event.remaining === 0 ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                               Sold Out
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                               Available
                             </span>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* USERS / ORGANIZERS (UNCHANGED LOGIC) */}
        {(active === "users" || active === "organizers") && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {active === "users" ? "Attendee Management" : "Organizer Management"}
            </h2>
            {(() => {
              const rows = active === 'users' ? attendees : organizers;
              const isOrganizerView = active === 'organizers';

              if (rows.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    No {active === "users" ? "attendees" : "organizers"} found.
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800">
                      {active === 'users' ? 'Attendees' : 'Organizers'}
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                        <tr>
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Role</th>
                          {isOrganizerView && (
                            <>
                              <th className="px-6 py-3">Wallet</th>
                              <th className="px-6 py-3 text-right">Royalty Balance</th>
                              <th className="px-6 py-3 text-center">Default Royalty</th>
                            </>
                          )}
                          <th className="px-6 py-3">Created</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {rows.map((u) => (
                          <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                              {u.name}
                            </td>
                            <td className="px-6 py-4">
                              <div className="truncate max-w-[260px]">{u.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {u.role}
                              </span>
                            </td>

                            {isOrganizerView && (
                              <>
                                <td className="px-6 py-4">
                                  <div className="truncate max-w-[220px] text-xs text-gray-700">
                                    {u.walletAddress || '—'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900 whitespace-nowrap">
                                  Rs {Number(u.royaltyBalance || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                  {typeof u.defaultRoyaltyBps === 'number'
                                    ? `${(u.defaultRoyaltyBps / 100).toFixed(2)}%`
                                    : '—'}
                                </td>
                              </>
                            )}

                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                {isOrganizerView && (
                                  <button
                                    onClick={() => updateUserRole(u._id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                  >
                                    Make Admin
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteUser(u._id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* EVENTS (UNCHANGED LOGIC) */}
        {active === "events" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Management</h2>
            {events.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No events created yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((event) => {
                  const soldOut = event.remainingTickets === 0;
                  const availability = ((event.totalTickets - event.remainingTickets) / event.totalTickets) * 100;

                  return (
                    <div key={event._id} className={cardClass}>
                      <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-1">{event.event}</h3>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Tickets</span>
                          <span>{event.remainingTickets} left</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              soldOut ? "bg-red-500" : availability > 80 ? "bg-orange-500" : "bg-green-500"
                            }`}
                            style={{ width: `${100 - availability}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.totalTickets - event.remainingTickets} sold of {event.totalTickets}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => updateEvent(event._id)}
                          className="flex-1 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => deleteEvent(event._id)}
                          className="px-3 py-2 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* APPROVAL REQUESTS */}
        {active === 'approvals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Event Approval Requests</h2>
                <p className="text-gray-600 mt-1">New events created by organizers must be approved before they go live.</p>
              </div>
              <button
                onClick={fetchPendingEventsAgain}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-800">Pending Requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Organizer</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-center">Tickets</th>
                      <th className="px-6 py-3">Submitted</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingPending ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                          Loading requests...
                        </td>
                      </tr>
                    ) : pendingEvents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                          No pending approval requests.
                        </td>
                      </tr>
                    ) : (
                      pendingEvents.map((e) => {
                        const orgName = e.organizer?.name || e.organizerId || 'Unknown';
                        const orgEmail = e.organizer?.email || '';
                        const submitted = e.submittedAt || e.createdAt;
                        return (
                          <tr key={e._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{e.event}</div>
                              <div className="text-xs text-gray-500">ID: {e.eventId}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{orgName}</div>
                              {orgEmail ? <div className="text-xs text-gray-500">{orgEmail}</div> : null}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{e.location}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {e.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">Rs {e.price}</td>
                            <td className="px-6 py-4 text-center">{e.totalTickets}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {submitted ? new Date(submitted).toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  disabled={actingOnEventId === e._id}
                                  onClick={() => approveEvent(e._id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={actingOnEventId === e._id}
                                  onClick={() => rejectEvent(e._id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </section>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, organizers, and events</p>
            </div>
            
          </div>
        </header>

        <AdminTabs />
      </div>
    </ProtectedRoute>
  );
}