import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, apiFetch, endpoints } from '@/constants/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const stored = await AsyncStorage.getItem('aqar_user');
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiFetch<{ user: User }>(endpoints.login, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setUser(data.user);
    await AsyncStorage.setItem('aqar_user', JSON.stringify(data.user));
  }, []);

  const register = useCallback(async (regData: RegisterData) => {
    const data = await apiFetch<{ user: User }>(endpoints.register, {
      method: 'POST',
      body: JSON.stringify(regData),
    });
    setUser(data.user);
    await AsyncStorage.setItem('aqar_user', JSON.stringify(data.user));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch(endpoints.logout, { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    await AsyncStorage.removeItem('aqar_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
