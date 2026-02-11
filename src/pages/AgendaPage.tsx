import { useState } from "react";
import Layout from "@/components/Layout";
import { useAppointments, useClients, useServices, useProfessionals } from "@/hooks/useSupabaseData";
import type { Appointment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyForm = { clientId: "", serviceId: "", professionalId: "", date: "", time: "", status: "agendado" as Appointment["status"], notes: "" };

export default function AgendaPage() {
  const { items: appointments, add, update, remove, loading: la } = useAppointments();
  const { items: clients } = useClients();
  const { items: services } = useServices();
  const { items: professionals } = useProfessionals();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
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
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId || !form.professionalId || !form.date || !form.time) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (editing) {
      await update(editing.id, form);
      toast({ title: "Agendamento atualizado" });
    } else {
      await add(form as any);
      toast({ title: "Agendamento criado" });
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

  const statusLabel: Record<string, string> = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado" };
  const statusColor: Record<string, string> = { agendado: "text-warning", concluido: "text-success", cancelado: "text-destructive" };

  const sorted = [...appointments].sort((a, b) => {
    const da = `${a.date}T${a.time}`;
    const db = `${b.date}T${b.time}`;
    return da.localeCompare(db);
  });

  if (la) {
    return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie seus agendamentos</p>
          </div>
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
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Appointment["status"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">{editing ? "Salvar" : "Agendar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${statusColor[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
