import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GalleryItem } from "@/types/database";

export async function getAllGalleryForAdmin(): Promise<GalleryItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
