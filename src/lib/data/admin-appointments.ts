import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Appointment } from "@/types/database";

export type AdminAppointmentRow = Appointment & {
  services: { name: string } | null;
  customers: { full_name: string; phone: string | null; email: string | null } | null;
  appointment_addons: { name_snapshot: string; price: number }[];
};

export async function getAdminAppointments(): Promise<AdminAppointmentRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, services(name), customers(full_name, phone, email), appointment_addons(name_snapshot, price)")
    .order("start_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AdminAppointmentRow[];
}
