import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";
import {
  Building2,
  CalendarDays,
  DollarSign,
  Users,
  Loader2,
  LogOut,
  ShieldCheck,
  Ban,
  CheckCircle2,
} from "lucide-react";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  document: string;
  created_at: string;
}

interface SubscriptionRow {
  id: string;
  company_id: string;
  plan: string;
  status: string;
  max_appointments_month: number | null;
  expires_at: string | null;
}

interface CompanyWithSub extends CompanyRow {
  subscription?: SubscriptionRow;
  appointmentCount?: number;
  memberCount?: number;
}

export default function MasterAdminPage() {
  const { currentUser, logout } = useAuthContext();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<CompanyWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    totalAppointments: 0,
    totalUsers: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [companiesRes, subsRes, appointmentsRes, membersRes] = await Promise.all([
      supabase.from("companies").select("id, name, slug, status, document, created_at").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*"),
      supabase.from("appointments").select("id, company_id"),
      supabase.from("company_members").select("id, company_id"),
    ]);

    const companiesData = (companiesRes.data || []) as CompanyRow[];
    const subsData = (subsRes.data || []) as SubscriptionRow[];
    const appointmentsData = appointmentsRes.data || [];
    const membersData = membersRes.data || [];

    // Build maps
    const subsByCompany = new Map<string, SubscriptionRow>();
    subsData.forEach((s) => subsByCompany.set(s.company_id, s));

    const apptCountByCompany = new Map<string, number>();
    appointmentsData.forEach((a: any) => {
      apptCountByCompany.set(a.company_id, (apptCountByCompany.get(a.company_id) || 0) + 1);
    });

    const memberCountByCompany = new Map<string, number>();
    membersData.forEach((m: any) => {
      memberCountByCompany.set(m.company_id, (memberCountByCompany.get(m.company_id) || 0) + 1);
    });

    const enriched: CompanyWithSub[] = companiesData.map((c) => ({
      ...c,
      subscription: subsByCompany.get(c.id),
      appointmentCount: apptCountByCompany.get(c.id) || 0,
      memberCount: memberCountByCompany.get(c.id) || 0,
    }));

    setCompanies(enriched);
    setGlobalStats({
      totalCompanies: companiesData.length,
      activeCompanies: companiesData.filter((c) => c.status === "active").length,
      suspendedCompanies: companiesData.filter((c) => c.status === "suspended").length,
      totalAppointments: appointmentsData.length,
      totalUsers: membersData.length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCompanyStatus = async (company: CompanyWithSub) => {
    const newStatus = company.status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("companies")
      .update({ status: newStatus })
      .eq("id", company.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: newStatus === "active" ? "Empresa ativada" : "Empresa suspensa" });
    fetchData();
  };

  const changePlan = async (companyId: string, newPlan: string) => {
    const limits: Record<string, number | null> = {
      free: 50,
      basic: 200,
      pro: null,
    };

    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: newPlan, max_appointments_month: limits[newPlan] })
      .eq("company_id", companyId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Plano alterado para ${newPlan.toUpperCase()}` });
    fetchData();
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "pro": return "default";
      case "basic": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <AgendyaLogo size="md" />
            <Badge variant="destructive" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Master Admin
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {currentUser?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Painel Master</h1>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{globalStats.totalCompanies}</p>
                <p className="text-xs text-muted-foreground">Total Empresas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{globalStats.activeCompanies}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Ban className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{globalStats.suspendedCompanies}</p>
                <p className="text-xs text-muted-foreground">Suspensas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{globalStats.totalAppointments}</p>
                <p className="text-xs text-muted-foreground">Agendamentos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{globalStats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        <div className="grid gap-4 sm:grid-cols-3">
          {["free", "basic", "pro"].map((plan) => {
            const count = companies.filter((c) => c.subscription?.plan === plan).length;
            return (
              <Card key={plan}>
                <CardContent className="p-4 text-center">
                  <Badge variant={planColor(plan)} className="mb-2">{plan.toUpperCase()}</Badge>
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">empresas</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Plano</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Agendamentos</th>
                    <th className="p-3">Membros</th>
                    <th className="p-3">Criada em</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.slug}</td>
                      <td className="p-3">
                        <Select
                          value={c.subscription?.plan || "free"}
                          onValueChange={(val) => changePlan(c.id, val)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Badge variant={c.status === "active" ? "default" : "destructive"}>
                          {c.status === "active" ? "Ativa" : "Suspensa"}
                        </Badge>
                      </td>
                      <td className="p-3">{c.appointmentCount}</td>
                      <td className="p-3">{c.memberCount}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant={c.status === "active" ? "destructive" : "default"}
                          onClick={() => toggleCompanyStatus(c)}
                        >
                          {c.status === "active" ? "Suspender" : "Ativar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
