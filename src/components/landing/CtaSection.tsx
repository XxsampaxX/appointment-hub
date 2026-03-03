import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/5513996524953?text=" +
  encodeURIComponent(
    "Olá! 👋\n\nTenho interesse na Agendya para organizar meus agendamentos e reduzir faltas de clientes.\n\nPoderia me explicar como funciona a implantação e quais planos estão disponíveis?"
  );

export default function CtaSection() {
  return (
    <section id="contato" className="py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="relative max-w-3xl mx-auto text-center rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-10 md:p-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative">
            Pronto para profissionalizar seu atendimento?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto relative">
            Comece agora mesmo e descubra como o Agendya pode transformar a gestão do seu negócio.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link to="/cadastrar-empresa">
              <Button size="lg" className="rounded-xl text-base px-8 gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
                Começar Agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl text-base px-8 gap-2 w-full sm:w-auto"
              onClick={() => window.open(WHATSAPP_URL, "_blank")}
            >
              <MessageCircle className="h-4 w-4" />
              Falar pelo WhatsApp
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground relative">
            Implantação assistida disponível · Sem compromisso · Suporte direto
          </p>
        </div>
      </div>
    </section>
  );
}
