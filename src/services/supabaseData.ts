import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Service, Professional, Client, Appointment } from "@/types";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

// ============================
// Services Hook
// ============================
export function useServices(companyId?: string) {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setItems(data.map((row) => ({
        id: row.id, companyId: row.company_id, name: row.name,
        duration: row.duration, price: Number(row.price), description: row.description || "",
      })));
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (item: Omit<Service, "id">) => {
    const { data, error } = await supabase.from("services").insert({
      company_id: companyId!, name: item.name, duration: item.duration,
      price: item.price, description: item.description,
    }).select().single();
    if (!error && data) setItems((prev) => [...prev, { id: data.id, companyId: data.company_id, name: data.name, duration: data.duration, price: Number(data.price), description: data.description || "" }]);
    return { data, error };
  }, [companyId]);

  const update = useCallback(async (id: string, changes: Partial<Service>) => {
    const dbData: Record<string, any> = {};
    if (changes.name !== undefined) dbData.name = changes.name;
    if (changes.duration !== undefined) dbData.duration = changes.duration;
    if (changes.price !== undefined) dbData.price = changes.price;
    if (changes.description !== undefined) dbData.description = changes.description;
    const { error } = await supabase.from("services").update(dbData).eq("id", id);
    if (!error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...changes } : i));
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
    return { error };
  }, []);

  const getById = useCallback((id: string) => items.find((i) => i.id === id), [items]);
  return { items, loading, add, update, remove, getById, refetch: fetch };
}

// ============================
// Professionals Hook
// ============================
export function useProfessionals(companyId?: string) {
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setItems(data.map((row) => ({
        id: row.id, companyId: row.company_id, name: row.name,
        role: row.role || "", avatar: row.avatar || undefined, available: row.available ?? true,
      })));
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (item: Omit<Professional, "id">) => {
    const { data, error } = await supabase.from("professionals").insert({
      company_id: companyId!, name: item.name, role: item.role, avatar: item.avatar || null, available: item.available,
    }).select().single();
    if (!error && data) setItems((prev) => [...prev, { id: data.id, companyId: data.company_id, name: data.name, role: data.role || "", avatar: data.avatar || undefined, available: data.available ?? true }]);
    return { data, error };
  }, [companyId]);

  const update = useCallback(async (id: string, changes: Partial<Professional>) => {
    const dbData: Record<string, any> = {};
    if (changes.name !== undefined) dbData.name = changes.name;
    if (changes.role !== undefined) dbData.role = changes.role;
    if (changes.avatar !== undefined) dbData.avatar = changes.avatar;
    if (changes.available !== undefined) dbData.available = changes.available;
    const { error } = await supabase.from("professionals").update(dbData).eq("id", id);
    if (!error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...changes } : i));
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
    return { error };
  }, []);

  const getById = useCallback((id: string) => items.find((i) => i.id === id), [items]);
  return { items, loading, add, update, remove, getById, refetch: fetch };
}

// ============================
// Clients Hook
// ============================
export function useClients(companyId?: string) {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setItems(data.map((row) => ({
        id: row.id, companyId: row.company_id, name: row.name,
        email: row.email || "", phone: row.phone || "", notes: row.notes || "",
      })));
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (item: Omit<Client, "id">) => {
    const { data, error } = await supabase.from("clients").insert({
      company_id: companyId!, name: item.name, email: item.email, phone: item.phone, notes: item.notes,
    }).select().single();
    if (!error && data) setItems((prev) => [...prev, { id: data.id, companyId: data.company_id, name: data.name, email: data.email || "", phone: data.phone || "", notes: data.notes || "" }]);
    return { data, error };
  }, [companyId]);

  const update = useCallback(async (id: string, changes: Partial<Client>) => {
    const dbData: Record<string, any> = {};
    if (changes.name !== undefined) dbData.name = changes.name;
    if (changes.email !== undefined) dbData.email = changes.email;
    if (changes.phone !== undefined) dbData.phone = changes.phone;
    if (changes.notes !== undefined) dbData.notes = changes.notes;
    const { error } = await supabase.from("clients").update(dbData).eq("id", id);
    if (!error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...changes } : i));
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
    return { error };
  }, []);

  const getById = useCallback((id: string) => items.find((i) => i.id === id), [items]);
  return { items, loading, add, update, remove, getById, refetch: fetch };
}

