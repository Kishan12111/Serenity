'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { WallpaperBackground } from '@/components/wallpaper-background';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const result = await signUp(formData.email, formData.password, formData.name || undefined);
        if (result.success) {
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => router.push('/'), 1500);
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          setSuccess('Welcome back! Redirecting...');
          setTimeout(() => router.push('/'), 1000);
        } else {
          setError(result.error || 'Invalid email or password');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'Free focus statistics tracking',
    'Beautiful anime-inspired themes',
    'Pomodoro technique timer',
    'Daily streaks & achievements',
    'Cloud sync across devices',
  ];

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background */}
      <WallpaperBackground scene="night-sky" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col lg:flex-row">
        {/* Left side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-16">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 relative">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <defs>
                    <linearGradient id="authAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7"/>
                      <stop offset="100%" stopColor="#ec4899"/>
                    </linearGradient>
                    <linearGradient id="authGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc"/>
                      <stop offset="100%" stopColor="#f472b6"/>
                    </linearGradient>
                  </defs>
                  <rect width="32" height="32" rx="8" fill="#0f0f1a"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="url(#authAccent)" strokeWidth="1.5" opacity="0.3"/>
                  <circle cx="16" cy="16" r="9" fill="none" stroke="url(#authGlow)" strokeWidth="2.5" opacity="0.2"/>
                  <circle cx="16" cy="16" r="9" fill="none" stroke="url(#authAccent)" strokeWidth="2.5" 
                          strokeDasharray="42 57" strokeLinecap="round" transform="rotate(-90 16 16)"/>
                  <circle cx="16" cy="16" r="5" fill="#0f0f1a" stroke="url(#authAccent)" strokeWidth="0.5" opacity="0.8"/>
                  <text x="16" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="url(#authGlow)">S</text>
                  <circle cx="26" cy="5" r="1.5" fill="#fbbf24"/>
                  <circle cx="5" cy="7" r="1" fill="#fbbf24" opacity="0.8"/>
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-3xl">Serinity</h1>
                <p className="text-white/60 text-sm">Focus Companion</p>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="text-white/95 text-2xl xl:text-3xl font-semibold leading-tight mb-4">
              The world's first <span className="text-purple-400">free</span> ambient focus timer with beautiful statistics
            </h2>
            <p className="text-white/60 text-lg mb-8">
              Transform your study sessions with anime-inspired aesthetics and the proven Pomodoro technique.
            </p>

            {/* Features */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                  <span className="text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            {/* Stats teaser */}
            <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/50 text-sm mb-2">Join thousands of focused learners</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-white">10K+</p>
                  <p className="text-white/50 text-xs">Active Users</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">1M+</p>
                  <p className="text-white/50 text-xs">Focus Hours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-white/50 text-xs">Free Forever</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 relative">
                <svg viewBox="0 0 32 32" className="w-full h-full">
                  <defs>
                    <linearGradient id="authMobileAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7"/>
                      <stop offset="100%" stopColor="#ec4899"/>
                    </linearGradient>
                    <linearGradient id="authMobileGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc"/>
                      <stop offset="100%" stopColor="#f472b6"/>
                    </linearGradient>
                  </defs>
                  <rect width="32" height="32" rx="8" fill="#0f0f1a"/>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="url(#authMobileAccent)" strokeWidth="1.5" opacity="0.3"/>
                  <circle cx="16" cy="16" r="9" fill="none" stroke="url(#authMobileGlow)" strokeWidth="2.5" opacity="0.2"/>
                  <circle cx="16" cy="16" r="9" fill="none" stroke="url(#authMobileAccent)" strokeWidth="2.5" 
                          strokeDasharray="42 57" strokeLinecap="round" transform="rotate(-90 16 16)"/>
                  <circle cx="16" cy="16" r="5" fill="#0f0f1a" stroke="url(#authMobileAccent)" strokeWidth="0.5" opacity="0.8"/>
                  <text x="16" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="url(#authMobileGlow)">S</text>
                  <circle cx="26" cy="5" r="1.5" fill="#fbbf24"/>
                  <circle cx="5" cy="7" r="1" fill="#fbbf24" opacity="0.8"/>
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-2xl">Serinity</h1>
                <p className="text-white/60 text-xs">Focus Companion</p>
              </div>
            </div>

            {/* Auth Card */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    !isSignUp
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    isSignUp
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <Label htmlFor="name" className="text-white/70 text-sm mb-1.5 block">
                      Name (optional)
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="email" className="text-white/70 text-sm mb-1.5 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-white/70 text-sm mb-1.5 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-white/70 text-sm mb-1.5 block">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10"
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20 py-5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Continue without account */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/')}
                className="w-full text-white/60 hover:text-white hover:bg-white/5"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Continue without account
              </Button>

              <p className="text-white/40 text-xs text-center mt-4">
                {isSignUp 
                  ? 'By signing up, you agree to save your focus data securely in the cloud.'
                  : 'Your progress will be synced across all your devices.'}
              </p>
            </div>

            {/* Mobile features */}
            <div className="lg:hidden mt-6 text-center">
              <p className="text-white/50 text-sm mb-3">Why create an account?</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Free stats', 'Cloud sync', 'Streaks'].map((f) => (
                  <span key={f} className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-xs">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
