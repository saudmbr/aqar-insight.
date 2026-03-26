import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json() as Promise<{ isAdmin: boolean; username: string }>;
        throw new Error("not authenticated");
      })
      .then((data) => {
        if (data.isAdmin) {
          setIsAuthenticated(true);
          setUsername(data.username);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUsername(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (user: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { message: string };
      throw new Error(data.message ?? "خطأ في تسجيل الدخول");
    }

    const data = (await res.json()) as { username: string };
    setIsAuthenticated(true);
    setUsername(data.username);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
