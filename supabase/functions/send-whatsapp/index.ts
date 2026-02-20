import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

interface SendRequest {
  phone: string;
  messageType: "confirmacao" | "lembrete";
  variables: Record<string, string>;
  appointmentId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      console.warn("[WhatsApp] Evolution API credentials not configured, skipping.");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "credentials_not_configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reject localhost/127.0.0.1 URLs — they are not reachable from the cloud
    const isLocalUrl = /https?:\/\/(localhost|127\.0\.0\.1)/i.test(EVOLUTION_API_URL);
    if (isLocalUrl) {
      console.warn("[WhatsApp] EVOLUTION_API_URL is a local address and cannot be reached from the cloud. Skipping.");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "local_url_not_reachable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone, messageType, variables, appointmentId } =
      (await req.json()) as SendRequest;

    if (!phone || !messageType || !variables) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone, messageType, variables" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhone(phone);

    let text = "";
    if (messageType === "confirmacao") {
      text = `Olá ${variables.name || ""}, seu agendamento está confirmado para ${variables.date || ""} às ${variables.time || ""}. Aguardamos você!`;
    } else if (messageType === "lembrete") {
      text = `Olá ${variables.name || ""}, passando para lembrar que seu horário é hoje às ${variables.time || ""}. Até breve!`;
    }

    console.log(`[WhatsApp] Sending ${messageType} to ${formattedPhone}`);

    const evolutionUrl = `${EVOLUTION_API_URL.replace(/\/$/, "")}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

    const response = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text,
      }),
    });

    const responseData = await response.text();
    const success = response.ok;

    console.log(`[WhatsApp] Response status: ${response.status}, body: ${responseData}`);

    // Log to whatsapp_logs using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("whatsapp_logs").insert({
      phone: formattedPhone,
      message_type: messageType,
      status: success ? "sent" : "failed",
      error_message: success ? null : responseData,
      appointment_id: appointmentId || null,
    });

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: responseData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, phone: formattedPhone }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WhatsApp] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
