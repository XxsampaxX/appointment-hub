import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";
import { ArrowLeft, Building2, Clock, Loader2, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <Building2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Cadastre sua empresa</h2>
            <p className="text-muted-foreground">
              Para cadastrar sua empresa, você precisa ter uma conta. Faça login ou crie uma conta primeiro.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/login")}>Fazer Login</Button>
              <Button variant="outline" onClick={() => navigate("/")}>Voltar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Empresa cadastrada!</h2>
            <p className="text-muted-foreground">
              Sua empresa foi cadastrada com sucesso e está <strong>aguardando aprovação</strong> do administrador.
              Você receberá um aviso quando sua empresa for aprovada.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast({ title: "Preencha o nome da empresa", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("register-company", {
      body: {
        companyName: companyName.trim(),
        document: document.trim(),
      },
    });

    setSubmitting(false);

    if (error) {
      let msg = "Erro desconhecido";
      try {
        const context = (error as any).context;
        if (context && typeof context.json === "function") {
          const body = await context.json();
          msg = body?.error || error.message;
        } else {
          msg = error.message;
        }
      } catch {
        msg = error.message;
      }
      toast({ title: "Erro ao cadastrar empresa", description: msg, variant: "destructive" });
      return;
    }

    if (data?.error) {
      toast({ title: "Erro ao cadastrar empresa", description: data.error, variant: "destructive" });
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <AgendyaLogo size="md" />
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Cadastrar minha empresa</h1>
          <p className="text-muted-foreground mt-2">
            Preencha os dados abaixo. Após o cadastro, sua empresa será analisada e aprovada pelo nosso time.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados da Empresa</CardTitle>
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
                <Label htmlFor="document">CNPJ / Documento (opcional)</Label>
                <Input
                  id="document"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={30}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Plano gratuito com até 50 agendamentos/mês</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Dono: <strong>{currentUser?.name}</strong> ({currentUser?.email})
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Aprovação necessária antes de ativar</p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cadastrar Empresa
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
