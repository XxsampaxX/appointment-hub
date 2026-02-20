import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";

export default function GlobalLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const { login, resetPassword, isAuthenticated, currentUser, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !currentUser || redirecting) return;
    setRedirecting(true);

    supabase
      .from("global_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "master_admin")
      .maybeSingle()
      .then(({ data: masterRole }) => {
        if (masterRole) {
          navigate("/admin-master", { replace: true });
          return;
        }

        supabase
          .from("company_members")
          .select("company_id, role")
          .eq("user_id", currentUser.id)
          .limit(1)
          .single()
          .then(({ data: membership }) => {
            if (!membership) {
              toast({ title: "Sem empresa vinculada", description: "Você não está associado a nenhuma empresa.", variant: "destructive" });
              setRedirecting(false);
              return;
            }

            supabase
              .from("companies")
              .select("slug")
              .eq("id", membership.company_id)
              .single()
              .then(({ data: company }) => {
                if (!company) {
                  toast({ title: "Empresa não encontrada", variant: "destructive" });
                  setRedirecting(false);
                  return;
                }

                const role = membership.role;
                const basePath = `/${company.slug}`;
                if (role === "admin" || role === "recepcionista") {
                  navigate(`${basePath}/admin`, { replace: true });
                } else {
                  navigate(`${basePath}/meus-agendamentos`, { replace: true });
                }
              });
          });
      });
  }, [isAuthenticated, currentUser, redirecting, navigate, toast]);

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.success) {
      toast({ title: "Erro de autenticação", description: result.message, variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    const result = await resetPassword(forgotEmail);
    setForgotSubmitting(false);
    toast({ title: "Verificação enviada", description: result.message });
    setForgotMode(false);
    setForgotEmail("");
  };

  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50 animate-fade-in">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <AgendyaLogo size="lg" />
            </div>
            <CardTitle className="text-2xl">Esqueci minha senha</CardTitle>
            <CardDescription>
              Informe seu email para receber o link de redefinição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="forgot-email" type="email" placeholder="seu@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10" required disabled={forgotSubmitting} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={forgotSubmitting}>
                {forgotSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar link de redefinição
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => setForgotMode(false)}>Voltar ao login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50 animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <AgendyaLogo size="lg" />
          </div>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Acesse o painel da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required disabled={submitting} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required disabled={submitting} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Button variant="link" type="button" className="px-0 text-sm" onClick={() => setForgotMode(true)}>Esqueci minha senha</Button>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
