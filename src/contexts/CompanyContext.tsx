import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Company, AppRole } from "@/types";

interface CompanyContextType {
  company: Company | null;
  companyRole: AppRole | null;
  loading: boolean;
  slug: string | null;
  setSlug: (slug: string) => void;
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
    document: row.document || "",
    status: row.status || "active",
    workingHoursStart: typeof row.working_hours_start === "string" ? row.working_hours_start.slice(0, 5) : "09:00",
    workingHoursEnd: typeof row.working_hours_end === "string" ? row.working_hours_end.slice(0, 5) : "18:00",
    slotDuration: row.slot_duration || 30,
    slotInterval: row.slot_interval || 0,
    workingDays: Array.isArray(row.working_days) ? row.working_days : [1, 2, 3, 4, 5],
    subscriptionStatus: row.subscription_status || "free",
    maxAppointmentsMonth: row.max_appointments_month || undefined,
  };
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuthContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyRole, setCompanyRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlugState] = useState<string | null>(null);

  const setSlug = useCallback((newSlug: string) => {
    setSlugState(newSlug);
  }, []);

  // Set loading synchronously when deps change to prevent redirect race conditions
  useEffect(() => {
    setLoading(true);
  }, [slug, currentUser]);

  // Load company from slug
  useEffect(() => {
    if (!slug) {
      setCompany(null);
      setCompanyRole(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .single();

      if (companyData) {
        setCompany(mapCompany(companyData));

        // Load role if user is authenticated
        if (currentUser) {
          const { data: membership } = await supabase
            .from("company_members")
            .select("role")
            .eq("user_id", currentUser.id)
            .eq("company_id", companyData.id)
            .limit(1)
            .single();

          setCompanyRole(membership ? (membership.role as AppRole) : "user");
        } else {
          setCompanyRole(null);
        }
      } else {
        setCompany(null);
        setCompanyRole(null);
      }
      setLoading(false);
    })();
  }, [slug, currentUser]);

  return (
    <CompanyContext.Provider value={{ company, companyRole, loading, slug, setSlug }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanyContext must be used within CompanyProvider");
  return ctx;
}
