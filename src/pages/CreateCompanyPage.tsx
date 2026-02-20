import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ShieldCheck, Building2, User } from "lucide-react";

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [plan, setPlan] = useState("free");
  const [status, setStatus] = useState("active");

  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !ownerName.trim() || !ownerEmail.trim() || !ownerPassword.trim()) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (ownerPassword.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("create-company", {
      body: {
        companyName: companyName.trim(),
        document: document.trim(),
        plan,
        status,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPassword,
        sendEmail,
      },
    });

    setSubmitting(false);

    if (error || data?.error) {
      toast({
        title: "Erro ao criar empresa",
        description: data?.error || error?.message || "Erro desconhecido",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Empresa criada com sucesso!", description: `Slug: ${data?.company?.slug}` });
    navigate("/admin-master");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <AgendyaLogo size="md" />
            <Badge variant="destructive" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Master Admin
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin-master")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Nova Empresa</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Studio Beleza"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="document">CNPJ / Documento</Label>
                <Input
                  id="document"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={30}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Período</Label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Grátis</SelectItem>
                      <SelectItem value="pro">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="suspended">Suspensa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Dados do Dono
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ownerName">Nome *</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="ownerEmail">Email *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="ownerPassword">Senha Temporária *</Label>
                <Input
                  id="ownerPassword"
                  type="text"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  maxLength={50}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(!!checked)}
                />
                <Label htmlFor="sendEmail" className="text-sm cursor-pointer">
                  Enviar email com credenciais de acesso
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Empresa
          </Button>
        </form>
      </main>
    </div>
  );
}
