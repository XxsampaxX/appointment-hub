import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setLoading(false);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
      setLoading(false);
    }

    // Timeout to stop loading if no recovery event
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      toast({ title: "Senha fraca", description: "A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.", variant: "destructive" });
      return;
    }

    if (!passwordsMatch) {
      toast({ title: "Senhas diferentes", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError("Erro ao redefinir senha. O link pode ter expirado.");
      toast({ title: "Erro", description: "Não foi possível redefinir a senha. Solicite um novo link.", variant: "destructive" });
    } else {
      setSuccess(true);
      // Sign out to force fresh login
      await supabase.auth.signOut();
      toast({ title: "Senha redefinida com sucesso", description: "Faça login com sua nova senha." });
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <AgendyaLogo size="lg" />
            </div>
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Link inválido</CardTitle>
            <CardDescription>
              Este link de redefinição é inválido ou já foi utilizado. Solicite um novo link na tela de login.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login", { replace: true })}>Ir para o login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <AgendyaLogo size="lg" />
            </div>
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Senha redefinida com sucesso</CardTitle>
            <CardDescription>
              Redirecionando para o login...
            </CardDescription>
          </CardHeader>
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
          <CardTitle className="text-2xl">Redefinir senha</CardTitle>
          <CardDescription>
            Crie uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required disabled={submitting} />
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
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirme a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required disabled={submitting} />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">As senhas não coincidem</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting || !passwordValid || !passwordsMatch}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Redefinir senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
