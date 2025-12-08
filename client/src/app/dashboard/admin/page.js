'use client'
import React, { useState, useEffect } from "react";
import ProtectedRoute from '../../components/ProtectedRoute';

function AdminTabs() {
  const [active, setActive] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Events
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events);
        setLoading(false);
      });
  }, []);

  // Fetch Users
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
    { key: "users", label: "Users" },
    { key: "organizers", label: "Organizers" },
    { key: "events", label: "Events" },
  ];

  const fetchUsersAgain = () => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  };

  const fetchEventsAgain = () => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events));
  };

  // DELETE USER
  const deleteUser = async (id) => {
    if (!confirm("Are you sure?")) return;

    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers(users.filter((u) => u._id !== id));
  };

  // UPDATE USER ROLE → Make Admin
  const updateUserRole = async (id) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    fetchUsersAgain();
  };

  // DELETE EVENT
  const deleteEvent = async (id) => {
    if (!confirm("Sure to delete event?")) return;

    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents(events.filter((e) => e._id !== id));
  };

  // UPDATE EVENT Example (change total tickets)
  const updateEvent = async (id) => {
    await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalTickets: 200 }),
    });
    fetchEventsAgain();
  };

  if (loading) return <p className="p-5">Loading...</p>;

  return (
    <>
      {/* Tabs Navigation */}
      <div className="mt-6 flex flex-col items-center justify-center ">
        <div className="flex gap-2 p-1 rounded-full max-w-2xl bg-white/20 backdrop-blur-md w-full">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex-1 py-2 rounded-full text-md font-bold cursor-pointer ${
                active === tab.key ? "bg-white text-black" : "bg-white/10 text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-6 p-4 border rounded-lg">

        {/* DASHBOARD */}
        {active === "dashboard" && (
          <div>
            <h2 className="text-xl font-bold mb-3">Overview</h2>
            <div className="flex flex-row gap-10">
              <p className="border p-2 rounded bg-white/20 h-20 w-40 flex flex-col justify-center text-sm">
                Total Users <strong className="text-lg">{users.length}</strong>
              </p>
              <p className="border p-2 rounded bg-white/20 h-20 w-40 flex flex-col justify-center text-sm">
                Total Organizers <strong className="text-lg">{organizers.length}</strong>
              </p>
              <p className="border p-2 rounded bg-white/20 h-20 w-40 flex flex-col justify-center text-sm">
                Total Attendees <strong className="text-lg">{attendees.length}</strong>
              </p>
            </div>
          </div>
        )}

        {/* USERS */}
        {active === "users" && (
          <div>
            <h2 className="text-xl font-bold mb-3">👥 Attendees</h2>
            {attendees.map((u) => (
              <div key={u._id} className="border p-2 rounded my-2 flex justify-between">
                <div>
                  <p><strong>Name:</strong> {u.name}</p>
                  <p><strong>Email:</strong> {u.email}</p>
                </div>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => deleteUser(u._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ORGANIZERS */}
        {active === "organizers" && (
          <div>
            <h2 className="text-xl font-bold mb-3">Organizers</h2>
            {organizers.map((u) => (
              <div key={u._id} className="border p-2 rounded my-2 flex justify-between items-center">
                <div>
                  <p><strong>Name:</strong> {u.name}</p>
                  <p><strong>Email:</strong> {u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                    onClick={() => updateUserRole(u._id)}
                  >
                    Make Admin
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EVENTS */}
        {active === "events" && (
          <div>
            <h2 className="text-xl font-bold mb-3">🎫 Events</h2>
            <div className="flex flex-wrap gap-3">
              {events.map((event) => (
                <div key={event._id} className="border p-3 rounded my-2 w-60">
                  <p><strong>{event.event}</strong></p>
                  <p>Total: {event.totalTickets}</p>
                  <p>Remaining: {event.remainingTickets}</p>

                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                      onClick={() => updateEvent(event._id)}
                    >
                      Update
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      onClick={() => deleteEvent(event._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className='p-5'>
        <h1 className='font-bold text-4xl mb-5'>Admin Dashboard</h1>
        <p className='ml-1 text-gray-600'>Welcome to the admin dashboard!</p>
        <AdminTabs />
      </div>
    </ProtectedRoute>
  );
}
