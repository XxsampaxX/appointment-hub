import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Service, Professional, Client, Appointment } from "@/types";

// ============================
// Hook genérico para Supabase
// ============================
function useSupabaseTable<T extends { id: string }>(
  table: string,
  mapFromDb: (row: any) => T,
  mapToDb: (item: Partial<T>) => Record<string, any>
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setItems(data.map(mapFromDb));
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const add = useCallback(
    async (item: Omit<T, "id"> | T) => {
      const { id, ...rest } = item as any;
      const dbData = mapToDb(rest);
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
    [table]
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
export function useServices() {
  return useSupabaseTable<Service>(
    "services",
    (row) => ({
      id: row.id,
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
export function useProfessionals() {
  return useSupabaseTable<Professional>(
    "professionals",
    (row) => ({
      id: row.id,
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
export function useClients() {
  return useSupabaseTable<Client>(
    "clients",
    (row) => ({
      id: row.id,
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
export function useAppointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: true });
    if (!error && data) {
      setItems(
        data.map((row: any) => ({
          id: row.id,
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
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const add = useCallback(
    async (appointment: Omit<Appointment, "id">) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
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
    []
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
