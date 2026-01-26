"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "admin" | "viewer" | "wl_viewer";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  lastLogin: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      role: "admin",
      lastLogin: new Date().toISOString(),
    },
  },
  viewer: {
    password: "viewer123",
    user: {
      id: "2",
      username: "viewer",
      role: "viewer",
      lastLogin: new Date().toISOString(),
    },
  },
  wlviewer: {
    password: "wlviewer123",
    user: {
      id: "3",
      username: "wlviewer",
      role: "wl_viewer",
      lastLogin: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser = MOCK_USERS[username.toLowerCase()];
      if (mockUser && mockUser.password === password) {
        setUser({
          ...mockUser.user,
          lastLogin: new Date().toISOString(),
        });
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
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
