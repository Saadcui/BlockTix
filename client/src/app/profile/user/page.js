import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'

function UserProfile() {
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div>UserProfile</div>
    </ProtectedRoute>
  )
}

export default UserProfile