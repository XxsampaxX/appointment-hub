import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import LandingHeader from "@/components/landing/LandingHeader";
import { CheckCircle2, X, ArrowRight, Sparkles, MessageCircle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5513996524953?text=" +
  encodeURIComponent(
    "Olá! 👋\n\nTenho interesse em conhecer os planos da Agendya.\n\nPoderia me explicar os detalhes e valores?"
  );

const plans = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    description: "Ideal para quem está começando e quer testar a plataforma.",
    highlight: false,
    features: [
      { text: "Até 50 agendamentos/mês", included: true },
      { text: "Agendamento online 24h", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "1 profissional", included: true },
      { text: "Lembretes por e-mail", included: true },
      { text: "Lembretes por WhatsApp", included: false },
      { text: "Agendamentos ilimitados", included: false },
      { text: "Relatórios avançados", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    cta: "Começar Grátis",
    ctaLink: "/cadastrar-empresa",
  },
  {
    name: "Pago",
    price: "Sob consulta",
    period: "",
    description: "Para negócios que precisam de mais recursos e sem limites.",
    highlight: true,
    features: [
      { text: "Agendamentos ilimitados", included: true },
      { text: "Agendamento online 24h", included: true },
      { text: "Gestão completa de clientes", included: true },
      { text: "Profissionais ilimitados", included: true },
      { text: "Lembretes por e-mail", included: true },
      { text: "Lembretes por WhatsApp", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Implantação assistida", included: true },
    ],
    cta: "Fale Conosco",
    ctaLink: WHATSAPP_URL,
    external: true,
  },
];

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-14 sm:h-16 px-4">
          <Link to="/">
            <AgendyaLogo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">Acessar Painel</Button>
            </Link>
            <Link to="/cadastrar-empresa">
              <Button size="sm" className="text-xs sm:text-sm gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                Cadastrar Empresa
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="container px-4 py-12 sm:py-16 md:py-20 text-center relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Escolha o melhor plano para seu negócio
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto leading-tight">
            Planos que cabem no seu <span className="text-primary">bolso</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Comece gratuitamente e evolua conforme seu negócio cresce.
          </p>
        </div>
      </section>

      {/* Plans grid */}
      <section className="container px-4 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.highlight
                  ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Recomendado
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-4">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground/60"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.external ? (
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={() => window.open(plan.ctaLink, "_blank")}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {plan.cta}
                    </Button>
                  ) : (
                    <Link to={plan.ctaLink}>
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        variant={plan.highlight ? "default" : "outline"}
                      >
                        <ArrowRight className="h-4 w-4" />
                        {plan.cta}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="bg-muted/40 border-t border-border/50">
        <div className="container px-4 py-16 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Ficou com dúvidas?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Fale diretamente com a gente pelo WhatsApp. Ajudamos você a escolher o plano ideal.
          </p>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.open(WHATSAPP_URL, "_blank")}
          >
            <MessageCircle className="h-4 w-4" />
            Falar pelo WhatsApp
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/">
            <AgendyaLogo size="sm" />
          </Link>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Agendya. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
