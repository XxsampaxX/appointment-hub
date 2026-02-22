import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { useBlockedSlots } from "@/hooks/useBlockedSlots";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Ban, Settings } from "lucide-react";

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export default function ScheduleSettingsPage() {
  const { company } = useCompanyContext();
  const { items: blockedSlots, loading: loadingBlocked, add: addBlock, toggleActive, remove: removeBlock } = useBlockedSlots(company?.id);
  const { toast } = useToast();

  // Working hours state
  const [workStart, setWorkStart] = useState(company?.workingHoursStart || "09:00");
  const [workEnd, setWorkEnd] = useState(company?.workingHoursEnd || "18:00");
  const [slotDuration, setSlotDuration] = useState(company?.slotDuration || 30);
  const [slotInterval, setSlotInterval] = useState(company?.slotInterval || 0);
  const [workingDays, setWorkingDays] = useState<number[]>(company?.workingDays || [1, 2, 3, 4, 5]);
  const [savingHours, setSavingHours] = useState(false);

  // Block form state
  const [blockDate, setBlockDate] = useState("");
  const [blockTime, setBlockTime] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSaveHours = async () => {
    if (!company) return;
    setSavingHours(true);
    const { error } = await supabase
      .from("companies")
      .update({
        working_hours_start: workStart,
        working_hours_end: workEnd,
        slot_duration: slotDuration,
        slot_interval: slotInterval,
        working_days: workingDays,
      } as any)
      .eq("id", company.id);
    setSavingHours(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
    }
  };

  const handleAddBlock = async () => {
    if (!blockDate || !blockTime) {
      toast({ title: "Preencha data e horário", variant: "destructive" });
      return;
    }
    if (!blockReason.trim()) {
      toast({ title: "Motivo é obrigatório", variant: "destructive" });
      return;
    }
    setAddingBlock(true);
    const { error } = await addBlock({ date: blockDate, time: blockTime, reason: blockReason.trim() });
    setAddingBlock(false);
    if (error) {
      if (error.message?.includes("unique") || (error as any).code === "23505") {
        toast({ title: "Este horário já está bloqueado", variant: "destructive" });
      } else {
        toast({ title: "Erro ao bloquear", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Horário bloqueado!" });
      setBlockDate("");
      setBlockTime("");
      setBlockReason("");
    }
  };

  const handleToggleBlock = async (id: string, currentActive: boolean) => {
    await toggleActive(id, !currentActive);
    toast({ title: !currentActive ? "Bloqueio reativado" : "Bloqueio desativado" });
  };

  const handleRemoveBlock = async (id: string) => {
    await removeBlock(id);
    toast({ title: "Bloqueio removido" });
  };

  // Generate time slot options based on working hours
  const timeOptions = useMemo(() => {
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

  const activeBlocks = blockedSlots.filter((b) => b.active);
  const inactiveBlocks = blockedSlots.filter((b) => !b.active);

  if (!company) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Configuração de Horários</h1>
          <p className="text-muted-foreground text-sm mt-1">Defina os horários de atendimento e bloqueie datas específicas</p>
        </div>

        <Tabs defaultValue="hours" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hours" className="gap-2"><Settings className="h-4 w-4" /> Horários</TabsTrigger>
            <TabsTrigger value="block" className="gap-2"><Ban className="h-4 w-4" /> Bloquear</TabsTrigger>
            <TabsTrigger value="list" className="gap-2"><Clock className="h-4 w-4" /> Bloqueios</TabsTrigger>
          </TabsList>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Dias da Semana Ativos</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          workingDays.includes(day.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Início</Label>
                    <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fim</Label>
                    <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duração do Slot (min)</Label>
                    <Input type="number" min={5} max={240} value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo entre Slots (min)</Label>
                    <Input type="number" min={0} max={60} value={slotInterval} onChange={(e) => setSlotInterval(Number(e.target.value))} />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <p><strong>Prévia:</strong> {timeOptions.length} slots por dia ({workStart} - {workEnd}), a cada {slotDuration} min{slotInterval > 0 ? ` + ${slotInterval} min intervalo` : ""}</p>
                </div>

                <Button onClick={handleSaveHours} disabled={savingHours} className="w-full">
                  {savingHours && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="block">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bloquear Horário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Motivo <span className="text-destructive">*</span></Label>
                  <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ex: Reunião interna, feriado, manutenção..." />
                </div>
                <Button onClick={handleAddBlock} disabled={addingBlock} className="w-full gap-2">
                  {addingBlock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Bloquear Horário
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bloqueios Ativos ({activeBlocks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingBlocked ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : activeBlocks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">Nenhum bloqueio ativo</p>
                  ) : (
                    <div className="space-y-2">
                      {activeBlocks.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                          <div>
                            <p className="font-medium text-sm">
                              {new Date(b.date + "T00:00:00").toLocaleDateString("pt-BR")} às {b.time}
                            </p>
                            <p className="text-xs text-muted-foreground">{b.reason}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(b.id, true)} title="Desativar">
                              <ToggleRight className="h-4 w-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveBlock(b.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {inactiveBlocks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-muted-foreground">Bloqueios Inativos ({inactiveBlocks.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inactiveBlocks.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">
                              {new Date(b.date + "T00:00:00").toLocaleDateString("pt-BR")} às {b.time}
                            </p>
                            <p className="text-xs text-muted-foreground">{b.reason}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleBlock(b.id, false)} title="Reativar">
                              <ToggleLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveBlock(b.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
