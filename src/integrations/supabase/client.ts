import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://enbbzlkfzlwyceajahwx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuYmJ6bGtmemx3eWNlYWphaHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NzA1NzksImV4cCI6MjA4NjI0NjU3OX0.b_m_jSaoHg3VkSDbuzyW_eib4idp-ouI8ZOU11j_KuY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
