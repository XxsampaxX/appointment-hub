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

  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
  const ENCRYPTION_KEY = Deno.env.get("WHATSAPP_ENCRYPTION_KEY");

  // GET = webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[Webhook] Verification successful");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // POST = incoming webhook events
  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const entries = body?.entry || [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        // Handle message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            const metaMessageId = status.id;
            const newStatus = status.status; // sent, delivered, read

            if (["delivered", "read"].includes(newStatus)) {
              await supabase
                .from("messages")
                .update({ status: newStatus })
                .eq("meta_message_id", metaMessageId);
            }
          }
          continue;
        }

        // Handle incoming messages
        const messages = value.messages || [];
        const metadata = value.metadata;
        const phoneNumberId = metadata?.phone_number_id;

        if (!phoneNumberId || messages.length === 0) continue;

        // Find company by phone_number_id
        const { data: waConfig } = await supabase
          .from("company_whatsapp")
          .select("company_id, access_token_encrypted")
          .eq("phone_number_id", phoneNumberId)
          .eq("status", "connected")
          .maybeSingle();

        if (!waConfig) {
          console.warn(`[Webhook] No company found for phone ${phoneNumberId}`);
          continue;
        }

        const companyId = waConfig.company_id;

        for (const msg of messages) {
          const senderPhone = msg.from;
          const messageText = msg.text?.body || msg.caption || "[mídia]";
          const messageType = msg.type || "text";
          const metaMessageId = msg.id;

          // Find or create conversation
          let { data: conversation } = await supabase
            .from("conversations")
            .select("id, unread_count, status")
            .eq("company_id", companyId)
            .eq("phone_number", senderPhone)
            .maybeSingle();

          const isNewConversation = !conversation;

          if (!conversation) {
            // Try to match client by phone
            const { data: client } = await supabase
              .from("clients")
              .select("id")
              .eq("company_id", companyId)
              .eq("phone", senderPhone)
              .maybeSingle();

            const { data: newConv, error: convErr } = await supabase
              .from("conversations")
              .insert({
                company_id: companyId,
                client_id: client?.id || null,
                phone_number: senderPhone,
                status: "aguardando_paciente",
                unread_count: 1,
                last_message_at: new Date().toISOString(),
              })
              .select("id, unread_count, status")
              .single();

            if (convErr) {
              console.error("[Webhook] Error creating conversation:", convErr);
              continue;
            }
            conversation = newConv;
          } else {
            // Update existing conversation
            await supabase
              .from("conversations")
              .update({
                unread_count: (conversation.unread_count || 0) + 1,
                last_message_at: new Date().toISOString(),
                status: conversation.status === "finalizado" ? "aguardando_paciente" : conversation.status,
              })
              .eq("id", conversation.id);
          }

          // Insert the inbound message
          await supabase.from("messages").insert({
            company_id: companyId,
            conversation_id: conversation!.id,
            direction: "inbound",
            content: messageText,
            message_type: messageType,
            meta_message_id: metaMessageId,
            status: "delivered",
          });

          // Auto-replies logic
          if (ENCRYPTION_KEY && waConfig.access_token_encrypted) {
            await handleAutoReplies(
              supabase,
              companyId,
              conversation!.id,
              senderPhone,
              phoneNumberId,
              waConfig.access_token_encrypted,
              ENCRYPTION_KEY,
              isNewConversation
            );
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAutoReplies(
  supabase: any,
  companyId: string,
  conversationId: string,
  recipientPhone: string,
  phoneNumberId: string,
  encryptedToken: string,
  encryptionKey: string,
  isNewConversation: boolean
) {
  try {
    const { data: autoReply } = await supabase
      .from("whatsapp_auto_replies")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (!autoReply) return;

    let replyText: string | null = null;

    // Welcome message - only for new conversations
    if (isNewConversation && autoReply.is_welcome_enabled && autoReply.welcome_message) {
      replyText = autoReply.welcome_message;
    }

    // After hours message
    if (!replyText && autoReply.is_after_hours_enabled && autoReply.after_hours_message) {
      const now = new Date();
      const currentTime = `${now.getUTCHours().toString().padStart(2, "0")}:${now.getUTCMinutes().toString().padStart(2, "0")}`;
      // Adjust to BRT (-3) roughly
      const brtHour = (now.getUTCHours() - 3 + 24) % 24;
      const brtTime = `${brtHour.toString().padStart(2, "0")}:${now.getUTCMinutes().toString().padStart(2, "0")}`;

      const start = autoReply.business_hours_start?.slice(0, 5) || "09:00";
      const end = autoReply.business_hours_end?.slice(0, 5) || "18:00";

      if (brtTime < start || brtTime >= end) {
        replyText = autoReply.after_hours_message;
      }
    }

    if (!replyText) return;

    // Send auto-reply via Cloud API
    const token = await decryptToken(encryptedToken, encryptionKey);

    const sendRes = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "text",
          text: { body: replyText },
        }),
      }
    );

    const sendData = await sendRes.json();

    // Save auto-reply as outbound message
    await supabase.from("messages").insert({
      company_id: companyId,
      conversation_id: conversationId,
      direction: "outbound",
      content: replyText,
      message_type: "text",
      meta_message_id: sendData?.messages?.[0]?.id || null,
      status: sendRes.ok ? "sent" : "failed",
    });

    console.log(`[Webhook] Auto-reply sent to ${recipientPhone}`);
  } catch (err) {
    console.error("[Webhook] Auto-reply error:", err);
  }
}
