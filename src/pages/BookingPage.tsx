import { useState, useMemo } from "react";
import { useStore, generateId } from "@/hooks/useStore";
import type { Appointment, Service, Professional } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Scissors, User, Clock, ChevronLeft, ChevronRight, Check, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "professional" | "service" | "datetime" | "confirm";

export default function BookingPage() {
  const { items: services } = useStore<Service>("crm_services");
  const { items: professionals } = useStore<Professional>("crm_professionals");
  const { items: appointments, add } = useStore<Appointment>("crm_appointments");
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("professional");
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const availableProfessionals = professionals.filter(p => p.available);

  // Gerar slots de horário (9h às 19h, intervalo de 30min)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 9; h < 19; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
      slots.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  // Verificar horários ocupados
  const busySlots = useMemo(() => {
    if (!selectedDate || !selectedProfessional) return new Set<string>();
    return new Set(
      appointments
        .filter(a => a.date === selectedDate && a.professionalId === selectedProfessional.id && a.status !== "cancelado")
        .map(a => a.time)
    );
  }, [appointments, selectedDate, selectedProfessional]);

  // Próximos 14 dias
  const availableDates = useMemo(() => {
    const dates: { date: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0) { // Excluir domingos
        dates.push({
          date: d.toISOString().split("T")[0],
          label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }),
        });
      }
    }
    return dates;
  }, []);

  const handleConfirm = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      toast({ title: "Preencha seus dados", variant: "destructive" });
      return;
    }
    if (!selectedProfessional || !selectedService || !selectedDate || !selectedTime) return;

    add({
      id: generateId(),
      clientId: "",
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId: selectedService.id,
      professionalId: selectedProfessional.id,
      date: selectedDate,
      time: selectedTime,
      status: "agendado",
      notes: "",
    });

    setConfirmed(true);
    toast({ title: "Agendamento confirmado!" });
  };

  const reset = () => {
    setStep("professional");
    setSelectedProfessional(null);
    setSelectedService(null);
    setSelectedDate("");
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
    setConfirmed(false);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardContent className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Agendamento Confirmado!</h1>
            <div className="text-muted-foreground space-y-1">
              <p><strong>{selectedService?.name}</strong> com <strong>{selectedProfessional?.name}</strong></p>
              <p>
                {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {selectedTime}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Você receberá uma confirmação no WhatsApp.</p>
            <Button onClick={reset} className="mt-4">Fazer Novo Agendamento</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center h-14 px-4">
          {step !== "professional" && (
            <Button variant="ghost" size="icon" onClick={() => {
              if (step === "service") setStep("professional");
              else if (step === "datetime") setStep("service");
              else if (step === "confirm") setStep("datetime");
            }}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 text-center">
            <span className="font-heading font-semibold">Agendar Horário</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress */}
      <div className="container px-4 py-4">
        <div className="flex gap-1">
          {["professional", "service", "datetime", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ["professional", "service", "datetime", "confirm"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <main className="container px-4 pb-8 animate-fade-in">
        {/* Step 1: Professional */}
        {step === "professional" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl font-bold">Escolha o Profissional</h2>
              <p className="text-sm text-muted-foreground">Selecione quem irá atendê-lo</p>
            </div>
            {availableProfessionals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum profissional disponível no momento.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {availableProfessionals.map((p) => (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProfessional?.id === p.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedProfessional(p);
                      setStep("service");
                    }}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.role}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Service */}
        {step === "service" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl font-bold">Escolha o Serviço</h2>
              <p className="text-sm text-muted-foreground">Com {selectedProfessional?.name}</p>
            </div>
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum serviço cadastrado.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {services.map((s) => (
                  <Card
                    key={s.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedService?.id === s.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedService(s);
                      setStep("datetime");
                    }}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" /> {s.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">R$ {s.price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date/Time */}
        {step === "datetime" && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="font-heading text-xl font-bold">Escolha Data e Horário</h2>
              <p className="text-sm text-muted-foreground">{selectedService?.name} • {selectedService?.duration} min</p>
            </div>

            {/* Dates */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Data</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {availableDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => { setSelectedDate(d.date); setSelectedTime(""); }}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border text-center transition-all ${
                      selectedDate === d.date
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary"
                    }`}
                  >
                    <p className="text-xs uppercase">{d.label.split(",")[0]}</p>
                    <p className="font-bold">{d.label.split(" ")[1]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Times */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Horário</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => {
                    const isBusy = busySlots.has(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => !isBusy && setSelectedTime(slot)}
                        disabled={isBusy}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedTime === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : isBusy
                            ? "bg-muted text-muted-foreground border-muted cursor-not-allowed line-through"
                            : "bg-card border-border hover:border-primary"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDate && selectedTime && (
              <Button className="w-full mt-4" onClick={() => setStep("confirm")}>
                Continuar
              </Button>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="font-heading text-xl font-bold">Confirme seu Agendamento</h2>
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Profissional</p>
                    <p className="font-medium">{selectedProfessional?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="font-medium">{selectedService?.name} — R$ {selectedService?.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data e Horário</p>
                    <p className="font-medium">
                      {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {selectedTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client data */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Seu Nome</Label>
                <Input 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Digite seu nome completo"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> WhatsApp
                </Label>
                <Input 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)} 
                  placeholder="(11) 99999-9999"
                  type="tel"
                  required 
                />
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleConfirm}>
              Confirmar Agendamento
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
