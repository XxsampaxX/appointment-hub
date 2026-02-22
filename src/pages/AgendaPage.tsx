import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useAppointments, useClients, useServices, useProfessionals } from "@/services/supabaseData";
import { useCompanyContext } from "@/contexts/CompanyContext";
import type { Appointment, AppointmentStatus, PaymentMethod } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, User, Loader2, Wallet, Settings, CalendarDays, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppConfirmation } from "@/services/whatsappService";
import { enviarConfirmacaoAgendamento } from "@/services/emailService";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const emptyForm = { clientId: "", serviceId: "", professionalId: "", date: "", time: "", status: "agendado" as AppointmentStatus, notes: "", paymentMethod: "" as PaymentMethod | "" };

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
  { value: "nao_compareceu", label: "Não Compareceu" },
];

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
];

const statusLabel: Record<string, string> = {
  agendado: "Agendado", confirmado: "Confirmado", concluido: "Concluído",
  cancelado: "Cancelado", nao_compareceu: "Não Compareceu",
};
const statusColor: Record<string, string> = {
  agendado: "text-warning", confirmado: "text-primary", concluido: "text-success",
  cancelado: "text-destructive", nao_compareceu: "text-muted-foreground",
};

const statusBgColor: Record<string, string> = {
  confirmado: "#22c55e",
  agendado: "#eab308",
  cancelado: "#ef4444",
  concluido: "#3b82f6",
  nao_compareceu: "#6b7280",
};

