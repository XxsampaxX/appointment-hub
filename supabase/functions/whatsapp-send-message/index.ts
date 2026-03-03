import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AES-256-GCM decryption
async function decryptToken(encryptedB64: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ENCRYPTION_KEY = Deno.env.get("WHATSAPP_ENCRYPTION_KEY");
    if (!ENCRYPTION_KEY) {
      return new Response(
        JSON.stringify({ error: "Encryption key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversationId, content, companyId } = await req.json();

    if (!conversationId || !content || !companyId) {
      return new Response(
        JSON.stringify({ error: "Missing conversationId, content, or companyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is staff
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isStaff } = await adminClient.rpc("is_company_staff", {
      _company_id: companyId,
      _user_id: claims.claims.sub,
    });

    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get conversation
    const { data: conversation } = await adminClient
      .from("conversations")
      .select("phone_number")
      .eq("id", conversationId)
      .eq("company_id", companyId)
      .single();

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get WhatsApp config
    const { data: waConfig } = await adminClient
      .from("company_whatsapp")
      .select("phone_number_id, access_token_encrypted, status")
      .eq("company_id", companyId)
      .single();

    if (!waConfig || waConfig.status !== "connected") {
      return new Response(
        JSON.stringify({ error: "WhatsApp not connected for this company" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt token
    const accessToken = await decryptToken(waConfig.access_token_encrypted, ENCRYPTION_KEY);

    // Send via Cloud API
    const sendRes = await fetch(
      `https://graph.facebook.com/v21.0/${waConfig.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: conversation.phone_number,
          type: "text",
          text: { body: content },
        }),
      }
    );

    const sendData = await sendRes.json();

    if (!sendRes.ok) {
      console.error("[SendMessage] Cloud API error:", sendData);
      // Save failed message
      await adminClient.from("messages").insert({
        company_id: companyId,
        conversation_id: conversationId,
        direction: "outbound",
        content,
        message_type: "text",
        status: "failed",
      });
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: sendData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save sent message
    const metaMessageId = sendData?.messages?.[0]?.id || null;

    await adminClient.from("messages").insert({
      company_id: companyId,
      conversation_id: conversationId,
      direction: "outbound",
      content,
      message_type: "text",
      meta_message_id: metaMessageId,
      status: "sent",
    });

    // Update conversation
    await adminClient
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return new Response(
      JSON.stringify({ success: true, metaMessageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SendMessage] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
