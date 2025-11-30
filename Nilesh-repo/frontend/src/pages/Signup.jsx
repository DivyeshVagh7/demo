import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { GoogleLoginButton } from '@/Components/ui/GoogleLoginButton';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";

const Signup = () => {
const navigate = useNavigate();
const [accountType, setAccountType] = useState('client');
const { setUser, setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
    phone: '',
    license_number: '',
    bar_council_id: '',
    education: '',
    experience_years: '',
    law_firm: '',
    specializations: '',
    consultation_fee: '',
    bio: '',
    verification_documents: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      
      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push('one lowercase letter');
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push('one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(formData.password)) {
        passwordErrors.push('one special character');
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    // Lawyer-specific validation
    if (accountType === 'lawyer') {
      if (!formData.license_number.trim()) {
        newErrors.license_number = 'License Number is required for lawyers';
      }
      if (!formData.bar_council_id.trim()) {
        newErrors.bar_council_id = 'Bar Council ID is required for lawyers';
      }
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
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        role: accountType,
      };

      if (accountType === 'lawyer') {
        payload.experience_years = formData.experience_years ? Number(formData.experience_years) : 0;
        payload.specializations = formData.specializations
          ? formData.specializations.split(',').map(item => item.trim()).filter(Boolean)
          : [];
        payload.verification_documents = formData.verification_documents
          ? formData.verification_documents.split(',').map(item => item.trim()).filter(Boolean)
          : [];
      } else {
        [
          'license_number',
          'bar_council_id',
          'education',
          'experience_years',
          'law_firm',
          'specializations',
          'consultation_fee',
          'bio',
          'verification_documents',
        ].forEach((field) => delete payload[field]);
      }

      const response = await axios.post('/api/auth/signup/', payload);
      toast.success(response.data.message);
      
      if (response.data.requires_verification) {
        navigate('/verify-otp', { state: { email: response.data.email } });
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.response) {
        const data = error.response.data;
        
        // Handle validation errors (field-specific)
        if (data && typeof data === 'object' && !data.error) {
          const fieldErrors = {};
          let hasFieldErrors = false;
          
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (Array.isArray(value)) {
              fieldErrors[key] = value[0];
              hasFieldErrors = true;
            } else if (typeof value === 'string') {
              fieldErrors[key] = value;
              hasFieldErrors = true;
            }
          });
          
          if (hasFieldErrors) {
            setErrors(fieldErrors);
            return;
          }
        }
        
        // Handle general error messages
        let message = 'Signup failed. Please try again.';
        if (typeof data === 'string') {
          message = data;
        } else if (data?.error) {
          message = data.error;
        } else if (data?.detail) {
          message = data.detail;
        }
        
        toast.error(message);
      } else if (error.request) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (tokenData) => {
    setLoading(true);
    try {
      if (!tokenData || !tokenData.credential) {
        toast.error('Google authentication failed. Please try again.');
        return;
      }
      
      console.log('Sending token to backend:', tokenData);
      const response = await axios.post('/api/auth/google/', { token: tokenData.credential });
      
      console.log('Backend response:', response.data);
      
      // Store tokens and user data
      const { access, refresh } = response.data.tokens;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      toast.success(response.data.message || 'Signup successful!');
      navigate('/');
    } catch (error) {
      console.error('Google signup error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data?.error 
          || error.response.data?.details 
          || error.response.data?.detail
          || 'Google signup failed. Please try again.';
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
    toast.error('Google signup failed. Please try again.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-8">
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
      
      {/* Signup form card */}
      <div className="w-full max-w-md p-8 space-y-6 bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
            <span className="text-primary text-sm font-semibold">Get Started</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Create an account
          </h1>
          <p className="text-muted-foreground">Enter your information to create an account</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={accountType === 'client' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setAccountType('client')}
            disabled={loading}
          >
            I'm a client
          </Button>
          <Button
            type="button"
            variant={accountType === 'lawyer' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setAccountType('lawyer')}
            disabled={loading}
          >
            I'm a lawyer
          </Button>
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogleSignup}
          onError={handleGoogleError}
          text="Sign up with Google"
          disabled={loading}
        />

        <div className="relative">
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card/90 px-4 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="John Doe" 
                required 
                value={formData.name} 
                onChange={handleInputChange} 
                disabled={loading}
                className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">Username</Label>
              <Input 
                id="username" 
                name="username" 
                placeholder="johndoe" 
                required 
                value={formData.username} 
                onChange={handleInputChange} 
                disabled={loading}
                className={`bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 ${errors.username ? 'border-red-500' : ''}`}
              />
              {errors.username && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mt-1">
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.username}</p>
                </div>
              )}
            </div>
          </div>
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
              className={`bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mt-1">
                <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="Enter password"
              required 
              value={formData.password} 
              onChange={handleInputChange} 
              disabled={loading}
              className={`bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{errors.password}</p>
              </div>
            )}
            <div className="bg-muted/50 border border-border/30 rounded-lg p-3 mt-2">
              <p className="text-xs font-semibold text-foreground mb-2">Password must contain:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span className={formData.password.length >= 8 ? '✓' : '○'}>
                    {formData.password.length >= 8 ? '✓' : '○'}
                  </span>
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
          <div className="space-y-2">
            <Label htmlFor="password2" className="text-foreground font-medium">Confirm Password</Label>
            <Input 
              id="password2" 
              name="password2" 
              type="password" 
              placeholder="Enter password"
              required 
              value={formData.password2} 
              onChange={handleInputChange} 
              disabled={loading}
              className={`bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 ${errors.password2 ? 'border-red-500' : ''}`}
            />
            {errors.password2 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mt-2">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <span>⚠</span>
                  {errors.password2}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground font-medium">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+91-XXXXXXXXXX"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
              className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
            />
          </div>

          {accountType === 'lawyer' && (
            <div className="space-y-6 border border-border/60 rounded-xl p-4 bg-card/40">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Professional Information</h2>
                <p className="text-xs text-muted-foreground">
                  Provide accurate information so our team can verify your credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number" className="text-foreground font-medium">License Number *</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    placeholder="State Bar License Number"
                    required={accountType === 'lawyer'}
                    value={formData.license_number}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 ${errors.license_number ? 'border-red-500' : ''}`}
                  />
                  {errors.license_number && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mt-1">
                      <p className="text-xs text-red-600 dark:text-red-400">{errors.license_number}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bar_council_id" className="text-foreground font-medium">Bar Council ID *</Label>
                  <Input
                    id="bar_council_id"
                    name="bar_council_id"
                    placeholder="Bar Council Registration ID"
                    required={accountType === 'lawyer'}
                    value={formData.bar_council_id}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 ${errors.bar_council_id ? 'border-red-500' : ''}`}
                  />
                  {errors.bar_council_id && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mt-1">
                      <p className="text-xs text-red-600 dark:text-red-400">{errors.bar_council_id}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education" className="text-foreground font-medium">Education</Label>
                  <Input
                    id="education"
                    name="education"
                    placeholder="LLB, LLM..."
                    value={formData.education}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_years" className="text-foreground font-medium">Years of Experience</Label>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="law_firm" className="text-foreground font-medium">Law Firm / Practice</Label>
                  <Input
                    id="law_firm"
                    name="law_firm"
                    placeholder="Firm name or Independent"
                    value={formData.law_firm}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultation_fee" className="text-foreground font-medium">Consultation Fee</Label>
                  <Input
                    id="consultation_fee"
                    name="consultation_fee"
                    placeholder="e.g. ₹1500/hour"
                    value={formData.consultation_fee}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specializations" className="text-foreground font-medium">Specializations</Label>
                <Input
                  id="specializations"
                  name="specializations"
                  placeholder="Separate with commas e.g. Corporate Law, Family Law"
                  value={formData.specializations}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground font-medium">Professional Bio</Label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  placeholder="Describe your experience, notable cases, or approach to clients."
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full rounded-md border border-border/50 bg-input text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300 p-3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification_documents" className="text-foreground font-medium">Verification Documents</Label>
                <Input
                  id="verification_documents"
                  name="verification_documents"
                  placeholder="Links to certifications or proofs (comma separated URLs)"
                  value={formData.verification_documents}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="bg-input border-border/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-300"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-foreground shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-300" 
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;