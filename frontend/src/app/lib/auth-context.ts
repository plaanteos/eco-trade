import React, { createContext, useContext } from 'react';
import { useAlchemyAuth } from '../../hooks/useAlchemyAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAlchemyAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
