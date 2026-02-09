import { useState, useEffect, useCallback } from "react";
import type { User } from "@/types";

const STORAGE_KEYS = {
  users: "crm_users",
  services: "crm_services",
  clients: "crm_clients",
  appointments: "crm_appointments",
};

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Inicializa com um usuário admin padrão
function initUsers(): User[] {
  const existing = getFromStorage<User[]>(STORAGE_KEYS.users, []);
  if (!existing.some((u) => u.role === "admin")) {
    const defaultAdmin: User = {
      id: "1",
      name: "Administrador",
      phone: "11999999999",
      cpf: "00000000000",
      role: "admin",
    };
    const updated = [...existing, defaultAdmin];
    saveToStorage(STORAGE_KEYS.users, updated);
    return updated;
  }
  return existing;
}

// Hook genérico para CRUD com localStorage
export function useStore<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>(() => getFromStorage<T[]>(key, []));

  useEffect(() => {
    saveToStorage(key, items);
  }, [items, key]);

  const add = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const update = useCallback((id: string, data: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  return { items, add, update, remove, getById };
}

// Hook de autenticação com telefone/CPF
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("crm_current_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((phone: string, cpf: string): boolean => {
    const users = initUsers();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");
    const user = users.find(
      (u) => u.phone.replace(/\D/g, "") === cleanPhone && u.cpf.replace(/\D/g, "") === cleanCpf
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("crm_current_user", JSON.stringify(user));
      return true;
    }
    return false;
  }, []);

  const register = useCallback((name: string, phone: string, cpf: string): { success: boolean; message: string } => {
    const users = initUsers();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");

    if (!name.trim() || cleanPhone.length < 10 || cleanCpf.length !== 11) {
      return { success: false, message: "Preencha todos os campos corretamente." };
    }

    if (users.some((u) => u.phone.replace(/\D/g, "") === cleanPhone)) {
      return { success: false, message: "Este telefone já está cadastrado." };
    }

    if (users.some((u) => u.cpf.replace(/\D/g, "") === cleanCpf)) {
      return { success: false, message: "Este CPF já está cadastrado." };
    }

    const newUser: User = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      phone: cleanPhone,
      cpf: cleanCpf,
      role: "user",
    };

    const updated = [...users, newUser];
    saveToStorage(STORAGE_KEYS.users, updated);
    setCurrentUser(newUser);
    localStorage.setItem("crm_current_user", JSON.stringify(newUser));
    return { success: true, message: "Conta criada com sucesso!" };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("crm_current_user");
  }, []);

  return { currentUser, login, register, logout, isAuthenticated: !!currentUser };
}

// Gerar ID único
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
