import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WorkingHours, WorkingHoursBreak } from "@/types/database";

export async function getWorkingHours(): Promise<WorkingHours[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("working_hours").select("*").order("day_of_week", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getWorkingHoursBreaks(): Promise<WorkingHoursBreak[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("working_hours_breaks")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
