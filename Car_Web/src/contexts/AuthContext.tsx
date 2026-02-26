"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "driver";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, role: "admin" | "driver") => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  phone: string;
  password: string;
  driver_name?: string;
  city?: string;
  vehicle_type?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string, role: "admin" | "driver") => {
    const endpoint = role === "admin" ? "/api/auth/login/admin" : "/api/auth/login/driver";
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    setUser(data.user);
    
    // Redirect based on role
    if (role === "admin") {
      router.push("/owner");
    } else {
      router.push("/driver");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      router.push("/sign-in");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const register = async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/driver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Registration failed");
    }

    // After successful registration, redirect to login
    router.push("/sign-in?registered=true");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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