export default function AgendaPage() {
  const { company } = useCompanyContext();
  const { items: appointments, add, update, remove, loading: la } = useAppointments(company?.id);
  const { items: clients } = useClients(company?.id);
  const { items: services } = useServices(company?.id);
  const { items: professionals } = useProfessionals(company?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({
      clientId: a.clientId,
      serviceId: a.serviceId,
      professionalId: a.professionalId,
      date: a.date,
      time: a.time,
      status: a.status,
      notes: a.notes,
      paymentMethod: a.paymentMethod || "",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId || !form.professionalId || !form.date || !form.time) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const submitData = { ...form, paymentMethod: form.paymentMethod || null };
    if (editing) {
      await update(editing.id, submitData as any);
      toast({ title: "Agendamento atualizado" });
    } else {
      const client = clients.find(c => c.id === form.clientId);
      const clientPhone = client?.phone || "";
      const clientEmail = client?.email || "";
      const serviceName = services.find(s => s.id === form.serviceId)?.name || "";

      await add({ ...form, companyId: company?.id || "" } as any);
      toast({ title: "Agendamento criado" });

      if (clientPhone) {
        sendWhatsAppConfirmation({ phone: clientPhone, name: client?.name || "", date: form.date, time: form.time });
      }
      if (clientEmail) {
        const emailResult = await enviarConfirmacaoAgendamento({
          nome: client?.name || "Cliente", email: clientEmail, servico: serviceName,
          data: form.date, hora: form.time, nomeEmpresa: company?.name || "Empresa",
        });
        if (!emailResult.success) console.warn("[AgendaPage] E-mail não enviado:", emailResult.error);
      }
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast({ title: "Agendamento removido" });
  };

  const getClientName = (a: Appointment) => {
    if (a.clientName) return a.clientName;
    return clients.find((c) => c.id === a.clientId)?.name ?? "—";
  };
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name ?? "—";
  const getProfessionalName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "—";

  const sorted = [...appointments].sort((a, b) => {
    const da = `${a.date}T${a.time}`;
    const db = `${b.date}T${b.time}`;
    return da.localeCompare(db);
  });

  // FullCalendar config from company settings
  const slotMin = company?.workingHoursStart || "08:00";
  const slotMax = company?.workingHoursEnd || "18:00";
  const slotDuration = company?.slotDuration || 30;
  const hiddenDays = useMemo(() => {
    const working = company?.workingDays ?? [1, 2, 3, 4, 5];
    return [0, 1, 2, 3, 4, 5, 6].filter(d => !working.includes(d));
  }, [company?.workingDays]);

  // Map appointments to FullCalendar events
  const calendarEvents = useMemo(() => {
    return appointments.map(a => {
      const svc = services.find(s => s.id === a.serviceId);
      const duration = svc?.duration || slotDuration;
      const startDate = new Date(`${a.date}T${a.time}:00`);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      return {
        id: a.id,
        title: `${getClientName(a)} • ${getServiceName(a.serviceId)}`,
        start: startDate,
        end: endDate,
        backgroundColor: statusBgColor[a.status] || "#6b7280",
        borderColor: statusBgColor[a.status] || "#6b7280",
        extendedProps: { appointment: a },
      };
    });
  }, [appointments, services, clients, slotDuration]);

  if (la) {
    return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-heading text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie seus agendamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="rounded-none gap-1"
              >
                <CalendarDays className="h-4 w-4" /> Calendário
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none gap-1"
              >
                <List className="h-4 w-4" /> Lista
              </Button>
            </div>
            <Button variant="outline" asChild className="gap-2">
              <Link to={`/${company?.slug}/horarios`}><Settings className="h-4 w-4" /> Horários</Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Agendamento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profissional</Label>
                    <Select value={form.professionalId} onValueChange={(v) => setForm({ ...form, professionalId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                      <SelectContent>
                        {professionals.filter(p => p.available).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} - {p.role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente (opcional)</Label>
                    <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Serviço</Label>
                    <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                    </div>
                  </div>
                  {editing && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AppointmentStatus })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })}>
                      <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                      <SelectContent>
                        {paymentMethodOptions.map((pm) => (
                          <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">{editing ? "Salvar" : "Agendar"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card>
            <CardContent className="p-2 sm:p-4">
              <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                locale="pt-br"
                allDaySlot={false}
                slotMinTime={slotMin + ":00"}
                slotMaxTime={slotMax + ":00"}
                slotDuration={{ minutes: slotDuration }}
                hiddenDays={hiddenDays}
                events={calendarEvents}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                buttonText={{ today: "Hoje" }}
                height="auto"
                eventClick={(info) => {
                  const apt = info.event.extendedProps.appointment as Appointment;
                  setSelectedEvent(apt);
                }}
                eventDisplay="block"
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                dayHeaderFormat={{ weekday: "short", day: "numeric", month: "numeric" }}
              />
            </CardContent>
          </Card>
        )}

        {/* Event Detail Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) setSelectedEvent(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-3">
                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-sm">
                  <span className="font-medium text-muted-foreground">Cliente:</span>
                  <span>{getClientName(selectedEvent)}</span>
                  <span className="font-medium text-muted-foreground">Serviço:</span>
                  <span>{getServiceName(selectedEvent.serviceId)}</span>
                  <span className="font-medium text-muted-foreground">Profissional:</span>
                  <span>{getProfessionalName(selectedEvent.professionalId)}</span>
                  <span className="font-medium text-muted-foreground">Data/Hora:</span>
                  <span>{new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("pt-BR")} às {selectedEvent.time}</span>
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <span className={`font-semibold ${statusColor[selectedEvent.status] || ""}`}>
                    {statusLabel[selectedEvent.status] || selectedEvent.status}
                  </span>
                  {selectedEvent.notes && (
                    <>
                      <span className="font-medium text-muted-foreground">Obs:</span>
                      <span>{selectedEvent.notes}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => { openEdit(selectedEvent); setSelectedEvent(null); }}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* List View */}
        {viewMode === "list" && (
          <>
            {sorted.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum agendamento. Cadastre profissionais e serviços primeiro.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {sorted.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{getClientName(a)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getServiceName(a.serviceId)} • <User className="inline h-3 w-3" /> {getProfessionalName(a.professionalId)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR")} às {a.time}
                        </p>
                        {a.clientPhone && <p className="text-xs text-muted-foreground">📱 {a.clientPhone}</p>}
                        {a.paymentMethod && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Wallet className="h-3 w-3" /> {{ pix: "PIX", dinheiro: "Dinheiro", credito: "Crédito", debito: "Débito" }[a.paymentMethod]}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${statusColor[a.status] || "text-muted-foreground"}`}>
                          {statusLabel[a.status] || a.status}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
