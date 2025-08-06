import React from 'react'

function Footer() {
  return (
    <footer>
      <div className='flex flex-col sm:flex-row flex-wrap  justify-between p-5'>
        <div className='flex-1'>
          <h2>BlockTix</h2>
          <p>Decentralized event ticketing platform with blockchain security</p>
        </div>
        <div className='flex-1'>
          <h2>Users</h2>
          <ul className='list-none  '>
            <li><a href="/events" className=' no-underline text-black hover:text-[#7C3AED]'>Discover Events</a></li>
            <li><a href="/create-event" className=' no-underline text-black hover:text-[#7C3AED]'>Create Event</a></li>
            <li><a href="/wallet" className=' no-underline text-black hover:text-[#7C3AED]'>Wallet Setup</a></li>
          </ul>
        </div>
        <div className='flex-1'>
          <h2>Support</h2>
          <ul className='list-none'>
            <li><a href="/help" className='no-underline text-black hover:text-[#7C3AED]'>Help Center</a></li>
            <li><a href="/about" className='no-underline text-black hover:text-[#7C3AED]'>Learn More</a></li>
            <li><a href="/faq" className='no-underline text-black hover:text-[#7C3AED]'>FAQ</a></li>
          </ul>
        </div>
      </div>
      <div>
        <p className='text-center text-sm'>© 2025 BlockTix. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer