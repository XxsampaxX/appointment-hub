import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildReminderHtml(params: {
  nome: string;
  servico: string;
  data: string;
  hora: string;
  nomeEmpresa: string;
}): string {
  const { nome, servico, data, hora, nomeEmpresa } = params;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lembrete de Agendamento</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.85);letter-spacing:2px;text-transform:uppercase;">Agendya</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">⏰ Lembrete de Agendamento</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Olá, <strong>${nome}</strong>! Seu agendamento está chegando. Confira os detalhes:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:10px 0;border-bottom:1px solid #fde68a;"><span style="font-size:13px;color:#92400e;display:block;margin-bottom:2px;">Empresa</span><span style="font-size:16px;font-weight:600;color:#111827;">${nomeEmpresa}</span></td></tr>
                      <tr><td style="padding:10px 0;border-bottom:1px solid #fde68a;"><span style="font-size:13px;color:#92400e;display:block;margin-bottom:2px;">Serviço</span><span style="font-size:16px;font-weight:600;color:#111827;">${servico}</span></td></tr>
                      <tr><td style="padding:10px 0;border-bottom:1px solid #fde68a;"><span style="font-size:13px;color:#92400e;display:block;margin-bottom:2px;">Data</span><span style="font-size:16px;font-weight:600;color:#111827;">${data}</span></td></tr>
                      <tr><td style="padding:10px 0;"><span style="font-size:13px;color:#92400e;display:block;margin-bottom:2px;">Horário</span><span style="font-size:20px;font-weight:700;color:#d97706;">${hora}</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
                Lembre-se de chegar com alguns minutos de antecedência. Caso precise remarcar ou cancelar, entre em contato com a empresa.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://agendya.app" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Ver meu agendamento
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Enviado por <strong style="color:#d97706;">Agendya</strong> · Sistema de Agendamentos Online
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#d1d5db;">Este é um e-mail automático, por favor não responda.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_ADDRESS = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "Agendya <confirmacao@agendya.app>";

  if (!RESEND_API_KEY) {
    console.error("[EmailReminders] RESEND_API_KEY não configurada");
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000); // +55min
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);   // +65min

    // Format as HH:MM for time comparison
    const formatTime = (d: Date) =>
      `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const startDate = formatDate(windowStart);
    const endDate = formatDate(windowEnd);
    const startTime = formatTime(windowStart);
    const endTime = formatTime(windowEnd);

    console.log(`[EmailReminders] Janela de busca: ${startDate} ${startTime} → ${endDate} ${endTime}`);

    // Query appointments in the 55–65 minute window that haven't been reminded yet
    const { data: candidates, error: queryError } = await supabase
      .from("appointments")
      .select(`
        id,
        date,
        time,
        client_name,
        client_phone,
        user_id,
        client_id,
        company_id,
        service_id,
        email_reminder_sent,
        status
      `)
      .eq("email_reminder_sent", false)
      .in("status", ["agendado", "confirmado"])
      .gte("date", startDate)
      .lte("date", endDate);

    if (queryError) {
      console.error("[EmailReminders] Erro ao buscar agendamentos:", queryError);
      return new Response(
        JSON.stringify({ error: queryError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[EmailReminders] ${candidates?.length ?? 0} candidatos encontrados`);

    const sent: string[] = [];
    const skipped: string[] = [];

    for (const appt of candidates ?? []) {
      // Filter by time window (HH:MM comparison)
      const apptTime = appt.time.substring(0, 5); // "HH:MM"
      const apptDate = appt.date;

      const inWindow =
        apptDate === startDate && apptDate === endDate
          ? apptTime >= startTime && apptTime <= endTime
          : apptDate === startDate
          ? apptTime >= startTime
          : apptDate === endDate
          ? apptTime <= endTime
          : false;

      if (!inWindow) {
        skipped.push(appt.id);
        continue;
      }

      // Get client email (from profiles if user_id exists, otherwise from clients table)
      let clientEmail: string | null = null;
      let clientName = appt.client_name || "Cliente";

      if (appt.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", appt.user_id)
          .maybeSingle();
        if (profile?.email) {
          clientEmail = profile.email;
          clientName = profile.name || clientName;
        }
      }

      if (!clientEmail && appt.client_id) {
        const { data: client } = await supabase
          .from("clients")
          .select("email, name")
          .eq("id", appt.client_id)
          .maybeSingle();
        if (client?.email) {
          clientEmail = client.email;
          clientName = client.name || clientName;
        }
      }

      if (!clientEmail || !clientEmail.includes("@")) {
        console.warn(`[EmailReminders] Agendamento ${appt.id}: e-mail não encontrado, pulando`);
        skipped.push(appt.id);
        continue;
      }

      // Get service name
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", appt.service_id)
        .maybeSingle();
      const serviceName = service?.name || "Serviço";

      // Get company name
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", appt.company_id)
        .maybeSingle();
      const companyName = company?.name || "Empresa";

      // Format date to pt-BR
      const dataFormatada = new Date(appt.date + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const html = buildReminderHtml({
        nome: clientName,
        servico: serviceName,
        data: dataFormatada,
        hora: apptTime,
        nomeEmpresa: companyName,
      });

      // Send via Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [clientEmail],
          subject: `⏰ Lembrete: seu agendamento é em 1 hora — ${companyName}`,
          html,
        }),
      });

      const resendData = await resendRes.json();

      if (!resendRes.ok) {
        console.error(`[EmailReminders] Falha ao enviar e-mail para ${appt.id}:`, JSON.stringify(resendData));
        skipped.push(appt.id);
        continue;
      }

      console.log(`[EmailReminders] E-mail enviado para agendamento ${appt.id} → ${clientEmail} (Resend ID: ${resendData.id})`);

      // Mark as reminded
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ email_reminder_sent: true })
        .eq("id", appt.id);

      if (updateError) {
        console.error(`[EmailReminders] Erro ao marcar ${appt.id} como enviado:`, updateError);
      } else {
        sent.push(appt.id);
      }
    }

    console.log(`[EmailReminders] Concluído. Enviados: ${sent.length} | Pulados: ${skipped.length}`);

    return new Response(
      JSON.stringify({ success: true, reminders_sent: sent.length, skipped: skipped.length, sent_ids: sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[EmailReminders] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
