import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AgendyaLogo from "@/components/AgendyaLogo";
import { Stethoscope, Sparkles, Scissors, Heart, Settings } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "clinic", label: "Clínica / Estética", description: "Clínicas de estética, dermatologia, odontologia", icon: Stethoscope },
  { value: "nail_designer", label: "Nail Designer", description: "Manicures, pedicures, nail art", icon: Sparkles },
  { value: "beauty", label: "Salão / Barbearia", description: "Salões de beleza, barbearias, cabeleireiros", icon: Scissors },
  { value: "therapy", label: "Terapias / Saúde", description: "Psicólogos, fisioterapeutas, nutricionistas", icon: Heart },
  { value: "service", label: "Outros serviços", description: "Consultores, personal trainers, fotógrafos", icon: Settings },
] as const;

export type BusinessTypeValue = typeof BUSINESS_TYPES[number]["value"];

interface BusinessTypePageProps {
  onSelect: (type: BusinessTypeValue) => void;
}

export default function BusinessTypePage({ onSelect }: BusinessTypePageProps) {
  const [selected, setSelected] = useState<BusinessTypeValue | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="container flex items-center h-16 px-4">
          <AgendyaLogo size="md" />
        </div>
      </header>

      <main className="container px-4 py-8 max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Vamos configurar seu negócio</h1>
          <p className="text-muted-foreground mt-2">
            Isso nos ajuda a preparar seu sistema automaticamente
          </p>
        </div>

        <div className="space-y-3">
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
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <Button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="w-full"
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </main>
    </div>
  );
}
