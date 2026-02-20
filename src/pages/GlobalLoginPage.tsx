import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Mail, KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function GlobalLoginPage() {
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const { login, isAuthenticated, currentUser, loading: authLoading } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  // After login, find user's company and redirect
  useEffect(() => {
    if (!isAuthenticated || !currentUser || redirecting) return;

    setRedirecting(true);

    // Check if master admin first
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

        // Find user's company
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

            // Get company slug
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, cpf);
    setSubmitting(false);
    if (!result.success) {
      toast({ title: "Erro de autenticação", description: result.message, variant: "destructive" });
    }
  };

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
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="cpf" type="text" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} className="pl-10" required disabled={submitting} />
              </div>
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
