import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [tokenReady, setTokenReady] = useState(false);

  // Obtener token de URL si viene del callback OAuth
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setTokenReady(true);
  }, [searchParams]);

  // Sanctum API Token authentication
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.me().then(res => res.data),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: tokenReady, // Solo cargar usuario después de procesar token
  });

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_admin');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoading || !tokenReady,
        isAuthenticated: !!user,
        logout,
      }}
    >
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
