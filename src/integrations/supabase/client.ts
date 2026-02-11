import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://enbbzlkfzlwyceajahwx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_V6l4SFwut7pimzSoE82AIw_GhernG9q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
