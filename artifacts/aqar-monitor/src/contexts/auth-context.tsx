import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UserRole = "admin" | "user" | "real_estate_marketer" | "service_provider";

export interface AuthUser {
  id: number | null;
  username: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  signup: (
    fullName: string,
    username: string,
    email: string,
    password: string,
    userType?: string,
    serviceCategory?: string,
  ) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | null>(null);

type MeResponse = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: number | null;
  username: string;
  fullName: string;
  role: UserRole;
};

type AuthResponse = {
  success: boolean;
  userId: number | null;
  username: string;
  fullName: string;
  role: UserRole;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json() as Promise<MeResponse>;
        throw new Error("unauthenticated");
      })
      .then((data) => {
        if (data.isAuthenticated) {
          setUser({ id: data.userId, username: data.username, fullName: data.fullName, role: data.role });
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (identifier: string, password: string): Promise<AuthUser> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { message: string };
      throw new Error(data.message ?? "خطأ في تسجيل الدخول");
    }

    const data = (await res.json()) as AuthResponse;
    const authUser: AuthUser = {
      id: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
    };
    setUser(authUser);
    return authUser;
  };

  const signup = async (
    fullName: string,
    username: string,
    email: string,
    password: string,
    userType?: string,
    serviceCategory?: string,
  ): Promise<AuthUser> => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, username, email, password, userType, serviceCategory }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { message: string };
      throw new Error(data.message ?? "خطأ في إنشاء الحساب");
    }

    const data = (await res.json()) as AuthResponse;
    const authUser: AuthUser = {
      id: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
    };
    setUser(authUser);
    return authUser;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  const isAuthenticated = user !== null;
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, isLoading, user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
