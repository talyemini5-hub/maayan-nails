import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Service } from "@/types/database";

export async function getAllServicesForAdmin(): Promise<Service[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("kind", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Maps every treatment's service_id to its linked addon ids, in one query. */
export async function getAddonLinksByTreatment(): Promise<Record<string, string[]>> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("service_addons").select("service_id, addon_id");
  if (error) throw error;
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (map[row.service_id] ??= []).push(row.addon_id);
  }
  return map;
}
