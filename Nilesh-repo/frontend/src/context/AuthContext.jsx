import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        setLoading(true);
        try {
          // Validate token and fetch user profile
          const response = await axios.get('/api/auth/profile/', {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setIsAuthenticated(false);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Validate inputs
      if (!email || !password) {
        toast.error('Please provide both email and password.');
        return false;
      }

      const response = await axios.post('/api/auth/login/', { email, password });

      const { tokens, user: userData, redirect } = response.data;

      // Check if OTP verification is required
      if (response.data.requires_verification) {
        toast.success(response.data.message);
        navigate('/verify-otp', { state: { email: response.data.email } });
        return false;
      }

      if (!tokens || !tokens.access || !tokens.refresh) {
        toast.error('Invalid response from server. Please try again.');
        return false;
      }

      const { access, refresh } = tokens;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login successful!');

      if (userData?.role === 'lawyer' && userData?.lawyer_verification_status !== 'approved') {
        navigate('/lawyer-dashboard');
      } else if (redirect) {
        navigate(`/${redirect === 'home' ? '' : redirect}`);
      } else {
        navigate('/');
      }
      return true;
    } catch (error) {
      console.error('Login failed:', error);

      if (error.response) {
        // Server responded with error
        const data = error.response.data;
        let errorMessage = 'Login failed. Please try again.';

        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.detail) {
          errorMessage = data.detail;
        } else if (data && typeof data === 'object') {
          // Handle field-specific errors
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          if (Array.isArray(firstVal)) {
            errorMessage = firstVal[0];
          } else if (typeof firstVal === 'string') {
            errorMessage = firstVal;
          }
        }

        toast.error(errorMessage);
      } else if (error.request) {
        // Request was made but no response
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else {
        // Something else happened
        toast.error('An unexpected error occurred. Please try again.');
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await axios.post('/api/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, clear local storage
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully!');
      navigate('/login');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, setUser, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
