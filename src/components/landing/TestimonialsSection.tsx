import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Camila Ferreira",
    role: "Dona de Salão de Beleza",
    text: "Reduzi as faltas em mais de 60% com os lembretes automáticos. Meus clientes adoram agendar pelo link!",
  },
  {
    name: "Rafael Mendes",
    role: "Barbeiro",
    text: "Antes eu perdia tempo no WhatsApp confirmando horário. Agora tudo é automático e minha agenda está sempre cheia.",
  },
  {
    name: "Dra. Patrícia Lima",
    role: "Dermatologista",
    text: "A organização da agenda ficou impecável. Consigo focar no atendimento e a equipe gerencia tudo pelo painel.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/30 border-y border-border/40">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Depoimentos
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            O que nossos clientes dizem
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <Card
              key={t.name}
              className="border-border/50 rounded-2xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{t.text}"
                </p>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
