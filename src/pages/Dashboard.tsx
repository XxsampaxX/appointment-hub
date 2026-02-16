import { useServices, useProfessionals, useClients, useAppointments } from "@/services/supabaseData";
import { useCompanyContext } from "@/contexts/CompanyContext";
import type { Appointment } from "@/types";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Scissors, Users, CalendarDays, Clock, CheckCircle, XCircle, UserCircle, ExternalLink, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { company, loading: companyLoading } = useCompanyContext();
  const { items: services, loading: ls } = useServices(company?.id);
  const { items: clients, loading: lc } = useClients(company?.id);
  const { items: appointments, loading: la } = useAppointments(company?.id);
  const { items: professionals, loading: lp } = useProfessionals(company?.id);

  const loading = ls || lc || la || lp || companyLoading;

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === today && a.status === "agendado");
  const scheduled = appointments.filter((a) => a.status === "agendado").length;
  const completed = appointments.filter((a) => a.status === "concluido").length;
  const cancelled = appointments.filter((a) => a.status === "cancelado").length;

  const stats = [
    { label: "Profissionais", value: professionals.length, icon: UserCircle, to: "/profissionais", color: "text-primary" },
    { label: "Serviços", value: services.length, icon: Scissors, to: "/servicos", color: "text-accent" },
    { label: "Clientes", value: clients.length, icon: Users, to: "/clientes", color: "text-warning" },
  ];

  const getClientName = (a: Appointment) => {
    if (a.clientName) return a.clientName;
    return clients.find((c) => c.id === a.clientId)?.name ?? "—";
  };
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name ?? "—";
  const getProfessionalName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "—";

  if (loading) {
    return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const bookingLink = company?.slug ? `/agendamento/${company.slug}` : "/agendar";

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {company?.name ? `${company.name} — Visão geral` : "Visão geral do sistema"}
            </p>
          </div>
          <Link to={bookingLink} target="_blank">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Link de Agendamento
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Link key={stat.to} to={stat.to}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-heading">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-lg font-bold">{scheduled}</p>
                <p className="text-xs text-muted-foreground">Agendados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-lg font-bold">{completed}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-lg font-bold">{cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-heading">Agendamentos de Hoje</CardTitle>
            <Link to="/agenda">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Nenhum agendamento para hoje.
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{getClientName(apt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {getServiceName(apt.serviceId)} • {getProfessionalName(apt.professionalId)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{apt.time}</p>
                      {apt.clientPhone && (
                        <p className="text-xs text-muted-foreground">📱 {apt.clientPhone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
