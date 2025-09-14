'use client'
import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'


export default function AdminDashboard() {

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className='p-5'>
                <h1 className='font-bold text-2xl mb-5'>Admin Dashboard</h1>
                <p>Welcome to the admin dashboard!</p>
            </div>
        </ProtectedRoute>
    )
}