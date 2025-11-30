import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('api/auth/forgot-password/', { email });
      toast.success(response.data.message);
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 hover:bg-card/70 text-muted-foreground border border-border/50 shadow-lg backdrop-blur-md transition-all duration-200"
      >
        <span className="text-xl leading-none">←</span>
        <span className="text-sm font-medium tracking-wide uppercase opacity-90">Go back</span>
      </button>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
      <div className="w-full max-w-md p-8 space-y-6 bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
            <span className="text-primary text-sm font-semibold">Password Recovery</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Forgot Password
          </h1>
          <p className="text-muted-foreground">Enter your email to receive a reset code</p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-foreground shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-300" 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
