import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Loader2, Building2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CompanyRegisterPage() {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, isAuthenticated, loading: authLoading } = useAuthContext();
  const { company } = useCompanyContext();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated && company) {
    return <Navigate to={`/${slug}/meus-agendamentos`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await register(name, email, phone, cpf, password);
    setSubmitting(false);
    if (result.success) {
      // After registration, link user to company
      if (company) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("company_members").insert({
            company_id: company.id,
            user_id: user.id,
            role: "user",
          });
        }
      }
      toast({ title: "Conta criada!", description: "Faça login para continuar." });
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50 animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          {company && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{company.name}</span>
            </div>
          )}
          <CardTitle className="font-heading text-2xl">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se em {company?.name || "nossa empresa"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} required disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} disabled={submitting} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" required disabled={submitting} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-xs space-y-1 mt-1">
                <p className={password.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                  {password.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                </p>
                <p className={/[A-Z]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} 1 letra maiúscula
                </p>
                <p className={/[0-9]/.test(password) ? "text-green-600" : "text-muted-foreground"}>
                  {/[0-9]/.test(password) ? "✓" : "○"} 1 número
                </p>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Conta
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to={`/${slug}`}>
              <Button variant="outline" className="w-full">Já tenho conta</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
