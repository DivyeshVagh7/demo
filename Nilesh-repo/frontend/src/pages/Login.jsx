import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleLoginButton } from '@/Components/ui/GoogleLoginButton';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";

const Login = () => {
  const navigate = useNavigate();
  const { login, setUser, setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      await login(formData.email.trim().toLowerCase(), formData.password);
    } catch (error) {
      console.error('Login error:', error);
      // Error handling is done in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (tokenData) => {
    setLoading(true);
    try {
      if (!tokenData || !tokenData.credential) {
        toast.error('Google authentication failed. Please try again.');
        return;
      }
      
      console.log('Sending token to backend:', tokenData);
      const response = await axios.post('api/auth/google/', { token: tokenData.credential });
      
      console.log('Backend response:', response.data);
      
      // Store tokens and user data
      const { access, refresh } = response.data.tokens;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      toast.success(response.data.message || 'Login successful!');
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data?.error 
          || error.response.data?.details 
          || error.response.data?.detail
          || 'Google login failed. Please try again.';
        toast.error(errorMsg);
      } else if (error.request) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    setLoading(false);
    
    if (error?.error === 'popup_closed_by_user') {
      toast.error('Google sign-in was cancelled.');
    } else if (error?.error === 'access_denied') {
      toast.error('Access denied. Please grant necessary permissions.');
    } else {
      toast.error('Google login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Go back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 hover:bg-card/70 text-muted-foreground border border-border/50 shadow-lg backdrop-blur-md transition-all duration-200"
      >
        <span className="text-xl leading-none">←</span>
        <span className="text-sm font-medium tracking-wide uppercase opacity-90">Go back</span>
      </button>
      
      {/* Login form card */}
      <div className="w-full max-w-md p-8 space-y-6 bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
            <span className="text-primary text-sm font-semibold">Welcome Back</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Login
          </h1>
          <p className="text-muted-foreground">Enter your email below to login to your account</p>
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogleLogin}
          onError={handleGoogleError}
          text="Sign in with Google"
          disabled={loading}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card/90 px-4 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
            />
            <div className="bg-muted/50 border border-border/30 rounded-lg p-3 mt-2">
              <p className="text-xs font-semibold text-foreground mb-2">Password must contain:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{formData.password.length >= 8 ? '✓' : '○'}</span>
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                  One uppercase letter (A-Z)
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                  One lowercase letter (a-z)
                </li>
                <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[0-9]/.test(formData.password) ? '✓' : '○'}</span>
                  One number (0-9)
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(formData.password) ? '✓' : '○'}</span>
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-foreground shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-300" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;