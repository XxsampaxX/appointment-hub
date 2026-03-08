import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConfiguracoesPage() {
  const { company, loading: cl } = useCompanyContext();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    slot_interval: 0,
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        phone: company.phone,
        address: company.address,
        working_hours_start: company.workingHoursStart,
        working_hours_end: company.workingHoursEnd,
        slot_interval: company.slotInterval,
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: form.name,
        phone: form.phone,
        address: form.address,
        working_hours_start: form.working_hours_start,
        working_hours_end: form.working_hours_end,
        slot_interval: form.slot_interval,
      })
      .eq("id", company.id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
    setSaving(false);
  };

  if (cl) {
    return <SidebarLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SidebarLayout>;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Estabelecimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário de Início</Label>
                <Input type="time" value={form.working_hours_start} onChange={(e) => setForm({ ...form, working_hours_start: e.target.value })} />
              </div>
              <div>
                <Label>Horário de Fim</Label>
                <Input type="time" value={form.working_hours_end} onChange={(e) => setForm({ ...form, working_hours_end: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Intervalo de Agenda (minutos)</Label>
              <Input type="number" min={0} value={form.slot_interval} onChange={(e) => setForm({ ...form, slot_interval: Number(e.target.value) })} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
