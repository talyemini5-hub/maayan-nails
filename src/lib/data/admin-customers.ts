import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Customer } from "@/types/database";

export async function getAllCustomersForAdmin(): Promise<Customer[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
