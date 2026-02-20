import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  Users,
  Smartphone,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import agendyaLogo from "@/assets/agendya-logo.png";

const features = [
  {
    icon: CalendarDays,
    title: "Agendamento Online",
    desc: "Seus clientes agendam 24h pelo link exclusivo da sua empresa.",
  },
  {
    icon: Clock,
    title: "Gestão de Horários",
    desc: "Configure horários, duração e intervalos de cada serviço.",
  },
  {
    icon: Users,
    title: "Multi-Profissionais",
    desc: "Gerencie a agenda de todos os profissionais em um só lugar.",
  },
  {
    icon: Smartphone,
    title: "Notificações",
    desc: "Lembretes automáticos por WhatsApp e e-mail para seus clientes.",
  },
  {
    icon: Shield,
    title: "Seguro & Confiável",
    desc: "Dados protegidos com criptografia e backups automáticos.",
  },
  {
    icon: Zap,
    title: "Rápido de Configurar",
    desc: "Cadastre sua empresa e comece a receber agendamentos em minutos.",
  },
];

const benefits = [
  "Reduza faltas com lembretes automáticos",
  "Aumente sua receita com agenda sempre cheia",
  "Elimine agendamentos por telefone",
  "Controle financeiro por método de pagamento",
  "Relatórios e métricas em tempo real",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [companyCount, setCompanyCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setCompanyCount(count ?? 0));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <img src={agendyaLogo} alt="Agendya" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/empresas")}>
              <Building2 className="h-4 w-4 mr-1" />
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/empresas")}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="container px-4 py-20 md:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Zap className="h-3.5 w-3.5" />
            Plataforma de agendamento inteligente
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Simplifique seus{" "}
            <span className="text-primary">agendamentos</span> e nunca mais
            perca um cliente
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            O Agendya é a plataforma completa para gerenciar agendamentos,
            profissionais e clientes do seu negócio — tudo online, rápido e
            seguro.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="gap-2 text-base" onClick={() => navigate("/empresas")}>
              Começar Agora <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base" onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Conhecer Recursos
            </Button>
          </div>
          {companyCount !== null && companyCount > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Já são <span className="font-semibold text-foreground">{companyCount}</span>{" "}
              {companyCount === 1 ? "empresa" : "empresas"} usando o Agendya
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Recursos poderosos para transformar a gestão do seu negócio.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group hover:border-primary/40 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/40 border-y border-border/50">
        <div className="container px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold">
                Por que escolher o <span className="text-primary">Agendya</span>?
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Feito para salões, barbearias, clínicas, estúdios e qualquer
                negócio que trabalhe com agendamento.
              </p>
            </div>
            <ul className="space-y-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container px-4 py-16 md:py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Pronto para modernizar seu negócio?
          </h2>
          <p className="text-muted-foreground text-lg">
            Crie sua conta gratuita e comece a receber agendamentos online
            em poucos minutos.
          </p>
          <Button size="lg" className="gap-2 text-base" onClick={() => navigate("/empresas")}>
            Criar Minha Conta Grátis <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src={agendyaLogo} alt="Agendya" className="h-6 w-auto object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Agendya. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
