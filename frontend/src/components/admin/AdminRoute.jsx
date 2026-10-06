import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname + location.search }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/app/home" replace />
  }

  return children
}

export default AdminRoute
