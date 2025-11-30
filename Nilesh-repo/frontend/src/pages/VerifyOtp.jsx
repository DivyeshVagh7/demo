import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const email = location.state?.email;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (!email) {
    toast.error('No email provided for OTP verification. Please sign up again.');
    navigate('/signup');
    return null;
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('api/auth/verify-otp/', { email, otp_code: otp });
      toast.success(response.data.message);
      
      // Store tokens and user data if provided
      if (response.data.tokens) {
        const { access, refresh } = response.data.tokens;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setUser(response.data.user);
        setIsAuthenticated(true);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post('api/auth/resend-otp/', { email });
      toast.success(response.data.message);
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
      <Card className="w-full max-w-md bg-card/40 backdrop-blur-sm border border-border/50 relative z-10 animate-fade-in">
        <CardHeader className="text-center">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-primary text-xs font-medium">Email Verification</span>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground mb-2">
            Verify OTP
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            An OTP has been sent to <span className="font-medium text-primary">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="relative">
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                className="w-full text-center text-2xl tracking-[0.5em] bg-input border-border/50 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 font-mono"
                required
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">Enter the 6-digit code</p>
            </div>
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-foreground transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
            <Button
              variant="link"
              onClick={handleResendOtp}
              disabled={loading}
              className="text-primary hover:text-primary/80 transition-colors duration-200"
            >
              Resend OTP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOtp;
