import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'

function OrganizerProfile() {
  return (
    <ProtectedRoute allowedRoles={['organizer']}>
      <div>OrganizerProfile</div>
    </ProtectedRoute>
  )
}

export default OrganizerProfile