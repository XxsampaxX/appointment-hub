import { useState, useMemo } from "react";
import { useServices, useProfessionals, useClients, useAppointments } from "@/services/supabaseData";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Appointment } from "@/types";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Loader2, Copy, CalendarDays, TrendingUp, Users, Layers,
  ClipboardList, CheckCircle2, XCircle, BarChart3, Grid3X3,
  ArrowUpRight, ArrowDownRight, LinkIcon, Wallet, CreditCard, Smartphone, Banknote,
} from "lucide-react";
import { toast } from "sonner";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// ── helpers ──────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthLabel(month: number) {
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][month];
}

type PeriodFilter = "this_month" | "last_month" | "this_year" | "last_year";

function getPeriodRange(filter: PeriodFilter) {
  const now = new Date();
  switch (filter) {
    case "this_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0), label: `${monthLabel(now.getMonth())} ${now.getFullYear()}` };
    case "last_month": {
      const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0), label: `${monthLabel(m)} ${y}` };
    }
    case "this_year":
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31), label: `${now.getFullYear()}` };
    case "last_year":
      return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31), label: `${now.getFullYear() - 1}` };
  }
}

// ── component ────────────────────────────────────────
export default function Dashboard() {
  const { currentUser } = useAuthContext();
  const { company, loading: companyLoading } = useCompanyContext();
  const { items: services, loading: ls } = useServices(company?.id);
  const { items: clients, loading: lc } = useClients(company?.id);
  const { items: appointments, loading: la } = useAppointments(company?.id);
  const { items: professionals, loading: lp } = useProfessionals(company?.id);

  const [revFilter, setRevFilter] = useState<PeriodFilter>("this_month");

  const loading = ls || lc || la || lp || companyLoading;
  const slug = company?.slug || "";
  const bookingUrl = `${window.location.origin}/${slug}/agendar`;
  const firstName = currentUser?.name?.split(" ")[0] || "Usuário";

  // ── derived metrics ──
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === today && a.status !== "cancelado");

  // revenue & metrics period
  const revPeriod = getPeriodRange(revFilter);

  // period-filtered appointments (same filter as revenue)
  const periodAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const d = new Date(a.date);
      return d >= revPeriod.start && d <= revPeriod.end;
    });
  }, [appointments, revPeriod.start.getTime(), revPeriod.end.getTime()]);

  const scheduled = periodAppointments.filter((a) => a.status === "agendado" || a.status === "confirmado").length;
  const completed = periodAppointments.filter((a) => a.status === "concluido").length;
  const cancelled = periodAppointments.filter((a) => a.status === "cancelado").length;
  const activeProfessionals = professionals.filter((p) => p.available).length;
  const newClientsMonth = clients.length;
  const revenue = useMemo(() => {
    return appointments
      .filter((a) => {
        if (a.status !== "concluido") return false;
        const d = new Date(a.date);
        return d >= revPeriod.start && d <= revPeriod.end;
      })
      .reduce((sum, a) => {
        const svc = services.find((s) => s.id === a.serviceId);
        return sum + (svc?.price || 0);
      }, 0);
  }, [appointments, services, revPeriod.start.getTime(), revPeriod.end.getTime()]);

  // compare to previous period
  const prevFilter: PeriodFilter = revFilter === "this_month" ? "last_month" : revFilter === "this_year" ? "last_year" : revFilter;
  const prevPeriod = getPeriodRange(prevFilter);
  const prevRevenue = useMemo(() => {
    if (revFilter === prevFilter) return null;
    return appointments
      .filter((a) => {
        if (a.status !== "concluido") return false;
        const d = new Date(a.date);
        return d >= prevPeriod.start && d <= prevPeriod.end;
      })
      .reduce((sum, a) => {
        const svc = services.find((s) => s.id === a.serviceId);
        return sum + (svc?.price || 0);
      }, 0);
  }, [appointments, services, prevPeriod.start.getTime(), prevPeriod.end.getTime(), revFilter, prevFilter]);

  const revChange = prevRevenue && prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

  // occupation rate
  const occupationRate = useMemo(() => {
    if (!professionals.length) return 0;
    const workDays = 22; // avg working days
    const slotsPerDay = 8;
    const totalSlots = activeProfessionals * workDays * slotsPerDay;
    if (totalSlots === 0) return 0;
    return Math.min(100, Math.round((scheduled / totalSlots) * 100));
  }, [scheduled, activeProfessionals]);

  // revenue by payment method
  const paymentMethodLabels: Record<string, string> = { pix: "PIX", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito" };
  const paymentMethodIcons: Record<string, typeof Wallet> = { pix: Smartphone, dinheiro: Banknote, credito: CreditCard, debito: Wallet };
  const revenueByPayment = useMemo(() => {
    const map: Record<string, number> = {};
    periodAppointments
      .filter((a) => a.status === "concluido")
      .forEach((a) => {
        const method = a.paymentMethod || "indefinido";
        const svc = services.find((s) => s.id === a.serviceId);
        map[method] = (map[method] || 0) + (svc?.price || 0);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([method, total]) => ({ method, total, label: paymentMethodLabels[method] || "Não informado" }));
  }, [periodAppointments, services]);

  // chart: last 7 days appointments
  const last7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayAppts = appointments.filter((a) => a.date === dateStr && a.status !== "cancelado").length;
      data.push({
        day: `${d.getDate()}/${d.getMonth() + 1}`,
        agendamentos: dayAppts,
      });
    }
    return data;
  }, [appointments]);

  const chartConfig = {
    agendamentos: { label: "Agendamentos", color: "hsl(217, 91%, 53%)" },
  };

  // helpers
  const getClientName = (a: Appointment) => a.clientName || clients.find((c) => c.id === a.clientId)?.name || "—";
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || "—";
  const getProfessionalName = (id: string) => professionals.find((p) => p.id === id)?.name || "—";

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success("Link copiado!");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Resumo da sua operação hoje
            </p>
          </div>
          <Button onClick={copyLink} className="gap-2 shadow-md">
            <LinkIcon className="h-4 w-4" />
            Copiar link de agendamento
          </Button>
        </div>

        {/* ── Business Metrics (large cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  <TrendingUp className="h-4 w-4" />
                  Faturamento
                </div>
                <Select value={revFilter} onValueChange={(v) => setRevFilter(v as PeriodFilter)}>
                  <SelectTrigger className="h-7 w-auto text-xs border-0 bg-muted/50 px-2 gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_month">Este mês</SelectItem>
                    <SelectItem value="last_month">Mês anterior</SelectItem>
                    <SelectItem value="this_year">Este ano</SelectItem>
                    <SelectItem value="last_year">Ano anterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatBRL(revenue)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Período: {revPeriod.label}</span>
                {revChange !== null && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${revChange >= 0 ? "text-success" : "text-destructive"}`}>
                    {revChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(revChange).toFixed(0)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Month appointments */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">
                <CalendarDays className="h-4 w-4" />
                Agendamentos
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">{scheduled}</p>
              <span className="text-xs text-muted-foreground">{revPeriod.label} • agendados + confirmados</span>
            </CardContent>
          </Card>

          {/* New clients */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">
                <Users className="h-4 w-4" />
                Total de clientes
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">{newClientsMonth}</p>
              <span className="text-xs text-muted-foreground">cadastrados</span>
            </CardContent>
          </Card>

          {/* Occupation rate */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide mb-3">
                <BarChart3 className="h-4 w-4" />
                Taxa de ocupação
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">{occupationRate}%</p>
              <span className="text-xs text-muted-foreground">estimativa mensal</span>
            </CardContent>
          </Card>
        </div>

        {/* ── Operational Metrics (smaller cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Grid3X3 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">{activeProfessionals}</p>
                <p className="text-xs text-muted-foreground">Profissionais ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <Layers className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">{services.length}</p>
                <p className="text-xs text-muted-foreground">Serviços cadastrados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div>
                <p className="text-lg font-bold text-foreground">{completed}</p>
                <p className="text-xs text-muted-foreground">Concluídos • {revPeriod.label}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <XCircle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-lg font-bold text-foreground">{cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelamentos • {revPeriod.label}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Chart + Today ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Agendamentos — últimos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={last7DaysData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="agendamentos" fill="hsl(217, 91%, 53%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Today's appointments */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Hoje
              </CardTitle>
              <Link to={`/${slug}/agenda`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  Ver agenda <CalendarDays className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Nenhum agendamento hoje</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compartilhe seu link e comece a receber clientes.
                    </p>
                  </div>
                  <Button size="sm" onClick={copyLink} className="gap-1.5 mt-2">
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {todayAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{getClientName(apt)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getServiceName(apt.serviceId)} • {getProfessionalName(apt.professionalId)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-semibold text-foreground">{apt.time}</p>
                        <Badge
                          variant={apt.status === "concluido" ? "default" : apt.status === "cancelado" ? "destructive" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Revenue by Payment Method ── */}
        {revenueByPayment.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Faturamento por forma de pagamento • {revPeriod.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {revenueByPayment.map((item) => {
                  const IconComp = paymentMethodIcons[item.method] || Wallet;
                  return (
                    <div key={item.method} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <IconComp className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-foreground">{formatBRL(item.total)}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
