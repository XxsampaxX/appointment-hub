import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore, generateId } from "@/hooks/useStore";
import type { Professional } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyForm = { name: "", role: "", avatar: "", available: true };

export default function ProfessionalsPage() {
  const { items: professionals, add, update, remove } = useStore<Professional>("crm_professionals");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Professional) => {
    setEditing(p);
    setForm({ name: p.name, role: p.role, avatar: p.avatar || "", available: p.available });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast({ title: "Preencha nome e função", variant: "destructive" });
      return;
    }
    if (editing) {
      update(editing.id, form);
      toast({ title: "Profissional atualizado" });
    } else {
      add({ id: generateId(), ...form });
      toast({ title: "Profissional criado" });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    remove(id);
    toast({ title: "Profissional removido" });
  };

  const toggleAvailable = (p: Professional) => {
    update(p.id, { available: !p.available });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Profissionais</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie sua equipe</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Profissional</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="João Silva" required />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Barbeiro" required />
                </div>
                <div className="space-y-2">
                  <Label>URL da Foto (opcional)</Label>
                  <Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Disponível para agendamento</Label>
                  <Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
                </div>
                <Button type="submit" className="w-full">{editing ? "Salvar" : "Criar"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {professionals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum profissional cadastrado. Clique em "Novo Profissional" para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((p) => (
              <Card key={p.id} className={!p.available ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.role}</p>
                      <span className={`text-xs font-medium ${p.available ? "text-success" : "text-muted-foreground"}`}>
                        {p.available ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
                    <Button variant="ghost" size="sm" onClick={() => toggleAvailable(p)}>
                      {p.available ? "Desativar" : "Ativar"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
