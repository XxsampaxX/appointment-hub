import { supabase } from "@/integrations/supabase/client";

export interface ConfirmacaoAgendamentoParams {
  nome: string;
  email: string;
  servico: string;
  data: string;
  hora: string;
  nomeEmpresa: string;
  appointmentId?: string;
  companyId?: string;
  profissional?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Envia e-mail de confirmação de agendamento via backend seguro (Edge Function).
 * A RESEND_API_KEY nunca é exposta no frontend.
 *
 * @returns `{ success: true }` se enviado, `{ success: false, error }` se falhou.
 */
export async function enviarConfirmacaoAgendamento(
  params: ConfirmacaoAgendamentoParams
): Promise<{ success: boolean; error?: string }> {
  const { nome, email, servico, data, hora, nomeEmpresa, appointmentId, companyId, profissional } = params;

  // Validação client-side antes de chamar o backend
  if (!email || !isValidEmail(email)) {
    console.warn("[Email] E-mail inválido ou ausente, envio ignorado:", email);
    return { success: false, error: "E-mail inválido" };
  }

  if (!nome || !servico || !data || !hora || !nomeEmpresa) {
    console.warn("[Email] Parâmetros obrigatórios ausentes, envio ignorado");
    return { success: false, error: "Parâmetros obrigatórios ausentes" };
  }

  // Formata data para pt-BR
  const dataFormatada = (() => {
    try {
      return new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return data;
    }
  })();

  try {
    const { data: responseData, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email.trim(),
        nome,
        servico,
        data: dataFormatada,
        hora,
        nomeEmpresa,
        appointmentId,
        companyId,
        profissional,
      },
    });

    if (error) {
      console.error("[Email] Erro ao invocar edge function:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Confirmação enviada com sucesso:", responseData);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Email] Falha inesperada:", message);
    return { success: false, error: message };
  }
}
