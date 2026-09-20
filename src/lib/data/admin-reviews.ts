import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Review } from "@/types/database";

export async function getAllReviewsForAdmin(): Promise<Review[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
