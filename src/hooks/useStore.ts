import { useState, useEffect, useCallback } from "react";
import type { Service, Client, Appointment, User } from "@/types";

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
  if (existing.length === 0) {
    const defaultUser: User = {
      id: "1",
      email: "admin@crm.com",
      name: "Administrador",
      password: "admin123",
    };
    saveToStorage(STORAGE_KEYS.users, [defaultUser]);
    return [defaultUser];
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

// Hook de autenticação
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("crm_current_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, password: string): boolean => {
    const users = initUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("crm_current_user", JSON.stringify(user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("crm_current_user");
  }, []);

  return { currentUser, login, logout, isAuthenticated: !!currentUser };
}

// Gerar ID único
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
