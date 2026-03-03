import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  Users,
  MessageCircle,
  Shield,
  Zap,
} from "lucide-react";

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

export default function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Funcionalidades pensadas para facilitar a rotina de quem atende por agendamento.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {features.map((f) => (
            <Card
              key={f.title}
              className="group border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-2xl"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
