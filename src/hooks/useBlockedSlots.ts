import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BlockedSlot {
  id: string;
  companyId: string;
  date: string;
  time: string;
  reason: string;
  createdBy: string;
  active: boolean;
  createdAt: string;
}

export function useBlockedSlots(companyId?: string) {
  const [items, setItems] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("blocked_slots" as any)
      .select("*")
      .eq("company_id", companyId)
      .order("date", { ascending: true });
    if (data) {
      setItems((data as any[]).map((r) => ({
        id: r.id,
        companyId: r.company_id,
        date: r.date,
        time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
        reason: r.reason,
        createdBy: r.created_by,
        active: r.active,
        createdAt: r.created_at,
      })));
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (slot: { date: string; time: string; reason: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("blocked_slots" as any).insert({
      company_id: companyId!,
      date: slot.date,
      time: slot.time,
      reason: slot.reason,
      created_by: user?.id,
    } as any);
    if (!error) await fetch();
    return { error };
  }, [companyId, fetch]);

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    const { error } = await supabase.from("blocked_slots" as any).update({ active } as any).eq("id", id);
    if (!error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, active } : i));
    return { error };
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("blocked_slots" as any).delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
    return { error };
  }, []);

  return { items, loading, add, toggleActive, remove, refetch: fetch };
}

export function usePublicBlockedSlots(companyId?: string) {
  const [items, setItems] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setItems([]); setLoading(false); return; }
    supabase
      .from("blocked_slots" as any)
      .select("date, time")
      .eq("company_id", companyId)
      .eq("active", true)
      .then(({ data }) => {
        if (data) setItems((data as any[]).map((r) => ({
          id: "",
          companyId,
          date: r.date,
          time: typeof r.time === "string" ? r.time.slice(0, 5) : r.time,
          reason: "",
          createdBy: "",
          active: true,
          createdAt: "",
        })));
        setLoading(false);
      });
  }, [companyId]);

  return { items, loading };
}
