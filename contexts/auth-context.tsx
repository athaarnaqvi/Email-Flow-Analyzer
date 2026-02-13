"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type UserRole = "admin" | "viewer" | "whitelist";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, msisdn: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from localStorage on mount (if token exists)
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (token) {
          // Optionally verify token with backend, for now trust localStorage
          const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
          if (userStr) {
            setUser(JSON.parse(userStr));
          }
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        // Send as email field, but backend will treat it as either email or username
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailOrUsername, password }),
        });

        if (!response.ok) {
          setIsLoading(false);
          return false;
        }

        const data = await response.json();
        if (data.success && data.token && data.user) {
          // Store token in localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", data.token);
            const userData: User = {
              id: data.user.email,
              email: data.user.email,
              role: data.user.role,
              lastLogin: new Date().toISOString(),
            };
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
          }
          setIsLoading(false);
          return true;
        }

        setIsLoading(false);
        return false;
      } catch (error) {
        console.error("Login error:", error);
        setIsLoading(false);
        return false;
      }
    },
    []
  );

  const signup = useCallback(
    async (username: string, email: string, msisdn: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, msisdn, password }),
        });

        const data = await response.json();
        setIsLoading(false);

        if (response.ok && data.success) {
          return { success: true };
        }

        return { success: false, error: data.error || "Signup failed" };
      } catch (error) {
        console.error("Signup error:", error);
        setIsLoading(false);
        return { success: false, error: "An error occurred during signup" };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  }, []);

  const hasPermission = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      if (!user) return false;
      return requiredRoles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
