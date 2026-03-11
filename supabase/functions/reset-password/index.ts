import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function buildResetHtml(params: { resetUrl: string }): string {
  const { resetUrl } = params;
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir Senha</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Agendya</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">Redefinir Senha 🔑</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 40px;border-radius:8px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin:0 0 32px;font-size:13px;color:#6366f1;word-break:break-all;">
                <a href="${resetUrl}" style="color:#6366f1;">${resetUrl}</a>
              </p>
              <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.6;">
                Este link expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este e-mail.
              </p>
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

function buildResetUrl(params: { publicUrl: string; actionLink: string; hashedToken?: string | null }): string {
  const { publicUrl, actionLink, hashedToken } = params;

  if (hashedToken) {
    return `${publicUrl}/reset-password?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;
  }

  try {
    const linkUrl = new URL(actionLink);
    const tokenHash = linkUrl.searchParams.get("token_hash") ?? linkUrl.searchParams.get("token");

    if (!tokenHash) {
      return `${publicUrl}/reset-password`;
    }

    return `${publicUrl}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
  } catch (_) {
    return `${publicUrl}/reset-password`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const FROM_ADDRESS = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "Agendya <confirmacao@agendya.app>";
    const PUBLIC_URL = "https://agendago.lovable.app";

    if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("[ResetPassword] Missing required secrets");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = await req.json();

    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "E-mail inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use admin API to generate a password reset link
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email.trim(),
      options: {
        redirectTo: `${PUBLIC_URL}/reset-password`,
      },
    });

    if (error) {
      console.error("[ResetPassword] generateLink error:", error.message);
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail estiver cadastrado, você receberá um link." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build URL with hashed token to avoid auth redirect allowlist issues
    const actionLink = data?.properties?.action_link;
    const hashedToken = data?.properties?.hashed_token;

    if (!actionLink) {
      console.error("[ResetPassword] No action_link returned");
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail estiver cadastrado, você receberá um link." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetUrl = buildResetUrl({ publicUrl: PUBLIC_URL, actionLink, hashedToken });

    // Send the email via Resend
    const html = buildResetHtml({ resetUrl });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email.trim()],
        subject: "Redefinir senha - Agendya 🔑",
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[ResetPassword] Resend error:", JSON.stringify(resendData));
      return new Response(
        JSON.stringify({ success: false, error: "Falha ao enviar e-mail" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ResetPassword] Email sent to ${email}, Resend ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Se o e-mail estiver cadastrado, você receberá um link." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ResetPassword] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
