import { useState, useMemo } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useAppointments, useServices, useClients } from "@/services/supabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, Clock, AlertCircle } from "lucide-react";

const paymentLabels: Record<string, string> = {
  pix: "PIX", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito",
};
const statusLabels: Record<string, string> = {
  pago: "Pago", pendente: "Pendente", cancelado: "Cancelado",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroPage() {
  const { company, loading: cl } = useCompanyContext();
  const { items: appointments, loading: al } = useAppointments(company?.id);
  const { items: services, loading: sl } = useServices(company?.id);
  const { items: clients, loading: cll } = useClients(company?.id);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loading = cl || al || sl || cll;

  const rows = useMemo(() => {
    return appointments.map((a) => {
      const svc = services.find((s) => s.id === a.serviceId);
      const client = a.clientName || clients.find((c) => c.id === a.clientId)?.name || "—";
      const isPaid = a.status === "concluido";
      const isCancelled = a.status === "cancelado";
      const finStatus = isCancelled ? "cancelado" : isPaid ? "pago" : "pendente";
      return {
        id: a.id,
        client,
        service: svc?.name || "—",
        price: svc?.price || 0,
        status: finStatus,
        paymentMethod: a.paymentMethod ? paymentLabels[a.paymentMethod] || a.paymentMethod : "—",
        date: a.date,
      };
    });
  }, [appointments, services, clients]);

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  const totalReceived = rows.filter((r) => r.status === "pago").reduce((s, r) => s + r.price, 0);
  const totalPending = rows.filter((r) => r.status === "pendente").reduce((s, r) => s + r.price, 0);
  const totalAll = totalReceived + totalPending;

  if (loading) {
    return <SidebarLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SidebarLayout>;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase mb-2">
                <TrendingUp className="h-4 w-4" /> Total Recebido
              </div>
              <p className="text-2xl font-bold text-success">{formatBRL(totalReceived)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase mb-2">
                <Clock className="h-4 w-4" /> Total Pendente
              </div>
              <p className="text-2xl font-bold text-warning">{formatBRL(totalPending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase mb-2">
                <DollarSign className="h-4 w-4" /> Faturamento Total
              </div>
              <p className="text-2xl font-bold text-foreground">{formatBRL(totalAll)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Procedimento</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Forma de Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">Nenhum registro encontrado</td></tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id} className="border-b border-border hover:bg-muted/20">
                        <td className="p-3">{r.client}</td>
                        <td className="p-3">{r.service}</td>
                        <td className="p-3">{formatBRL(r.price)}</td>
                        <td className="p-3">
                          <Badge variant={r.status === "pago" ? "default" : r.status === "pendente" ? "secondary" : "destructive"}>
                            {statusLabels[r.status]}
                          </Badge>
                        </td>
                        <td className="p-3">{r.paymentMethod}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
