import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types";

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: AppRole;
}

interface AuthContextType {
  currentUser: AppUser | null;
  login: (email: string, cpf: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, phone: string, cpf: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(userId: string): Promise<AppUser | null> {
  const [profileRes, memberRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("company_members").select("role").eq("user_id", userId).limit(1).single(),
  ]);

  if (profileRes.error || !profileRes.data) return null;

  return {
    id: userId,
    name: profileRes.data.name,
    email: profileRes.data.email || "",
    phone: profileRes.data.phone,
    cpf: profileRes.data.cpf,
    role: (memberRes.data?.role as AppRole) || "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setCurrentUser(profile);
            setLoading(false);
          }, 0);
        } else {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setCurrentUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, cpf: string) => {
    const password = cpf.replace(/\D/g, "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, message: "Email ou CPF incorretos." };
    }
    return { success: true, message: "Login realizado!" };
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, cpf: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");

    if (!name.trim() || !email.trim() || cleanPhone.length < 10 || cleanCpf.length !== 11) {
      return { success: false, message: "Preencha todos os campos corretamente." };
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: cleanCpf,
      options: {
        data: { name: name.trim(), phone: cleanPhone, cpf: cleanCpf },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { success: false, message: "Este email já está cadastrado." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Conta criada com sucesso!" };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        isAuthenticated: !!currentUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
