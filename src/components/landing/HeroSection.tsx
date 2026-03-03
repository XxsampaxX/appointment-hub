import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Users, Bell, BarChart3 } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5513996524953?text=" +
  encodeURIComponent(
    "Olá! 👋\n\nTenho interesse na Agendya para organizar meus agendamentos e reduzir faltas de clientes.\n\nPoderia me explicar como funciona a implantação e quais planos estão disponíveis?"
  );

export default function HeroSection() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/8 pointer-events-none" />
      <div className="absolute top-20 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container px-4 md:px-6 py-16 sm:py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Plataforma de agendamento inteligente
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Automatize seus agendamentos e{" "}
              <span className="text-primary">nunca mais perca clientes.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Sistema completo com confirmação automática, lembretes por WhatsApp e gestão inteligente para o seu negócio crescer.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/cadastrar-empresa">
                <Button size="lg" className="rounded-xl text-base px-8 gap-2 w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Começar Agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl text-base px-8 w-full sm:w-auto"
                onClick={() => window.open(WHATSAPP_URL, "_blank")}
              >
                Falar pelo WhatsApp
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              ✓ Implantação assistida &nbsp;·&nbsp; ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Suporte direto
            </p>
          </div>

          {/* Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="w-3 h-3 rounded-full bg-warning/60" />
                  <span className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">app.agendya.com.br</span>
              </div>
              {/* Mock content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje, 3 de Março</p>
                    <h3 className="text-lg font-semibold">Agenda do Dia</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>

                {[
                  { time: "09:00", name: "Maria Silva", service: "Corte + Escova", status: "Confirmado" },
                  { time: "10:30", name: "João Santos", service: "Barba Completa", status: "Agendado" },
                  { time: "14:00", name: "Ana Costa", service: "Manicure", status: "Confirmado" },
                ].map((a) => (
                  <div key={a.time} className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/20 p-3">
                    <span className="text-sm font-mono font-medium text-primary w-12">{a.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.service}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${a.status === "Confirmado" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                      {a.status}
                    </span>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { icon: Users, label: "Clientes", value: "148" },
                    { icon: CalendarDays, label: "Agendamentos", value: "32" },
                    { icon: BarChart3, label: "Taxa confirm.", value: "94%" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                      <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-border/60 bg-card shadow-lg p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Lembrete enviado</p>
                <p className="text-xs text-muted-foreground">Maria Silva · 09:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
