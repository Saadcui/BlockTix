import React from 'react'

function Footer() {
  return (
    <footer className="glass">
      <div className='flex flex-col sm:flex-row flex-wrap justify-between p-5'>
        <div className='flex-1 mb-4 sm:mb-0'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-2'>BlockTix</h2>
          <p className='text-sm font-semibold text-gray-600 dark:text-gray-400 sm:w-[300px]'>Decentralized event ticketing platform with blockchain security</p>
        </div>
        <div className='flex-1 mb-4 sm:mb-0'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>Users</h2>
          <ul className='list-none'>
            <li><a href="/discover" className='text-sm font-semibold no-underline text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-purple-400 transition-colors duration-300'>Discover Events</a></li>
            <li><a href="/dashboard/organizer" className='text-sm font-semibold no-underline text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-purple-400 transition-colors duration-300'>Create Event</a></li>
            <li><a href="/wallet" className='text-sm font-semibold no-underline text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-purple-400 transition-colors duration-300'>Wallet Setup</a></li>
          </ul>
        </div>
        <div className='flex-1 mb-4 sm:mb-0'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>Support</h2>
          <ul className='list-none'>
            <li><a href="/help" className='text-sm no-underline text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-purple-400 font-semibold transition-colors duration-300'>Help Center</a></li>
            <li><a href="/faq" className='text-sm no-underline text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-purple-400 font-semibold transition-colors duration-300'>FAQ</a></li>
            <li><a href="/contact" className='text-sm no-underline text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-purple-400 font-semibold transition-colors duration-300'>Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
        <p className='text-center text-sm text-gray-600 dark:text-gray-400'>© 2025 BlockTix. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer