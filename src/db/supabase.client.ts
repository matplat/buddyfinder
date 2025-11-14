import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/client";

import type { Database } from "./database.types";

export const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
