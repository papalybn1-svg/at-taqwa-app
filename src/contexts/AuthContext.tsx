import React, { createContext, useContext } from 'react';
import { useAuth as useAuthInternal, AuthUser, UserRole } from '../hooks/useAuth';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: () => boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Utiliser le hook interne UNE SEULE FOIS
  const authData = useAuthInternal();

  const value: AuthContextValue = {
    user: authData.user,
    loading: authData.loading,
    isAdmin: authData.isAdmin,
    setUser: authData.setUser,
    logout: authData.logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
