import { useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useClients } from "@/services/supabaseData";
import { useCompanyContext } from "@/contexts/CompanyContext";
import type { Client } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyClient = { name: "", email: "", phone: "", notes: "" };

export default function ClientsPage() {
  const { company } = useCompanyContext();
  const { items: clients, add, update, remove, loading } = useClients(company?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const { toast } = useToast();

  const openNew = () => { setEditing(null); setForm(emptyClient); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, notes: c.notes });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      await update(editing.id, form);
      toast({ title: "Cliente atualizado" });
    } else {
      await add(form as any);
      toast({ title: "Cliente criado" });
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast({ title: "Cliente removido" });
  };

  if (loading) {
    return <SidebarLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SidebarLayout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie sua base de clientes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">{editing ? "Salvar" : "Criar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum cliente cadastrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {clients.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
