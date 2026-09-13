"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  api,
  UserProfile,
  ProgressData,
  StreakData,
  AttributeData,
} from "../lib/api";

interface AuthContextType {
  user: UserProfile | null;
  progress: ProgressData | null;
  streak: StreakData | null;
  attributes: AttributeData[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, title: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshStats: () => Promise<void>;
  levelUpData: { oldLevel: number; newLevel: number } | null;
  triggerLevelUp: (oldLevel: number, newLevel: number) => void;
  closeLevelUp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number } | null>(null);

  const refreshStats = async () => {
    try {
      const [progData, streakData, attrData] = await Promise.all([
        api.getProgress(),
        api.getStreak(),
        api.getAttributes(),
      ]);
      setProgress(progData);
      setStreak(streakData);
      setAttributes(attrData);
    } catch (e) {
      console.error("Failed to refresh stats:", e);
    }
  };

  const loadUserAndStats = async () => {
    try {
      setLoading(true);
      const profile = await api.getMe();
      setUser(profile);
      await refreshStats();
    } catch (e) {
      console.warn("User not logged in or token expired:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("liferpg_token");
    if (token) {
      loadUserAndStats();
    } else {
      // Auto-load demo login for frictionless review
      demoLogin();
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem("liferpg_token", res.access_token);
    await loadUserAndStats();
  };

  const register = async (email: string, pass: string, name: string, title: string) => {
    const res = await api.register(email, pass, name, title);
    localStorage.setItem("liferpg_token", res.access_token);
    await loadUserAndStats();
  };

  const demoLogin = async () => {
    try {
      await login("wanderer@liferpg.app", "password123");
    } catch (e) {
      console.warn("Demo login fallback:", e);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("liferpg_token");
    setUser(null);
    setProgress(null);
    setStreak(null);
    setAttributes([]);
  };

  const triggerLevelUp = (oldLevel: number, newLevel: number) => {
    setLevelUpData({ oldLevel, newLevel });
  };

  const closeLevelUp = () => {
    setLevelUpData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        progress,
        streak,
        attributes,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshStats,
        levelUpData,
        triggerLevelUp,
        closeLevelUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
