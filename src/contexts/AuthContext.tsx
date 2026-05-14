import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (module: 'employees' | 'trainings' | 'dashboard' | 'users', action: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  Admin: {
    employees: ['read', 'write', 'delete'],
    trainings: ['read', 'write', 'delete'],
    dashboard: ['read'],
    users: ['read', 'write', 'delete']
  },
  HR_Manager: {
    employees: ['read', 'write'],
    trainings: ['read'],
    dashboard: ['read']
  },
  LD_Admin: {
    employees: ['read'],
    trainings: ['read', 'write'],
    dashboard: ['read']
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password?: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      const data = await res.json();
      setUser(data.user);
    } catch (e) {
      throw e;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (module: string, action: string) => {
    if (!user) return false;
    const permissions = rolePermissions[user.role];
    if (!permissions || !permissions[module]) return false;
    return permissions[module].includes(action);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
