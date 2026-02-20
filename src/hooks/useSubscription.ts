import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  maxAppointmentsMonth: number | null;
  expiresAt: string | null;
}

export function useSubscription(companyId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSubscription({
            id: data.id,
            plan: data.plan,
            status: data.status,
            maxAppointmentsMonth: data.max_appointments_month,
            expiresAt: data.expires_at,
          });
        }
        setLoading(false);
      });
  }, [companyId]);

  const checkLimit = async (): Promise<boolean> => {
    if (!companyId) return false;
    const { data, error } = await supabase.rpc("check_appointment_limit", {
      _company_id: companyId,
    });
    if (error) return true; // allow on error to not block
    return data as boolean;
  };

  return { subscription, loading, checkLimit };
}
