import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
  companyId?: string;
  profissional?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isCustomDomain(fromEmail: string): boolean {
  return !fromEmail.includes("@resend.dev") && !fromEmail.includes("@onboarding.resend.dev");
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
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Agendya</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">Agendamento Confirmado ✅</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Olá, <strong>${nome}</strong>! Seu agendamento foi confirmado com sucesso.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9ff;border:1px solid #e0e7ff;border-radius:10px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Empresa</span><span style="font-size:16px;font-weight:600;color:#111827;">${nomeEmpresa}</span></td></tr>
                      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Serviço</span><span style="font-size:16px;font-weight:600;color:#111827;">${servico}</span></td></tr>
                      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Data</span><span style="font-size:16px;font-weight:600;color:#111827;">${data}</span></td></tr>
                      <tr><td style="padding:10px 0;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Horário</span><span style="font-size:16px;font-weight:600;color:#111827;">${hora}</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.6;">
                Aguardamos você! Caso precise remarcar ou cancelar, entre em contato com a empresa com antecedência.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://agendya.app" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Acessar Agendya
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Enviado por <strong style="color:#6366f1;">Agendya</strong> · Sistema de Agendamentos Online
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

function buildOwnerHtmlTemplate(params: {
  clienteNome: string;
  servico: string;
  data: string;
  hora: string;
  nomeEmpresa: string;
  profissional?: string;
}): string {
  const { clienteNome, servico, data, hora, nomeEmpresa, profissional } = params;
  const profRow = profissional
    ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Profissional</span><span style="font-size:16px;font-weight:600;color:#111827;">${profissional}</span></td></tr>`
    : "";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo Agendamento</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Agendya</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">Novo Agendamento 📅</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Um novo agendamento foi realizado na <strong>${nomeEmpresa}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Cliente</span><span style="font-size:16px;font-weight:600;color:#111827;">${clienteNome}</span></td></tr>
                      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Serviço</span><span style="font-size:16px;font-weight:600;color:#111827;">${servico}</span></td></tr>
                      ${profRow}
                      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Data</span><span style="font-size:16px;font-weight:600;color:#111827;">${data}</span></td></tr>
                      <tr><td style="padding:10px 0;"><span style="font-size:13px;color:#6b7280;display:block;margin-bottom:2px;">Horário</span><span style="font-size:16px;font-weight:600;color:#111827;">${hora}</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="https://agendya.app" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;">
                      Ver na Agendya
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">
                Enviado por <strong style="color:#059669;">Agendya</strong> · Sistema de Agendamentos Online
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

async function sendEmail(params: {
  resendApiKey: string;
  fromAddress: string;
  to: string;
  subject: string;
  html: string;
  appointmentId?: string;
}): Promise<{ ok: boolean; data?: unknown; error?: unknown }> {
  const { resendApiKey, fromAddress, to, subject, html, appointmentId } = params;

  console.log(`[Email] Sending to: ${to} | from: ${fromAddress} | appointmentId: ${appointmentId ?? "N/A"}`);

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromAddress, to: [to.trim()], subject, html }),
  });

  const resendData = await resendResponse.json();

  if (!resendResponse.ok) {
    console.error(`[Email] Resend API error (${resendResponse.status}):`, JSON.stringify(resendData));
    return { ok: false, error: resendData };
  }

  console.log(`[Email] Sent successfully. Resend ID: ${resendData.id}`);
  return { ok: true, data: resendData };
}

async function getCompanyOwnerEmail(companyId: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return null;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: company } = await supabase
      .from("companies")
      .select("created_by")
      .eq("id", companyId)
      .single();

    if (!company?.created_by) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", company.created_by)
      .single();

    return profile?.email || null;
  } catch (err) {
    console.error("[Email] Error fetching owner email:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ─── Diagnostic endpoint: GET /send-email/teste ───────────────────────────
  if (req.method === "GET" && url.pathname.endsWith("/teste")) {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_ADDRESS = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "Agendya <confirmacao@agendya.app>";
    const TEST_TO = Deno.env.get("EMAIL_TEST_TO") ?? "felipe18935@gmail.com";

    const apiKeyLoaded = !!RESEND_API_KEY;
    const usingCustomDomain = isCustomDomain(FROM_ADDRESS);

    console.log(`[Email/Teste] RESEND_API_KEY loaded: ${apiKeyLoaded}`);
    console.log(`[Email/Teste] FROM_ADDRESS: ${FROM_ADDRESS}`);
    console.log(`[Email/Teste] Using custom domain: ${usingCustomDomain}`);
    console.log(`[Email/Teste] Sending test email to: ${TEST_TO}`);

    if (!apiKeyLoaded) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = buildHtmlTemplate({
      nome: "Usuário de Teste",
      servico: "Serviço de Teste",
      data: "20 de fevereiro de 2026",
      hora: "14:00",
      nomeEmpresa: "Empresa Teste",
    });

    const result = await sendEmail({
      resendApiKey: RESEND_API_KEY,
      fromAddress: FROM_ADDRESS,
      to: TEST_TO,
      subject: "✅ Teste de E-mail - Agendya",
      html,
    });

    return new Response(
      JSON.stringify({
        ok: result.ok,
        diagnostics: {
          apiKeyLoaded,
          fromAddress: FROM_ADDRESS,
          usingCustomDomain,
          sentTo: TEST_TO,
          note: usingCustomDomain
            ? "Usando domínio customizado — pode enviar para qualquer destinatário."
            : "⚠️ Usando domínio de teste (onboarding@resend.dev). Apenas 'felipe18935@gmail.com' pode receber. Configure EMAIL_FROM_ADDRESS com domínio verificado.",
        },
        resendResponse: result.ok ? result.data : result.error,
      }),
      { status: result.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ─── Main send endpoint: POST /send-email ─────────────────────────────────
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_ADDRESS = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "Agendya <confirmacao@agendya.app>";

    console.log(`[Email] RESEND_API_KEY loaded: ${!!RESEND_API_KEY}`);
    console.log(`[Email] FROM_ADDRESS: ${FROM_ADDRESS}`);

    if (!RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as EmailRequest;
    const { to, nome, servico, data, hora, nomeEmpresa, appointmentId, companyId, profissional } = body;

    if (!to || !nome || !servico || !data || !hora || !nomeEmpresa) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, nome, servico, data, hora, nomeEmpresa" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isCustomDomain(FROM_ADDRESS)) {
      console.warn(
        `[Email] Using test domain '${FROM_ADDRESS}'. Resend only allows sending to the account owner email. ` +
        "Configure the EMAIL_FROM_ADDRESS secret with a verified domain to enable sending to clients."
      );
      return new Response(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: "test_domain_restriction",
          message:
            "E-mail não enviado: o remetente usa domínio de teste (onboarding@resend.dev) que só permite envio ao dono da conta Resend. Configure o secret EMAIL_FROM_ADDRESS com um e-mail de domínio verificado.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1) Send confirmation email to the client
    const clientHtml = buildHtmlTemplate({ nome, servico, data, hora, nomeEmpresa });
    const clientResult = await sendEmail({
      resendApiKey: RESEND_API_KEY,
      fromAddress: FROM_ADDRESS,
      to,
      subject: `Agendamento Confirmado ✅ - ${nomeEmpresa}`,
      html: clientHtml,
      appointmentId,
    });

    // 2) Send notification email to the company owner
    let ownerEmailSent = false;
    if (companyId) {
      const ownerEmail = await getCompanyOwnerEmail(companyId);
      if (ownerEmail && isValidEmail(ownerEmail) && ownerEmail.trim().toLowerCase() !== to.trim().toLowerCase()) {
        const ownerHtml = buildOwnerHtmlTemplate({
          clienteNome: nome,
          servico,
          data,
          hora,
          nomeEmpresa,
          profissional,
        });
        const ownerResult = await sendEmail({
          resendApiKey: RESEND_API_KEY,
          fromAddress: FROM_ADDRESS,
          to: ownerEmail,
          subject: `Novo Agendamento 📅 - ${nome} | ${nomeEmpresa}`,
          html: ownerHtml,
          appointmentId,
        });
        ownerEmailSent = ownerResult.ok;
        if (!ownerResult.ok) {
          console.warn("[Email] Failed to send owner notification:", ownerResult.error);
        }
      } else {
        console.log(`[Email] Owner email skipped (not found, invalid, or same as client)`);
      }
    }

    if (!clientResult.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: clientResult.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: (clientResult.data as { id: string }).id,
        ownerNotified: ownerEmailSent,
      }),
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
