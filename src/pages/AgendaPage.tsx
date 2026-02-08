import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore, generateId } from "@/hooks/useStore";
import type { Appointment, Client, Service } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyForm = { clientId: "", serviceId: "", date: "", time: "", status: "agendado" as Appointment["status"], notes: "" };

export default function AgendaPage() {
  const { items: appointments, add, update, remove } = useStore<Appointment>("crm_appointments");
  const { items: clients } = useStore<Client>("crm_clients");
  const { items: services } = useStore<Service>("crm_services");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({ clientId: a.clientId, serviceId: a.serviceId, date: a.date, time: a.time, status: a.status, notes: a.notes });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.serviceId || !form.date || !form.time) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (editing) {
      update(editing.id, form);
      toast({ title: "Agendamento atualizado" });
    } else {
      add({ id: generateId(), ...form });
      toast({ title: "Agendamento criado" });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    remove(id);
    toast({ title: "Agendamento removido" });
  };

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name ?? "—";

  const statusLabel: Record<string, string> = {
    agendado: "Agendado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    agendado: "text-warning",
    concluido: "text-success",
    cancelado: "text-destructive",
  };

  // Ordenar por data/hora
  const sorted = [...appointments].sort((a, b) => {
    const da = `${a.date}T${a.time}`;
    const db = `${b.date}T${b.time}`;
    return da.localeCompare(db);
  });

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
                  <Label>Cliente</Label>
                  <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 && <p className="text-xs text-destructive">Cadastre clientes primeiro.</p>}
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
                  {services.length === 0 && <p className="text-xs text-destructive">Cadastre serviços primeiro.</p>}
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
              Nenhum agendamento. Cadastre clientes e serviços primeiro.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sorted.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{getClientName(a.clientId)}</p>
                    <p className="text-sm text-muted-foreground">{getServiceName(a.serviceId)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR")} às {a.time}
                    </p>
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
