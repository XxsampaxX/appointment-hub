import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MeuPerfilPage() {
  const { currentUser } = useAuthContext();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: "", email: "" });
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm({ phone: currentUser.phone, email: currentUser.email });
      // fetch created_at from profiles
      supabase.from("profiles").select("created_at").eq("id", currentUser.id).single().then(({ data }) => {
        if (data?.created_at) setCreatedAt(new Date(data.created_at).toLocaleDateString("pt-BR"));
      });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: form.phone, email: form.email })
      .eq("id", currentUser.id);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
    setSaving(false);
  };

  if (!currentUser) {
    return <SidebarLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SidebarLayout>;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentUser.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Conta criada em {createdAt}
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