// ============================
// Appointments Hook
// ============================
export function useAppointments(companyId?: string) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("company_id", companyId)
      .order("date", { ascending: true });
    if (!error && data) {
      setItems(data.map((row) => ({
        id: row.id, companyId: row.company_id, clientId: row.client_id || "",
        serviceId: row.service_id, professionalId: row.professional_id,
        date: row.date, time: typeof row.time === "string" ? row.time.slice(0, 5) : row.time,
        status: row.status, notes: row.notes || "",
        clientName: row.client_name || "", clientPhone: row.client_phone || "",
        paymentMethod: (row as any).payment_method || null,
      })));
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const add = useCallback(async (appointment: Omit<Appointment, "id">) => {
    const { data, error } = await supabase.from("appointments").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      company_id: companyId!,
      client_id: appointment.clientId || null,
      service_id: appointment.serviceId,
      professional_id: appointment.professionalId,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      notes: appointment.notes,
      client_name: appointment.clientName || null,
      client_phone: appointment.clientPhone || null,
      payment_method: appointment.paymentMethod || null,
    } as any).select().single();
    if (!error && data) {
      setItems((prev) => [...prev, {
        id: data.id, companyId: data.company_id, clientId: data.client_id || "",
        serviceId: data.service_id, professionalId: data.professional_id,
        date: data.date, time: typeof data.time === "string" ? data.time.slice(0, 5) : data.time,
        status: data.status, notes: data.notes || "",
        clientName: data.client_name || "", clientPhone: data.client_phone || "",
        paymentMethod: (data as any).payment_method || null,
      }]);
    }
    return { data, error };
  }, [companyId]);

  const update = useCallback(async (id: string, changes: Partial<Appointment>) => {
    const dbChanges: Record<string, any> = {};
    if (changes.clientId !== undefined) dbChanges.client_id = changes.clientId || null;
    if (changes.serviceId !== undefined) dbChanges.service_id = changes.serviceId;
    if (changes.professionalId !== undefined) dbChanges.professional_id = changes.professionalId;
    if (changes.date !== undefined) dbChanges.date = changes.date;
    if (changes.time !== undefined) dbChanges.time = changes.time;
    if (changes.status !== undefined) dbChanges.status = changes.status;
    if (changes.notes !== undefined) dbChanges.notes = changes.notes;
    if (changes.clientName !== undefined) dbChanges.client_name = changes.clientName;
    if (changes.clientPhone !== undefined) dbChanges.client_phone = changes.clientPhone;
    if (changes.paymentMethod !== undefined) dbChanges.payment_method = changes.paymentMethod;
    const { error } = await supabase.from("appointments").update(dbChanges).eq("id", id);
    if (!error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...changes } : i));
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
    return { error };
  }, []);

  const getById = useCallback((id: string) => items.find((i) => i.id === id), [items]);
  return { items, loading, add, update, remove, getById, refetch: fetchAll };
}

// ============================
// Public hooks (no auth, by slug)
// ============================
export function usePublicServices(companyId?: string) {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    supabase.from("services").select("*").eq("company_id", companyId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data.map((r) => ({
          id: r.id, companyId: r.company_id, name: r.name,
          duration: r.duration, price: Number(r.price), description: r.description || "",
        })));
        setLoading(false);
      });
  }, [companyId]);

  return { items, loading };
}

export function usePublicProfessionals(companyId?: string) {
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    supabase.from("professionals").select("*").eq("company_id", companyId)
      .eq("available", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data.map((r) => ({
          id: r.id, companyId: r.company_id, name: r.name,
          role: r.role || "", avatar: r.avatar || undefined, available: true,
        })));
        setLoading(false);
      });
  }, [companyId]);

  return { items, loading };
}

export function usePublicAppointments(companyId?: string) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    supabase.from("appointment_slots" as any)
      .select("date, time, professional_id, status")
      .eq("company_id", companyId)
      .then(({ data }) => {
        if (data) setItems((data as any[]).map((r: any) => ({
          id: "", companyId, clientId: "", serviceId: "",
          professionalId: r.professional_id, date: r.date,
          time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
          status: r.status, notes: "",
        })));
        setLoading(false);
      });
  }, [companyId]);

  return { items, loading };
}
