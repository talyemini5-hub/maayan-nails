import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Service } from "@/types/database";

export async function getActiveTreatments(): Promise<Service[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("kind", "treatment")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getActiveAddonsFor(serviceId: string): Promise<Service[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("service_addons")
    .select("addon_id, services!service_addons_addon_id_fkey(*)")
    .eq("service_id", serviceId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => (row as unknown as { services: Service }).services)
    .filter((s) => s && s.is_active);
}

export async function getAllActiveServices(): Promise<Service[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("kind", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}
