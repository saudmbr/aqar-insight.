import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, apiFetch, endpoints } from '@/constants/api';
import { clearCookie } from '@/constants/httpClient';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (u: User) => void;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  userType?: string;
}

function parseServerUser(data: Record<string, any>): User {
  return {
    id: data.userId ?? data.id ?? 0,
    username: data.username ?? '',
    fullName: data.fullName ?? undefined,
    email: data.email ?? undefined,
    role: data.role ?? 'user',
    phone: data.phoneNumber ?? undefined,
  };
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
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
        setUser(JSON.parse(stored) as User);
      }

      const serverData = await apiFetch<Record<string, any>>(endpoints.me);
      if (serverData?.isAuthenticated) {
        const u = parseServerUser(serverData);
        setUser(u);
        await AsyncStorage.setItem('aqar_user', JSON.stringify(u));
      } else {
        setUser(null);
        await AsyncStorage.removeItem('aqar_user');
        await clearCookie();
      }
    } catch {
      setUser(null);
      await AsyncStorage.removeItem('aqar_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (identifier: string, password: string) => {
    await apiFetch<Record<string, any>>(endpoints.login, {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    const meData = await apiFetch<Record<string, any>>(endpoints.me);
    const u = parseServerUser(meData?.isAuthenticated ? meData : { username: identifier, role: 'user' });
    setUser(u);
    await AsyncStorage.setItem('aqar_user', JSON.stringify(u));
  }, []);

  const register = useCallback(async (regData: RegisterData) => {
    await apiFetch<Record<string, any>>(endpoints.register, {
      method: 'POST',
      body: JSON.stringify({
        fullName: regData.fullName,
        username: regData.username,
        email: regData.email,
        password: regData.password,
        userType: regData.userType,
      }),
    });
    const meData = await apiFetch<Record<string, any>>(endpoints.me);
    const u = parseServerUser(meData?.isAuthenticated ? meData : { username: regData.username, role: 'user' });
    setUser(u);
    await AsyncStorage.setItem('aqar_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch(endpoints.logout, { method: 'POST' });
    } catch {}
    setUser(null);
    await AsyncStorage.removeItem('aqar_user');
    await clearCookie();
  }, []);

  const updateUser = useCallback((u: User) => {
    setUser(u);
    AsyncStorage.setItem('aqar_user', JSON.stringify(u)).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
