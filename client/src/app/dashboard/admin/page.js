'use client'
import React from 'react'
import { useState , useEffect } from "react";
import ProtectedRoute from '../../components/ProtectedRoute'
import { set } from 'mongoose';

function AdminTabs() {
  const [active, setActive] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events);
        setLoading(false);
      });
  }, []);

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

    if (loading) return <p className="p-5">Loading...</p>;

  return (
    <>
    <div className="mt-6 flex flex-col items-center justify-center ">
      <div className="flex gap-2 p-1 rounded-full max-w-2xl bg-white/20 backdrop-blur-md w-full">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="flex-1 py-2 rounded-full text-md font-bold border-none cursor-pointer bg-white/10 hover:bg-white/40 transition-colors duration-300"
          >
            {tab.label}
          </button>
        ))}
      </div>
     </div>
        
      {/* dashboard Area */}
      <div className="mt-6 p-4 border rounded-lg">
        {active === "dashboard" && 
        (
          <div >
            <h2 className="text-xl font-bold mb-3">Overview</h2>

            <div className="flex flex-row gap-10">
              <p className='border p-2 rounded bg-white/20  backdrop-blur-md h-20 w-40 flex flex-col justify-center gap-2 text-zinc-600 text-sm'>Total Users <strong className='text-black text-lg'> {users.length}</strong></p>
              <p className='border p-2 rounded bg-white/20  backdrop-blur-md h-20 w-40 flex flex-col justify-center gap-2 text-zinc-600 text-sm'>Total Organizers <strong className='text-black text-lg'> {organizers.length}</strong></p>
              <p className='border p-2 rounded bg-white/20  backdrop-blur-md h-20 w-40 flex flex-col justify-center gap-2 text-zinc-600 text-sm'>Total Attendees <strong className='text-black text-lg'> {attendees.length}</strong></p>
            </div>
          </div>
        )}



        {active === "users" && 
        (
          <div>
            <h2 className="text-xl font-bold mb-3">👥 Attendees</h2>

            {attendees.length === 0 ? (
              <p>No attendees found.</p>
            ) : (
              attendees.map((u) => (
                <div key={u._id} className="border p-2 rounded my-2">
                  <p><strong>Name:</strong> {u.name}</p>
                  <p><strong>Email:</strong> {u.email}</p>
                </div>
              ))
            )}
          </div>
        )}



        {active === "organizers" && 
        
        (
          <div>
            <h2 className="text-xl font-bold mb-3">🧑‍💼 Organizers</h2>

            {organizers.length === 0 ? (
              <p>No organizers found.</p>
            ) : (
              organizers.map((u) => (
                <div key={u._id} className="border p-2 rounded my-2">
                  <p><strong>Name:</strong> {u.name}</p>
                  <p><strong>Email:</strong> {u.email}</p>
                </div>
              ))
            )}
          </div>
        )}



        {/*Events*/}
        {active === "events" && (
          <div>
          <h2 className="text-xl font-bold mb-3">🎫 Events</h2>
          <div className='flex flex-wrap gap-2'>
          {events.length === 0 ? (
            <p>No events found.</p>
          ) : (
            
            events.map((event) => (

              <div key={event._id} className="border p-2 rounded my-2 ">
                <p>Name: {event.event}</p>
                <p>Total Tickets: {event.totalTickets}</p>
                <p>Remaining Tickets: {event.remainingTickets}</p>
              </div>
            ))
            
            )}

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
                <p className='ml-5 text-zinc-600 '>Welcome to the admin dashboard!</p>
                <AdminTabs />
            </div>
        </ProtectedRoute>
    )
}