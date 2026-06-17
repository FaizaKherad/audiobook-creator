'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'audiobook_user';
const USERS_DB_KEY = 'audiobook_users_db';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, name?: string) => {
    // 1. Get the 'database' of users
    const usersDbRaw = localStorage.getItem(USERS_DB_KEY);
    const usersDb: Record<string, User> = usersDbRaw ? JSON.parse(usersDbRaw) : {};

    // 2. Check if this user exists
    let currentUser: User;
    if (usersDb[email]) {
      currentUser = usersDb[email];
      // If a new name was provided during 'signup', update it
      if (name && !usersDb[email].image) {
        currentUser.name = name;
      }
    } else {
      // New user
      currentUser = {
        email,
        name: name || email.split('@')[0],
      };
    }

    // 3. Save to current session and database
    setUser(currentUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    
    usersDb[email] = currentUser;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

    // Update in the database too
    const usersDbRaw = localStorage.getItem(USERS_DB_KEY);
    const usersDb: Record<string, User> = usersDbRaw ? JSON.parse(usersDbRaw) : {};
    usersDb[user.email] = updatedUser;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
