import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Company, AppRole } from "@/types";

interface CompanyContextType {
  company: Company | null;
  companyRole: AppRole | null;
  loading: boolean;
  setCompanyFromSlug: (slug: string) => Promise<Company | null>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

function mapCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo || undefined,
    phone: row.phone || "",
    address: row.address || "",
    workingHoursStart: typeof row.working_hours_start === "string" ? row.working_hours_start.slice(0, 5) : "09:00",
    workingHoursEnd: typeof row.working_hours_end === "string" ? row.working_hours_end.slice(0, 5) : "18:00",
    slotDuration: row.slot_duration || 30,
    slotInterval: row.slot_interval || 0,
    subscriptionStatus: row.subscription_status || "free",
    maxAppointmentsMonth: row.max_appointments_month || undefined,
  };
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuthContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyRole, setCompanyRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load company from user's membership
  useEffect(() => {
    if (!currentUser) {
      setCompany(null);
      setCompanyRole(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", currentUser.id)
        .limit(1)
        .single();

      if (membership) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("*")
          .eq("id", membership.company_id)
          .single();

        if (companyData) {
          setCompany(mapCompany(companyData));
          setCompanyRole(membership.role as AppRole);
        }
      }
      setLoading(false);
    })();
  }, [currentUser]);

  const setCompanyFromSlug = async (slug: string): Promise<Company | null> => {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .single();

    if (data) {
      const mapped = mapCompany(data);
      setCompany(mapped);
      return mapped;
    }
    return null;
  };

  return (
    <CompanyContext.Provider value={{ company, companyRole, loading, setCompanyFromSlug }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanyContext must be used within CompanyProvider");
  return ctx;
}
