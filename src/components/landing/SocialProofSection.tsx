import { CheckCircle2, Scissors, Heart, Stethoscope, Briefcase } from "lucide-react";

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

export default function SocialProofSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">
              Para quem é
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Feito para quem atende por{" "}
              <span className="text-primary">agendamento</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Profissionalize o atendimento do seu negócio com uma plataforma completa e intuitiva.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {audiences.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3.5 hover:border-primary/30 transition-colors"
                >
                  <a.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div
                key={b}
                className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/50 p-4 hover:border-primary/20 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-[15px]">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
