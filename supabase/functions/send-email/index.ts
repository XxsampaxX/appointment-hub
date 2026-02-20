const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  nome: string;
  servico: string;
  data: string;
  hora: string;
  nomeEmpresa: string;
  appointmentId?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildHtmlTemplate(params: {
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
  <title>Agendamento Confirmado</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Agendya</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">Agendamento Confirmado ✅</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Olá, <strong>${nome}</strong>! Seu agendamento foi confirmado com sucesso.
              </p>

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9ff;border:1px solid #e0e7ff;border-radius:10px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Empresa</span>
                          <span style="font-size:16px;font-weight:600;color:#111827;">${nomeEmpresa}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Serviço</span>
                          <span style="font-size:16px;font-weight:600;color:#111827;">${servico}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Data</span>
                          <span style="font-size:16px;font-weight:600;color:#111827;">${data}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Horário</span>
                          <span style="font-size:16px;font-weight:600;color:#111827;">${hora}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
                Aguardamos você! Caso precise remarcar ou cancelar, entre em contato com a empresa com antecedência.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://agendago.lovable.app" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Acessar Agendya
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Enviado por <strong style="color:#6366f1;">Agendya</strong> · Sistema de Agendamentos Online
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#d1d5db;">
                Este é um e-mail automático, por favor não responda.
              </p>
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

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const body = (await req.json()) as EmailRequest;
    const { to, nome, servico, data, hora, nomeEmpresa, appointmentId } = body;

    // Validate required fields
    if (!to || !nome || !servico || !data || !hora || !nomeEmpresa) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, nome, servico, data, hora, nomeEmpresa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = buildHtmlTemplate({ nome, servico, data, hora, nomeEmpresa });

    console.log(`[Email] Sending confirmation to ${to} for appointment ${appointmentId ?? "N/A"}`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Agendya <onboarding@resend.dev>",
        to: [to.trim()],
        subject: `Agendamento Confirmado ✅ - ${nomeEmpresa}`,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(`[Email] Resend error: ${JSON.stringify(resendData)}`);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Email] Sent successfully. ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
