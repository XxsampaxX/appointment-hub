import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Service, Professional, Client, Appointment } from "@/types";

// ============================
// Hook genérico para Supabase com company_id
// ============================
function useSupabaseTable<T extends { id: string }>(
  table: string,
  companyId: string | undefined,
  mapFromDb: (row: any) => T,
  mapToDb: (item: Partial<T>) => Record<string, any>
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setItems(data.map(mapFromDb));
    }
    setLoading(false);
  }, [table, companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const add = useCallback(
    async (item: Omit<T, "id"> | T) => {
      const { id, ...rest } = item as any;
      const dbData = { ...mapToDb(rest), company_id: companyId };
      const { data, error } = await supabase
        .from(table)
        .insert(dbData)
        .select()
        .single();
      if (!error && data) {
        setItems((prev) => [...prev, mapFromDb(data)]);
      }
      return { data, error };
    },
    [table, companyId]
  );

  const update = useCallback(
    async (id: string, changes: Partial<T>) => {
      const dbData = mapToDb(changes);
      const { error } = await supabase.from(table).update(dbData).eq("id", id);
      if (!error) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
        );
      }
      return { error };
    },
    [table]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (!error) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
      return { error };
    },
    [table]
  );

  const getById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  return { items, loading, add, update, remove, getById, refetch: fetch };
}

// ============================
// Services Hook
// ============================
export function useServices(companyId?: string) {
  return useSupabaseTable<Service>(
    "services",
    companyId,
    (row) => ({
      id: row.id,
      companyId: row.company_id || "",
      name: row.name,
      duration: row.duration,
      price: Number(row.price),
      description: row.description || "",
    }),
    (item) => ({
      ...(item.name !== undefined && { name: item.name }),
      ...(item.duration !== undefined && { duration: item.duration }),
      ...(item.price !== undefined && { price: item.price }),
      ...(item.description !== undefined && { description: item.description }),
    })
  );
}

// ============================
// Professionals Hook
// ============================
export function useProfessionals(companyId?: string) {
  return useSupabaseTable<Professional>(
    "professionals",
    companyId,
    (row) => ({
      id: row.id,
      companyId: row.company_id || "",
      name: row.name,
      role: row.role || "",
      avatar: row.avatar || undefined,
      available: row.available ?? true,
    }),
    (item) => ({
      ...(item.name !== undefined && { name: item.name }),
      ...(item.role !== undefined && { role: item.role }),
      ...(item.avatar !== undefined && { avatar: item.avatar }),
      ...(item.available !== undefined && { available: item.available }),
    })
  );
}

// ============================
// Clients Hook
// ============================
export function useClients(companyId?: string) {
  return useSupabaseTable<Client>(
    "clients",
    companyId,
    (row) => ({
      id: row.id,
      companyId: row.company_id || "",
      name: row.name,
      email: row.email || "",
      phone: row.phone || "",
      notes: row.notes || "",
    }),
    (item) => ({
      ...(item.name !== undefined && { name: item.name }),
      ...(item.email !== undefined && { email: item.email }),
      ...(item.phone !== undefined && { phone: item.phone }),
      ...(item.notes !== undefined && { notes: item.notes }),
    })
  );
}

// ============================
// Appointments Hook
// ============================
export function useAppointments(companyId?: string) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!companyId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("company_id", companyId)
      .order("date", { ascending: true });
    if (!error && data) {
      setItems(
        data.map((row: any) => ({
          id: row.id,
          companyId: row.company_id || "",
          clientId: row.client_id || "",
          serviceId: row.service_id,
          professionalId: row.professional_id,
          date: row.date,
          time: typeof row.time === "string" ? row.time.slice(0, 5) : row.time,
          status: row.status,
          notes: row.notes || "",
          clientName: row.client_name || "",
          clientPhone: row.client_phone || "",
        }))
      );
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const add = useCallback(
    async (appointment: Omit<Appointment, "id">) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          company_id: companyId,
          client_id: appointment.clientId || null,
          service_id: appointment.serviceId,
          professional_id: appointment.professionalId,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          notes: appointment.notes,
          client_name: appointment.clientName || null,
          client_phone: appointment.clientPhone || null,
        })
        .select()
        .single();
      if (!error && data) {
        setItems((prev) => [
          ...prev,
          {
            id: data.id,
            companyId: data.company_id || "",
            clientId: data.client_id || "",
            serviceId: data.service_id,
            professionalId: data.professional_id,
            date: data.date,
            time: typeof data.time === "string" ? data.time.slice(0, 5) : data.time,
            status: data.status,
            notes: data.notes || "",
            clientName: data.client_name || "",
            clientPhone: data.client_phone || "",
          },
        ]);
      }
      return { data, error };
    },
    [companyId]
  );

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

    const { error } = await supabase.from("appointments").update(dbChanges).eq("id", id);
    if (!error) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
      );
    }
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
    return { error };
  }, []);

  const getById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

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
    supabase
      .from("services")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data.map((r: any) => ({
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
    supabase
      .from("professionals")
      .select("*")
      .eq("company_id", companyId)
      .eq("available", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setItems(data.map((r: any) => ({
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
    supabase
      .from("appointments")
      .select("date, time, professional_id, status")
      .eq("company_id", companyId)
      .neq("status", "cancelado")
      .then(({ data }) => {
        if (data) setItems(data.map((r: any) => ({
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
