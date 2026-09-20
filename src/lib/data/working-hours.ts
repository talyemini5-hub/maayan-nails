import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WorkingHours } from "@/types/database";

export async function getWorkingHours(): Promise<WorkingHours[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("working_hours").select("*").order("day_of_week", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
