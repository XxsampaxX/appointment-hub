import { useState, useEffect, useRef, useCallback } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Search,
  MessageSquare,
  Phone,
  User,
  Check,
  CheckCheck,
  Clock,
  CircleDot,
  Eye,
  EyeOff,
} from "lucide-react";

interface Conversation {
  id: string;
  company_id: string;
  client_id: string | null;
  phone_number: string;
  status: string;
  unread_count: number;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: string;
  content: string;
  message_type: string;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  em_atendimento: { label: "Em Atendimento", color: "bg-green-100 text-green-800" },
  aguardando_paciente: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  finalizado: { label: "Finalizado", color: "bg-muted text-muted-foreground" },
};

export default function WhatsAppChatPage() {
  const { company } = useCompanyContext();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!company?.id) return;
    loadConversations();

    // Realtime subscription for conversations
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "conversations",
        filter: `company_id=eq.${company.id}`,
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [company?.id]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConvId || !company?.id) return;

    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selectedConvId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selectedConvId}`,
      }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvId, company?.id]);

  async function loadConversations() {
    if (!company?.id) return;
    setLoadingConversations(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("company_id", company.id)
      .order("last_message_at", { ascending: false });
    setConversations((data as Conversation[]) || []);
    setLoadingConversations(false);
  }

  async function loadMessages(convId: string) {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setLoadingMessages(false);
    setTimeout(scrollToBottom, 100);

    // Mark as read
    await supabase
      .from("conversations")
      .update({ unread_count: 0 })
      .eq("id", convId);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function selectConversation(convId: string) {
    setSelectedConvId(convId);
    loadMessages(convId);
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedConvId || !company?.id) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send-message", {
        body: {
          conversationId: selectedConvId,
          content: newMessage.trim(),
          companyId: company.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNewMessage("");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function updateConversationStatus(convId: string, newStatus: string) {
    const { error } = await supabase
      .from("conversations")
      .update({ status: newStatus })
      .eq("id", convId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }

  async function toggleUnread(convId: string) {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const newCount = conv.unread_count > 0 ? 0 : 1;
    await supabase.from("conversations").update({ unread_count: newCount }).eq("id", convId);
  }

  const filteredConversations = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery && !c.phone_number.includes(searchQuery)) return false;
    return true;
  });

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  if (!company) return null;

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Atendimento WhatsApp</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas conversas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left panel: conversations list */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {[
                  { key: "all", label: "Todas" },
                  { key: "aguardando_paciente", label: "Aguardando" },
                  { key: "em_atendimento", label: "Atendendo" },
                  { key: "finalizado", label: "Finalizadas" },
                ].map((f) => (
                  <Button
                    key={f.key}
                    variant={statusFilter === f.key ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setStatusFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loadingConversations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Nenhuma conversa encontrada
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const st = statusLabels[conv.status] || statusLabels.aguardando_paciente;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                          selectedConvId === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{conv.phone_number}</p>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-0.5 ${st.color}`}>
                                {st.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-muted-foreground">
                              {conv.last_message_at
                                ? new Date(conv.last_message_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                                : ""}
                            </p>
                            {conv.unread_count > 0 && (
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold mt-1">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Right panel: chat */}
          <Card className="flex flex-col overflow-hidden">
            {!selectedConvId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione uma conversa para iniciar</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedConv?.phone_number}</p>
                      {selectedConv && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusLabels[selectedConv.status]?.color || ""}`}>
                          {statusLabels[selectedConv.status]?.label || selectedConv.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => selectedConv && updateConversationStatus(selectedConv.id, "em_atendimento")}
                    >
                      <CircleDot className="h-3 w-3 mr-1 text-green-600" /> Atender
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => selectedConv && updateConversationStatus(selectedConv.id, "aguardando_paciente")}
                    >
                      <Clock className="h-3 w-3 mr-1 text-yellow-600" /> Aguardar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => selectedConv && updateConversationStatus(selectedConv.id, "finalizado")}
                    >
                      <Check className="h-3 w-3 mr-1" /> Finalizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => selectedConv && toggleUnread(selectedConv.id)}
                      title="Marcar como não lida"
                    >
                      {selectedConv && selectedConv.unread_count > 0 ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Messages area */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma mensagem ainda
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg) => {
                        const isOutbound = msg.direction === "outbound";
                        return (
                          <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                                isOutbound
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isOutbound ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                <span className="text-[10px]">
                                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isOutbound && (
                                  msg.status === "read" ? (
                                    <CheckCheck className="h-3 w-3 text-blue-300" />
                                  ) : msg.status === "delivered" ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message input */}
                <div className="p-3 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
