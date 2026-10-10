import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/feedback/LoadingState';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <LoadingState message="Verifying authentication..." />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect to the appropriate dashboard for the user's role
    const roleRedirects = {
      Student: '/student/dashboard',
      Registrar: '/registrar/dashboard',
      Cashier: '/cashier/dashboard',
      'Department Staff': '/department/dashboard',
      Administrator: '/admin/dashboard'
    };
    const target = roleRedirects[currentUser.role] || '/login';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};
