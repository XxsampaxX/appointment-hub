import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AES-256-GCM encryption
async function encryptToken(token: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(token);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    const ENCRYPTION_KEY = Deno.env.get("WHATSAPP_ENCRYPTION_KEY");

    if (!META_APP_ID || !META_APP_SECRET || !ENCRYPTION_KEY) {
      return new Response(
        JSON.stringify({ error: "Meta credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code, companyId } = await req.json();

    if (!code || !companyId) {
      return new Response(
        JSON.stringify({ error: "Missing code or companyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate JWT - ensure user is admin of this company
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

    // Verify user is admin of this company
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await adminClient.rpc("is_company_admin", {
      _company_id: companyId,
      _user_id: claims.claims.sub,
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Not company admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("[OAuth] Token exchange failed:", tokenData);
      return new Response(
        JSON.stringify({ error: "Token exchange failed", details: tokenData.error?.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Get WABA (WhatsApp Business Account) info
    // First get shared WABAs from the embedded signup
    const debugRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}`,
      { headers: { Authorization: `Bearer ${META_APP_ID}|${META_APP_SECRET}` } }
    );
    const debugData = await debugRes.json();

    // Get business ID from token scopes
    const granularScopes = debugData?.data?.granular_scopes || [];
    const whatsappScope = granularScopes.find(
      (s: any) => s.scope === "whatsapp_business_management"
    );
    const wabaIds = whatsappScope?.target_ids || [];

    if (wabaIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No WhatsApp Business Account found in permissions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wabaId = wabaIds[0];

    // 3. Get phone numbers from WABA
    const phonesRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const phonesData = await phonesRes.json();

    if (!phonesData.data || phonesData.data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No phone numbers found in WhatsApp Business Account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phone = phonesData.data[0];
    const phoneNumberId = phone.id;
    const displayPhone = phone.display_phone_number;

    // 4. Check if this phone is already used by another company
    const { data: existing } = await adminClient
      .from("company_whatsapp")
      .select("company_id")
      .eq("phone_number_id", phoneNumberId)
      .neq("company_id", companyId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "This phone number is already connected to another company" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Get business info
    const businessRes = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}?fields=owner_business_info`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const businessData = await businessRes.json();
    const metaBusinessId = businessData?.owner_business_info?.id || "";

    // 6. Encrypt the access token
    const encryptedToken = await encryptToken(accessToken, ENCRYPTION_KEY);

    // 7. Upsert company_whatsapp record
    const { error: upsertError } = await adminClient
      .from("company_whatsapp")
      .upsert(
        {
          company_id: companyId,
          meta_business_id: metaBusinessId,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          display_phone: displayPhone,
          access_token_encrypted: encryptedToken,
          token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          status: "connected",
        },
        { onConflict: "company_id" }
      );

    if (upsertError) {
      console.error("[OAuth] Upsert error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save WhatsApp configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Subscribe to webhooks for this WABA
    await fetch(`https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log(`[OAuth] Company ${companyId} connected to WhatsApp: ${displayPhone}`);

    return new Response(
      JSON.stringify({
        success: true,
        phone: displayPhone,
        wabaId,
        phoneNumberId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[OAuth] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
