import { useState, useEffect } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Unplug, MessageSquare, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const META_APP_ID = "26573164005613929";

interface WhatsAppConfig {
  company_id: string;
  display_phone: string | null;
  waba_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AutoReplyConfig {
  welcome_message: string;
  after_hours_message: string;
  is_welcome_enabled: boolean;
  is_after_hours_enabled: boolean;
  business_hours_start: string;
  business_hours_end: string;
}

export default function WhatsAppSettingsPage() {
  const { company } = useCompanyContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Auto-reply state
  const [autoReply, setAutoReply] = useState<AutoReplyConfig>({
    welcome_message: "Olá! Bem-vindo(a). Como posso ajudar?",
    after_hours_message: "Estamos fora do horário de atendimento. Retornaremos em breve!",
    is_welcome_enabled: false,
    is_after_hours_enabled: false,
    business_hours_start: "09:00",
    business_hours_end: "18:00",
  });
  const [savingAutoReply, setSavingAutoReply] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    loadConfig();
    loadAutoReply();
  }, [company?.id]);

  async function loadConfig() {
    if (!company?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("company_whatsapp")
      .select("company_id, display_phone, waba_id, status, created_at, updated_at")
      .eq("company_id", company.id)
      .maybeSingle();
    setConfig(data as WhatsAppConfig | null);
    setLoading(false);
  }

  async function loadAutoReply() {
    if (!company?.id) return;
    const { data } = await supabase
      .from("whatsapp_auto_replies")
      .select("*")
      .eq("company_id", company.id)
      .maybeSingle();
    if (data) {
      setAutoReply({
        welcome_message: data.welcome_message || "",
        after_hours_message: data.after_hours_message || "",
        is_welcome_enabled: data.is_welcome_enabled || false,
        is_after_hours_enabled: data.is_after_hours_enabled || false,
        business_hours_start: (data.business_hours_start as string)?.slice(0, 5) || "09:00",
        business_hours_end: (data.business_hours_end as string)?.slice(0, 5) || "18:00",
      });
    }
  }

  // Handle OAuth callback from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code && company?.id) {
      handleOAuthCallback(code);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [company?.id]);

  async function handleOAuthCallback(code: string) {
    if (!company?.id) return;
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-oauth-callback", {
        body: { code, companyId: company.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "WhatsApp conectado!", description: `Número: ${data.phone}` });
      await loadConfig();
    } catch (err: any) {
      toast({ title: "Erro ao conectar", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  }

  function handleConnect() {
    if (!META_APP_ID) {
      toast({ title: "Meta App ID não configurado", variant: "destructive" });
      return;
    }
    const redirectUri = encodeURIComponent("https://www.agendya.com.br/oauth/meta/callback");
    const state = encodeURIComponent(company?.id || "");
    const scope = "whatsapp_business_management,whatsapp_business_messaging";
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}&extras={"setup":{"channel":"WHATSAPP_BUSINESS_MESSAGING"},"business":{"verification":{"code":""}}}`;
    window.location.href = url;
  }

  async function handleDisconnect() {
    if (!company?.id) return;
    setDisconnecting(true);
    const { error } = await supabase
      .from("company_whatsapp")
      .delete()
      .eq("company_id", company.id);
    if (error) {
      toast({ title: "Erro ao desconectar", description: error.message, variant: "destructive" });
    } else {
      setConfig(null);
      toast({ title: "WhatsApp desconectado" });
    }
    setDisconnecting(false);
  }

  async function handleSaveAutoReply() {
    if (!company?.id) return;
    setSavingAutoReply(true);
    const { error } = await supabase
      .from("whatsapp_auto_replies")
      .upsert(
        {
          company_id: company.id,
          ...autoReply,
        },
        { onConflict: "company_id" }
      );
    setSavingAutoReply(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Respostas automáticas salvas!" });
    }
  }

  const statusInfo = {
    connected: { label: "Conectado", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    disconnected: { label: "Desconectado", icon: XCircle, color: "text-destructive", bg: "bg-destructive/5 border-destructive/20" },
    token_expired: { label: "Token Expirado", icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  };

  const status = config ? statusInfo[config.status as keyof typeof statusInfo] || statusInfo.disconnected : statusInfo.disconnected;
  const StatusIcon = status.icon;

  if (!company) return null;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Integração WhatsApp</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conecte o WhatsApp Business da sua clínica para enviar e receber mensagens
          </p>
        </div>

        <Tabs defaultValue="connection" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connection" className="gap-2">
              <Smartphone className="h-4 w-4" /> Conexão
            </TabsTrigger>
            <TabsTrigger value="auto-reply" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Respostas Automáticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status da Conexão</CardTitle>
                <CardDescription>Conecte seu número WhatsApp Business via Meta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center gap-4 p-4 rounded-lg border ${status.bg}`}>
                      <StatusIcon className={`h-8 w-8 ${status.color}`} />
                      <div className="flex-1">
                        <p className={`font-semibold ${status.color}`}>{status.label}</p>
                        {config?.display_phone && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Número: <span className="font-mono font-medium">{config.display_phone}</span>
                          </p>
                        )}
                        {config?.created_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Conectado em: {new Date(config.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <Badge variant={config?.status === "connected" ? "default" : "destructive"}>
                        {status.label}
                      </Badge>
                    </div>

                    {!config || config.status === "disconnected" ? (
                      <Button onClick={handleConnect} disabled={connecting} className="w-full gap-2" size="lg">
                        {connecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        Conectar com Meta
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        {config.status === "token_expired" && (
                          <Button onClick={handleConnect} disabled={connecting} className="flex-1 gap-2">
                            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                            Reconectar
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          onClick={handleDisconnect}
                          disabled={disconnecting}
                          className="gap-2"
                        >
                          {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                          Desconectar
                        </Button>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground space-y-2">
                      <p className="font-medium">Pré-requisitos:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Conta no <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-primary underline">Meta for Developers</a></li>
                        <li>App criado com produto "WhatsApp" adicionado</li>
                        <li>Número WhatsApp Business verificado</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto-reply">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Respostas Automáticas</CardTitle>
                <CardDescription>Configure mensagens automáticas para seus pacientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Welcome message */}
                <div className="space-y-3 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <Label className="font-medium">Mensagem de Boas-vindas</Label>
                    </div>
                    <Switch
                      checked={autoReply.is_welcome_enabled}
                      onCheckedChange={(v) => setAutoReply((p) => ({ ...p, is_welcome_enabled: v }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enviada automaticamente na primeira mensagem de uma nova conversa
                  </p>
                  <Textarea
                    value={autoReply.welcome_message}
                    onChange={(e) => setAutoReply((p) => ({ ...p, welcome_message: e.target.value }))}
                    disabled={!autoReply.is_welcome_enabled}
                    placeholder="Olá! Bem-vindo(a)..."
                  />
                </div>

                {/* After hours */}
                <div className="space-y-3 p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Label className="font-medium">Mensagem Fora do Expediente</Label>
                    </div>
                    <Switch
                      checked={autoReply.is_after_hours_enabled}
                      onCheckedChange={(v) => setAutoReply((p) => ({ ...p, is_after_hours_enabled: v }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enviada quando a mensagem chega fora do horário comercial
                  </p>
                  <Textarea
                    value={autoReply.after_hours_message}
                    onChange={(e) => setAutoReply((p) => ({ ...p, after_hours_message: e.target.value }))}
                    disabled={!autoReply.is_after_hours_enabled}
                    placeholder="Estamos fora do horário..."
                  />
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                      <Label className="text-sm">Início expediente</Label>
                      <Input
                        type="time"
                        value={autoReply.business_hours_start}
                        onChange={(e) => setAutoReply((p) => ({ ...p, business_hours_start: e.target.value }))}
                        disabled={!autoReply.is_after_hours_enabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Fim expediente</Label>
                      <Input
                        type="time"
                        value={autoReply.business_hours_end}
                        onChange={(e) => setAutoReply((p) => ({ ...p, business_hours_end: e.target.value }))}
                        disabled={!autoReply.is_after_hours_enabled}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveAutoReply} disabled={savingAutoReply} className="w-full">
                  {savingAutoReply && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Respostas Automáticas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
