import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const notifiedRef = useRef(false);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    if (!notifiedRef.current) {
      notifiedRef.current = true;
      toast.error('Please sign in to continue.');
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;


