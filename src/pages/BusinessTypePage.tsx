import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AgendyaLogo from "@/components/AgendyaLogo";
import { Loader2, Scissors, Stethoscope, Dumbbell, Briefcase, Wrench, GraduationCap, ArrowLeft } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "beleza", label: "Beleza & Estética", description: "Salões, barbearias, nail designers, spas", icon: Scissors },
  { value: "saude", label: "Saúde & Bem-estar", description: "Clínicas, consultórios, psicólogos, nutricionistas", icon: Stethoscope },
  { value: "fitness", label: "Fitness & Esportes", description: "Personal trainers, academias, estúdios", icon: Dumbbell },
  { value: "educacao", label: "Educação & Aulas", description: "Professores particulares, escolas, cursos", icon: GraduationCap },
  { value: "servicos", label: "Serviços Profissionais", description: "Advogados, contadores, consultores", icon: Briefcase },
  { value: "outros", label: "Outros", description: "Mecânicos, pet shops, fotógrafos e mais", icon: Wrench },
] as const;

interface BusinessTypePageProps {
  companyId: string;
  onComplete: () => void;
}

export default function BusinessTypePage({ companyId, onComplete }: BusinessTypePageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("companies")
      .update({ business_type: selected } as any)
      .eq("id", companyId);

    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    onComplete();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container flex items-center h-16 px-4">
          <AgendyaLogo size="md" />
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Qual é o tipo do seu negócio?</h1>
          <p className="text-muted-foreground mt-2">
            Isso nos ajuda a personalizar sua experiência.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.value;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelected(type.value)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full max-w-sm"
            size="lg"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Continuar
          </Button>
        </div>
      </main>
    </div>
  );
}
