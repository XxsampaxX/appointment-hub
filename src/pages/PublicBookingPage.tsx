import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePublicServices, usePublicProfessionals, usePublicAppointments } from "@/services/supabaseData";
import type { Company, Service, Professional } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Scissors, User, Clock, ChevronLeft, ChevronRight, Check, CalendarDays, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "professional" | "service" | "datetime" | "confirm";

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser, isAuthenticated } = useAuthContext();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setCompany({
            id: data.id, name: data.name, slug: data.slug,
            logo: data.logo || undefined, phone: data.phone || "",
            address: data.address || "",
            workingHoursStart: typeof data.working_hours_start === "string" ? data.working_hours_start.slice(0, 5) : "09:00",
            workingHoursEnd: typeof data.working_hours_end === "string" ? data.working_hours_end.slice(0, 5) : "18:00",
            slotDuration: data.slot_duration || 30,
            slotInterval: data.slot_interval || 0,
            subscriptionStatus: data.subscription_status || "free",
            maxAppointmentsMonth: data.max_appointments_month || undefined,
          });
        }
        setLoadingCompany(false);
      });
  }, [slug]);

  const { items: services, loading: ls } = usePublicServices(company?.id);
  const { items: professionals, loading: lp } = usePublicProfessionals(company?.id);
  const { items: busyAppointments, loading: la } = usePublicAppointments(company?.id);

  const [step, setStep] = useState<Step>("professional");
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const workStart = company?.workingHoursStart || "09:00";
  const workEnd = company?.workingHoursEnd || "18:00";
  const slotDuration = company?.slotDuration || 30;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const [startH, startM] = workStart.split(":").map(Number);
    const [endH, endM] = workEnd.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    for (let m = startMinutes; m < endMinutes; m += slotDuration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
    }
    return slots;
  }, [workStart, workEnd, slotDuration]);

  const busySlots = useMemo(() => {
    if (!selectedDate || !selectedProfessional) return new Set<string>();
    return new Set(
      busyAppointments
        .filter((a) => a.date === selectedDate && a.professionalId === selectedProfessional.id)
        .map((a) => a.time)
    );
  }, [busyAppointments, selectedDate, selectedProfessional]);

  const availableDates = useMemo(() => {
    const dates: { date: string; label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() !== 0) {
        dates.push({
          date: d.toISOString().split("T")[0],
          label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }),
        });
      }
    }
    return dates;
  }, []);

  const handleConfirm = async () => {
    if (!isAuthenticated || !currentUser) {
      toast({ title: "Faça login para agendar", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    if (!selectedProfessional || !selectedService || !selectedDate || !selectedTime || !company) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("appointments")
      .insert({
        user_id: currentUser.id,
        company_id: company.id,
        service_id: selectedService.id,
        professional_id: selectedProfessional.id,
        date: selectedDate,
        time: selectedTime,
        status: "agendado",
        notes: "",
        client_name: currentUser.name,
        client_phone: currentUser.phone,
      });

    setSubmitting(false);
    if (error) {
      if (error.message?.includes("unique") || error.code === "23505") {
        toast({ title: "Horário indisponível", variant: "destructive" });
      } else {
        toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
      }
      return;
    }

    setConfirmed(true);
    toast({ title: "Agendamento confirmado!" });
  };

  const generateWhatsAppLink = () => {
    if (!selectedProfessional || !selectedService || !selectedDate || !selectedTime || !company) return "";
    const dateFormatted = new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    const message = `Olá, gostaria de confirmar meu agendamento para ${dateFormatted} às ${selectedTime}. Serviço: ${selectedService.name} com ${selectedProfessional.name}.`;
    const phone = company.phone?.replace(/\D/g, "") || "";
    return `https://wa.me/${phone ? "55" + phone : ""}?text=${encodeURIComponent(message)}`;
  };

  const reset = () => {
    setStep("professional");
    setSelectedProfessional(null);
    setSelectedService(null);
    setSelectedDate("");
    setSelectedTime("");
    setConfirmed(false);
  };

  if (loadingCompany || ls || lp || la) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <h1 className="font-heading text-2xl font-bold">Empresa não encontrada</h1>
            <p className="text-muted-foreground">O link de agendamento não é válido.</p>
            <Link to="/"><Button>Voltar ao Início</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    const whatsappLink = generateWhatsAppLink();
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardContent className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Agendamento Confirmado!</h1>
            <div className="text-muted-foreground space-y-1">
              <p><strong>{selectedService?.name}</strong> com <strong>{selectedProfessional?.name}</strong></p>
              <p>{selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {selectedTime}</p>
              <p className="font-medium text-primary">R$ {selectedService?.price.toFixed(2)}</p>
            </div>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 mt-2">📱 Confirmar via WhatsApp</Button>
              </a>
            )}
            <Button onClick={reset} className="mt-4">Fazer Novo Agendamento</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            {step !== "professional" && (
              <Button variant="ghost" size="icon" onClick={() => {
                if (step === "service") setStep("professional");
                else if (step === "datetime") setStep("service");
                else if (step === "confirm") setStep("datetime");
              }}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <span className="font-heading font-semibold">{company?.name}</span>
          </div>
          {!isAuthenticated && (
            <Link to="/">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container px-4 py-4">
        <div className="flex gap-1">
          {["professional", "service", "datetime", "confirm"].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              ["professional", "service", "datetime", "confirm"].indexOf(step) >= i ? "bg-primary" : "bg-muted"
            }`} />
          ))}
        </div>
      </div>

      <main className="container px-4 pb-8 animate-fade-in">
        {step === "professional" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl font-bold">Escolha o Profissional</h2>
              <p className="text-sm text-muted-foreground">Selecione quem irá atendê-lo</p>
            </div>
            {professionals.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum profissional disponível.</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {professionals.map((p) => (
                  <Card key={p.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => { setSelectedProfessional(p); setStep("service"); }}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover rounded-full" /> : <User className="h-7 w-7 text-muted-foreground" />}
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

        {step === "service" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl font-bold">Escolha o Serviço</h2>
              <p className="text-sm text-muted-foreground">Com {selectedProfessional?.name}</p>
            </div>
            <div className="grid gap-3">
              {services.map((s) => (
                <Card key={s.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => { setSelectedService(s); setStep("datetime"); }}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scissors className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> {s.duration} min</p>
                    </div>
                    <p className="font-bold text-primary">R$ {s.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="font-heading text-xl font-bold">Escolha Data e Horário</h2>
              <p className="text-sm text-muted-foreground">{selectedService?.name} • {selectedService?.duration} min</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Data</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {availableDates.map((d) => (
                  <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedTime(""); }}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border text-center transition-all ${
                      selectedDate === d.date ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"
                    }`}>
                    <p className="text-xs uppercase">{d.label.split(",")[0]}</p>
                    <p className="font-bold">{d.label.split(" ")[1]}</p>
                  </button>
                ))}
              </div>
            </div>
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Horário</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => {
                    const isBusy = busySlots.has(slot);
                    return (
                      <button key={slot} onClick={() => !isBusy && setSelectedTime(slot)} disabled={isBusy}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedTime === slot ? "bg-primary text-primary-foreground border-primary"
                          : isBusy ? "bg-muted text-muted-foreground border-muted cursor-not-allowed line-through"
                          : "bg-card border-border hover:border-primary"
                        }`}>{slot}</button>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedDate && selectedTime && (
              <Button className="w-full mt-4" onClick={() => setStep("confirm")}>Continuar</Button>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="font-heading text-xl font-bold">Confirme seu Agendamento</h2>
            </div>
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
                    <p className="text-xs text-muted-foreground">{selectedService?.duration} min</p>
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
            {!isAuthenticated ? (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">Você precisa estar logado para confirmar o agendamento.</p>
                <Link to="/">
                  <Button className="w-full">Fazer Login</Button>
                </Link>
              </div>
            ) : (
              <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar Agendamento
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
