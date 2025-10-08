
'use client'
import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

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

  // Early Bird Ticketing States
  const [ebEnabled, setEbEnabled] = useState(false);
  const [ebPrice, setEbPrice] = useState(0);
  const [ebEndDate, setEbEndDate] = useState('');
  const [ebMaxTickets, setEbMaxTickets] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error("You must be logged in to create an event");
      return;
    }
    if (price < 0 || totalTickets < 0) {
      toast.error("Price and Total Tickets must be non-negative");
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
      organizerId: user?.uid,
      earlyBird: ebEnabled ? {
        enabled: true,
        discountPrice: ebPrice,
        endDate: ebEndDate || null,
        maxTickets: ebMaxTickets || null,
        soldCount: 0
      } : { enabled: false }

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

      <form onSubmit={handleSubmit} className='flex flex-col items-center justify-cente'>
      <div className='flex flex-col sm:flex-row  items-center justify-center gap-6 bg-white/10 backdrop:blur-md rounded-lg p-6 '>
      <div className='left w-1/2 m-4'>
        <div>
          <label htmlFor="event" className='label'>Event Name:</label>
          <input type="text" name="event" placeholder="Event Name" required className='input' onChange={(e) => setEvent(e.target.value)}/>
        </div>
        <div className='flex justify-between gap-3'>
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
          <select name="category" required className='input' onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select Category</option>
            <option value="Art">Art</option>
            <option value="Sports">Sports</option>
            <option value="Food And Drink">Food And Drink</option>
            <option value="Education">Education</option>
            <option value="Festival">Festival</option>
            <option value="Music">Music</option>
            <option value="Other">Other</option>
          </select>
        </div>
        </div>


        <div className='right w-1/2 m-4 '>
          <div>
          <label htmlFor="price" className='label'>Ticket Price:</label>
          <input type="number" name="price" placeholder="Ticket Price" required className='input' min="0" onChange={(e) => setPrice(e.target.value)}/>
          </div>
          <div>
          <label htmlFor="totalTickets" className='label'>Total Tickets:</label>
          <input type="number" name="totalTickets" placeholder="Total Tickets" required className='input' min="0" onChange={(e) => setTotalTickets(e.target.value)}/>
          </div>
        <div>
          <label htmlFor="image" className='label'>Image URL (Optional)</label>
          <input type="text" name="image" placeholder='https://example.com/image.jpg' className='input' onChange={(e) => setImage(e.target.value)}/>
        </div>

        <div className="border-t border-gray-400 pt-4 mt-4">
            <label className="flex items-center gap-2 text">
              <input
                type="checkbox"
                checked={ebEnabled}
                onChange={(e) => setEbEnabled(e.target.checked)}
              />
              Enable Early Bird Discount
            </label>

            {ebEnabled && (
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <label className="label">Discount Price:</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="Discounted Ticket Price"
                    onChange={(e) => setEbPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">End Date (Optional):</label>
                  <input
                    type="date"
                    className="input"
                    onChange={(e) => setEbEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Max Discounted Tickets (Optional):</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="Quota"
                    onChange={(e) => setEbMaxTickets(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
          </div>


      </div>
      <button type="submit" className='btn w-[417px]'>Create Event</button>

      </form>
    </ProtectedRoute>
  )

}