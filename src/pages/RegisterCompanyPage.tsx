import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BusinessTypePage from "@/pages/BusinessTypePage";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";
import { ArrowLeft, Building2, Clock, Loader2, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";

function maskCpf(value: string) {
  return value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
}

function maskPhone(value: string) {
  return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
}

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isAuthenticated, loading: authLoading, register, login } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [showBusinessType, setShowBusinessType] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");

  // Registration form state
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCpf, setRegCpf] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (regPassword !== regConfirmPassword) {
        toast({ title: "As senhas não coincidem", variant: "destructive" });
        return;
      }
      setRegSubmitting(true);
      const result = await register(regName, regEmail, regPhone, regCpf, regPassword);
      setRegSubmitting(false);
      if (!result.success) {
        toast({ title: "Erro ao criar conta", description: result.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Agora preencha os dados da empresa." });
      }
    };

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginSubmitting(true);
      const result = await login(loginEmail, loginPassword);
      setLoginSubmitting(false);
      if (!result.success) {
        toast({ title: "Erro de autenticação", description: result.message, variant: "destructive" });
      }
    };

    const passwordValid = regPassword.length >= 8 && /[A-Z]/.test(regPassword) && /[0-9]/.test(regPassword);

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
              Para cadastrar sua empresa, você precisa ter uma conta.
            </p>
          </div>

          {!showRegister && !showLogin && (
            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={() => setShowLogin(true)}>
                Já tenho uma conta
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowRegister(true)}>
                <UserPlus className="h-4 w-4" />
                Criar uma conta
              </Button>
            </div>
          )}

          {showLogin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entrar na sua conta</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail">Email</Label>
                    <Input id="loginEmail" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" required />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword">Senha</Label>
                    <div className="relative">
                      <Input id="loginPassword" type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Sua senha" required className="pr-10" />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loginSubmitting}>
                    {loginSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Entrar
                  </Button>
                </form>
                <div className="mt-3 text-center">
                  <Button variant="link" size="sm" onClick={() => { setShowLogin(false); setShowRegister(true); }}>
                    Não tenho conta, quero criar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showRegister && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Criar conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="regName">Nome completo *</Label>
                    <Input id="regName" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Seu nome" required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="regEmail">Email *</Label>
                    <Input id="regEmail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="seu@email.com" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regPhone">Telefone *</Label>
                      <Input id="regPhone" value={regPhone} onChange={(e) => setRegPhone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" required maxLength={15} />
                    </div>
                    <div>
                      <Label htmlFor="regCpf">CPF</Label>
                      <Input id="regCpf" value={regCpf} onChange={(e) => setRegCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="regPassword">Senha *</Label>
                    <div className="relative">
                      <Input id="regPassword" type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required className="pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {regPassword.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <p className={`text-xs ${regPassword.length >= 8 ? "text-primary" : "text-muted-foreground"}`}>
                          {regPassword.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                        </p>
                        <p className={`text-xs ${/[A-Z]/.test(regPassword) ? "text-primary" : "text-muted-foreground"}`}>
                          {/[A-Z]/.test(regPassword) ? "✓" : "○"} Uma letra maiúscula
                        </p>
                        <p className={`text-xs ${/[0-9]/.test(regPassword) ? "text-primary" : "text-muted-foreground"}`}>
                          {/[0-9]/.test(regPassword) ? "✓" : "○"} Um número
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="regConfirmPassword">Confirmar senha *</Label>
                    <Input id="regConfirmPassword" type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="Repita a senha" required />
                    {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                      <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={regSubmitting || !passwordValid || regPassword !== regConfirmPassword}>
                    {regSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar Conta
                  </Button>
                </form>
                <div className="mt-3 text-center">
                  <Button variant="link" size="sm" onClick={() => { setShowRegister(false); setShowLogin(true); }}>
                    Já tenho conta, quero entrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

  if (showBusinessType && createdCompanyId) {
    return (
      <BusinessTypePage
        companyId={createdCompanyId}
        onComplete={() => {
          setShowBusinessType(false);
          setSuccess(true);
        }}
      />
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
