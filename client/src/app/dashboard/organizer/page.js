
'use client'
import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [event, setEvent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [image, setImage] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      alert("You must be logged in to create an event");
      return;
    }

    if (!event || !date || !time || !location || !category) {
      alert("Please fill all required fields");
      return;
    }

    const formData = {
      event,
      date,
      time,
      location,
      category,
      price,
      totalTickets,
      image,
      organizerId: user?.uid
    };

    const res = await fetch('/api/organizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
  const data = await res.json();
  console.log(data);

  if (res.ok) {
    alert('Event created successfully!');
  } else {
    alert(`Error: ${data.message}`);
  }
};
  



  return (
     <ProtectedRoute allowedRoles={["organizer"]}>
      <h2 className='m-10'>Create Event</h2>

      <form onSubmit={handleSubmit} className='flex flex-col items-center justify-center m-4'>
      <div className='w-[400px] flex flex-col gap-4'>
        <div>
          <label htmlFor="event" className='label'>Event Name:</label>
          <input type="text" name="event" placeholder="Event Name" required className='input' onChange={(e) => setEvent(e.target.value)}/>
        </div>
        <div className='flex justify-between'>
          <div>
          <label htmlFor="date" >Date:</label>
          <input type="date" name="date" required className='input' onChange={(e) => setDate(e.target.value)}/>
          </div>
          <div>
          <label htmlFor="time">Time:</label>
          <input type="time" name="time" required className='input' onChange={(e) => setTime(e.target.value)}/>
          </div>
        </div>
        
        <div>
          <label htmlFor="location" className='label'>Event Location:</label>
          <input type="text" name="location" placeholder="Event Location" required className='input' onChange={(e) => setLocation(e.target.value)}/>
        </div>
        <div>
          <label htmlFor="category" className='label'>Event Category:</label>
          <select name="category" required className='w-[417px] input' onChange={(e) => setCategory(e.target.value)}>
            <option value="Art">Art</option>
            <option value="Sports">Sports</option>
            <option value="Food And Drink">Food And Drink</option>
            <option value="Education">Education</option>
            <option value="Festival">Festival</option>
            <option value="Music">Music</option>
            <option value="Other">Other</option>
          </select>
        </div>
          <div>
          <label htmlFor="price" className='label'>Ticket Price:</label>
          <input type="number" name="price" placeholder="Ticket Price" required className='input' onChange={(e) => setPrice(e.target.value)}/>
          </div>
          <div>
          <label htmlFor="totalTickets" className='label'>Total Tickets:</label>
          <input type="number" name="totalTickets" placeholder="Total Tickets" required className='input' onChange={(e) => setTotalTickets(e.target.value)}/>
          </div>
        <div>
          <label htmlFor="image" className='label'>Image URL (Optional)</label>
          <input type="text" name="image" placeholder='https://example.com/image.jpg' className='input' onChange={(e) => setImage(e.target.value)}/>
        </div>
        <button type="submit" className='btn w-[417px]'>Create Event</button>
      </div>
      </form>
    </ProtectedRoute>
  )

}