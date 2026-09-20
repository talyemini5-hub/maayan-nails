import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Appointment } from "@/types/database";

export type AppointmentWithDetails = Appointment & {
  services: { name: string } | null;
  appointment_addons: { name_snapshot: string; price: number }[];
};

export async function getMyCustomerId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("customers").select("id").eq("profile_id", user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getCustomerAppointments(customerId: string): Promise<AppointmentWithDetails[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, services(name), appointment_addons(name_snapshot, price)")
    .eq("customer_id", customerId)
    .order("start_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AppointmentWithDetails[];
}
