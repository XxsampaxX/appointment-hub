import React, { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/useStore";
import type { User } from "@/types";

interface AuthContextType {
  currentUser: User | null;
  login: (phone: string, cpf: string) => boolean;
  register: (name: string, phone: string, cpf: string) => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
