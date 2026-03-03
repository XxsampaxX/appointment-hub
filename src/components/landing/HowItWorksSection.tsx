import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Cadastre sua empresa",
    desc: "Crie sua conta em menos de 2 minutos e configure seus serviços, profissionais e horários.",
  },
  {
    number: "02",
    title: "Personalize sua agenda",
    desc: "Defina disponibilidade, intervalos e regras de agendamento para cada profissional.",
  },
  {
    number: "03",
    title: "Receba agendamentos",
    desc: "Compartilhe seu link exclusivo e seus clientes agendam online com confirmação automática.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-20 md:py-32 bg-muted/30 border-y border-border/40">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Como funciona
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Comece em 3 passos simples
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Da criação da conta aos primeiros agendamentos em minutos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.number} className="relative text-center space-y-4">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%]">
                  <ArrowRight className="h-5 w-5 text-border mx-auto" />
                </div>
              )}
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-primary/20">
                {s.number}
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
