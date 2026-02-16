import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Mail, KeyRound, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function CompanyLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyNotFound, setCompanyNotFound] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const { login, isAuthenticated, loading: authLoading } = useAuthContext();
  const { setCompanyFromSlug, company, companyRole } = useCompanyContext();
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoadingCompany(true);
      const found = await setCompanyFromSlug(slug);
      if (found) {
        setCompanyName(found.name);
      } else {
        setCompanyNotFound(true);
      }
      setLoadingCompany(false);
    })();
  }, [slug, setCompanyFromSlug]);

  if (authLoading || loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && company) {
    const redirect = companyRole === "admin" || companyRole === "recepcionista"
      ? "/dashboard"
      : "/meus-agendamentos";
    return <Navigate to={redirect} replace />;
  }

  if (companyNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardContent className="pt-6 text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Empresa não encontrada</h2>
            <p className="text-muted-foreground">
              Não encontramos nenhuma empresa com o identificador "<strong>{slug}</strong>".
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-2">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
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
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          {companyName && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{companyName}</span>
            </div>
          )}
          <CardTitle className="font-heading text-2xl">Entrar</CardTitle>
          <CardDescription>
            Acesse o painel de {companyName || "sua empresa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  className="pl-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to={`/empresa/${slug}/cadastro`}>
              <Button variant="outline" className="w-full">Criar Conta</Button>
            </Link>
          </div>
          <div className="mt-3 text-center">
            <Link to={`/agendamento/${slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Agendar como cliente →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
