import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AgendyaLogo from "@/components/AgendyaLogo";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  Users,
  MessageCircle,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Scissors,
  Stethoscope,
  Briefcase,
  Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_URL =
  "https://wa.me/5513996524953?text=" +
  encodeURIComponent(
    "Olá! 👋\n\nTenho interesse na Agendya para organizar meus agendamentos e reduzir faltas de clientes.\n\nPoderia me explicar como funciona a implantação e quais planos estão disponíveis?"
  );

const features = [
  {
    icon: CalendarDays,
    title: "Agendamento online 24h",
    desc: "Permita que seus clientes agendem sozinhos a qualquer momento, sem precisar ligar.",
  },
  {
    icon: MessageCircle,
    title: "Confirmação automática",
    desc: "Reduza faltas com notificações e lembretes automáticos por WhatsApp e e-mail.",
  },
  {
    icon: Users,
    title: "Gestão completa de clientes",
    desc: "Tenha histórico, controle e organização de todos os seus clientes em um só lugar.",
  },
  {
    icon: Clock,
    title: "Controle total da agenda",
    desc: "Configure horários, intervalos e bloqueios para cada profissional do seu negócio.",
  },
  {
    icon: Shield,
    title: "Dados protegidos",
    desc: "Suas informações e de seus clientes ficam seguras com criptografia e backups.",
  },
  {
    icon: Zap,
    title: "Pronto em minutos",
    desc: "Implantação rápida e assistida. Você começa a receber agendamentos no mesmo dia.",
  },
];

const steps = [
  { number: "1", title: "Fale conosco", desc: "Entre em contato pelo WhatsApp e conheça os planos." },
  { number: "2", title: "Implantação assistida", desc: "Configuramos tudo para você: serviços, profissionais e horários." },
  { number: "3", title: "Comece a receber agendamentos", desc: "Compartilhe o link e seus clientes agendam online." },
];

const audiences = [
  { icon: Scissors, label: "Barbearias & Salões" },
  { icon: Heart, label: "Estética & Beleza" },
  { icon: Stethoscope, label: "Clínicas & Consultórios" },
  { icon: Briefcase, label: "Profissionais Autônomos" },
];

const benefits = [
  "Reduza faltas com lembretes automáticos",
  "Agende 24h sem depender de telefone",
  "Controle financeiro por método de pagamento",
  "Histórico completo de cada cliente",
  "Relatórios e métricas em tempo real",
];

function WhatsAppButton({ className = "", size = "lg" }: { className?: string; size?: "lg" | "default" | "sm" }) {
  return (
    <Button
      size={size}
      className={`gap-2 text-base ${className}`}
      onClick={() => window.open(WHATSAPP_URL, "_blank")}
    >
      <MessageCircle className="h-4 w-4" /> Entre em Contato
    </Button>
  );
}

export default function HomePage() {
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
        <div className="container flex items-center justify-between h-14 sm:h-16 px-4">
          <AgendyaLogo size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/cadastrar-empresa">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2.5 sm:px-3 gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cadastrar Empresa</span>
                <span className="sm:hidden">Cadastrar</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2.5 sm:px-3">Acessar Painel</Button>
            </Link>
            <Button
              size="sm"
              className="gap-1.5 text-xs sm:text-sm px-2.5 sm:px-3"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Entre em Contato</span>
              <span className="sm:hidden">Contato</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="container px-4 py-12 sm:py-20 md:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Zap className="h-3.5 w-3.5" />
            Plataforma de agendamento inteligente
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Nunca mais perca clientes por falta de{" "}
            <span className="text-primary">organização.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema de agendamento online com confirmação automática, lembretes e
            gestão completa para o seu negócio.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <WhatsAppButton />
            <p className="text-sm text-muted-foreground">
              Implantação assistida disponível • Atendimento direto pelo WhatsApp
            </p>
          </div>
          {companyCount !== null && companyCount >= 50 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Já são{" "}
              <span className="font-semibold text-foreground">{companyCount}</span>{" "}
              {companyCount === 1 ? "empresa" : "empresas"} usando o Agendya
            </p>
          )}
        </div>
      </section>

      {/* Features / Benefícios */}
      <section className="container px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Funcionalidades pensadas para facilitar a rotina de quem atende por agendamento.
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

      {/* Como funciona */}
      <section className="bg-muted/40 border-y border-border/50">
        <div className="container px-4 py-16 md:py-24">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">
            Como funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.number} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                  {s.number}
                </div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="container px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Para quem é o <span className="text-primary">Agendya</span>?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Feito para qualquer profissional ou empresa que trabalhe com
              agendamento e queira profissionalizar o atendimento.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {audiences.map((a) => (
                <div key={a.label} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  <a.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary/5 border-t border-border/50">
        <div className="container px-4 py-16 md:py-24 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Pronto para profissionalizar seu atendimento?
            </h2>
            <p className="text-muted-foreground text-lg">
              Fale com a gente pelo WhatsApp e descubra como o Agendya pode
              transformar a gestão do seu negócio.
            </p>
            <WhatsAppButton />
            <p className="text-sm text-muted-foreground">
              Implantação assistida disponível • Sem compromisso
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <AgendyaLogo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Agendya. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
