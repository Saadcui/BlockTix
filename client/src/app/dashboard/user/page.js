import React from 'react'
import ProtectedRoute from "../../components/ProtectedRoute";
export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div>User Dashboard</div>
    </ProtectedRoute>
  )
}
