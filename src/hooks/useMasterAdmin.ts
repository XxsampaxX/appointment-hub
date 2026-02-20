import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export function useMasterAdmin() {
  const { currentUser, loading: authLoading } = useAuthContext();
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setIsMasterAdmin(false);
      setLoading(false);
      return;
    }

    supabase
      .from("global_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "master_admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsMasterAdmin(!!data);
        setLoading(false);
      });
  }, [currentUser, authLoading]);

  return { isMasterAdmin, loading };
}
