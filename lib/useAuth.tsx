"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface User {
  _id: string;
  email: string;
  name?: string;
  visitorId?: string;
  role?: string;
  createdAt: number;
  lastActiveAt: number;
  settings: {
    wallpaper: string;
    customMinutes: string;
    isPomodoro: boolean;
    pomodoroSettings: {
      focusTime: number;
      shortBreak: number;
      longBreak: number;
    };
  };
  streak: {
    currentStreak: number;
    bestStreak: number;
    lastActivityDate: string;
  };
  lifetimeTotals: {
    totalFocusSeconds: number;
    totalBreakSeconds: number;
    totalSessions: number;
  };
  recentSessions?: Array<{
    startedAt: number;
    endedAt: number;
    durationMinutes: number;
    mode: string;
    completed: boolean;
    label?: string;
    labelCategory?: string;
    startHour?: number;
  }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (name: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "serenity_auth";
const VISITOR_ID_KEY = "serenity_visitor_id";

function generateVisitorId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `visitor_${timestamp}_${randomPart}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  // Convex mutations
  const signUpMutation = useMutation(api.auth.signUp);
  const signInMutation = useMutation(api.auth.signIn);
  const getOrCreateAnonymousMutation = useMutation(api.auth.getOrCreateAnonymousUser);

  // Query current user
  const user = useQuery(
    api.auth.getCurrentUser,
    userEmail ? { email: userEmail } : "skip"
  );

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored auth
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuth) {
          const { email } = JSON.parse(storedAuth);
          setUserEmail(email);
        } else {
          // Get or create visitor ID for anonymous usage
          let vid = localStorage.getItem(VISITOR_ID_KEY);
          if (!vid) {
            vid = generateVisitorId();
            localStorage.setItem(VISITOR_ID_KEY, vid);
          }
          setVisitorId(vid);
          
          // Create anonymous user in database
          await getOrCreateAnonymousMutation({ visitorId: vid });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [getOrCreateAnonymousMutation]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      const result = await signUpMutation({
        email,
        password,
        name,
        visitorId: visitorId || undefined,
      });

      if (result.success) {
        setUserEmail(email);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email }));
        // Clear visitor ID since user is now authenticated
        localStorage.removeItem(VISITOR_ID_KEY);
        setVisitorId(null);
        return { success: true };
      }
      return { success: false, error: "Sign up failed" };
    } catch (error: any) {
      // Clean up error messages for better UX
      const rawError = error.message || "Sign up failed";
      let cleanError = rawError.replace(/^Uncaught Error:\s*/i, '').trim();
      
      // Format specific error types
      if (cleanError.toLowerCase().includes('already exists')) {
        cleanError = 'An account with this email already exists';
      }
      
      return { success: false, error: cleanError };
    } finally {
      setIsLoading(false);
    }
  }, [signUpMutation, visitorId]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signInMutation({ email, password });

      if (result.success) {
        setUserEmail(email);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email }));
        // Clear visitor ID since user is now authenticated
        localStorage.removeItem(VISITOR_ID_KEY);
        setVisitorId(null);
        return { success: true };
      }
      return { success: false, error: "Sign in failed" };
    } catch (error: any) {
      // Clean up error messages for better UX
      const rawError = error.message || "Invalid email or password";
      let cleanError = rawError.replace(/^Uncaught Error:\s*/i, '').trim();
      
      // Format specific error types
      if (cleanError.toLowerCase().includes('banned')) {
        const reason = cleanError.split(':')[1]?.trim();
        cleanError = reason ? `Account banned: ${reason}` : 'Your account has been banned. Contact support for help.';
      } else if (cleanError.toLowerCase().includes('invalid email') || cleanError.toLowerCase().includes('invalid password')) {
        cleanError = 'Invalid email or password';
      }
      
      return { success: false, error: cleanError };
    } finally {
      setIsLoading(false);
    }
  }, [signInMutation]);

  const signOut = useCallback(() => {
    setUserEmail(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // Generate new visitor ID for anonymous usage
    const newVisitorId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, newVisitorId);
    setVisitorId(newVisitorId);
    
    // Refresh the page to reset state
    window.location.reload();
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    if (!userEmail) {
      return { success: false, error: "Not authenticated" };
    }
    // Profile update is handled through the users mutation
    return { success: true };
  }, [userEmail]);

  const value: AuthContextType = {
    user: user as User | null,
    isLoading: isLoading || (userEmail !== null && user === undefined),
    isAuthenticated: userEmail !== null && user !== null && user !== undefined && !user.email.startsWith("anonymous_"),
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to get user identifier (email for authenticated, visitorId for anonymous)
export function useUserIdentifier(): { email?: string; visitorId?: string } | null {
  const { user, isAuthenticated } = useAuth();
  
  if (!user) return null;
  
  if (isAuthenticated) {
    return { email: user.email };
  }
  
  return { visitorId: user.visitorId };
}
