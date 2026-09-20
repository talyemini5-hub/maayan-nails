import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  whatsapp_intl: string;
  instagram_url: string;
  timezone: string;
  logo_url: string | null;
}

export interface AvailabilitySettings {
  slot_interval_minutes: number;
  booking_horizon_days: number;
  short_notice_hours: number;
  hold_duration_minutes: number;
}

export interface PolicySettings {
  reschedule_cutoff_hours: number;
  warranty_text: string;
  nail_art_policy_text: string;
  cancellation_policy_text: string;
}

export interface AboutSettings {
  title: string;
  intro: string;
  values: string[];
  image_url: string | null;
}

const DEFAULTS: {
  business_info: BusinessInfo;
  availability: AvailabilitySettings;
  policies: PolicySettings;
  about: AboutSettings;
} = {
  business_info: {
    name: "Maayan Nails",
    address: "הכרמים 104, אופקים",
    phone: "052-329-8003",
    whatsapp_intl: "+972523298003",
    instagram_url: "https://www.instagram.com/maayan.nails.art",
    timezone: "Asia/Jerusalem",
    logo_url: null,
  },
  availability: {
    slot_interval_minutes: 30,
    booking_horizon_days: 30,
    short_notice_hours: 4,
    hold_duration_minutes: 15,
  },
  policies: {
    reschedule_cutoff_hours: 2,
    warranty_text: "אחריות עד שבוע ממועד הטיפול. לאחר שבוע תיקון יתבצע בתשלום.",
    nail_art_policy_text: "יש לשלוח מראש את הציור הרצוי ולעדכן בזמן תיאום התור אם רוצים להוסיף ציור.",
    cancellation_policy_text:
      'ניתן לשנות מועד או לבטל תור עד שעתיים לפני מועד התור דרך אזור "התורים שלי". בפחות משעתיים, יש ליצור קשר ישיר בוואטסאפ.',
  },
  about: {
    title: "נעים להכיר, מעיין",
    intro:
      "אני אוהבת ליצור ציפורניים נקיות, מדויקות ומותאמות לכל אחת באופן אישי. מבחינתי כל טיפול הוא שילוב של אסתטיקה, דיוק וחוויה נעימה.",
    values: ["יחס אישי", "עבודה מדויקת", "התאמה אישית"],
    image_url: null,
  },
};

/**
 * Reads all business_settings rows and merges them over sane defaults, so the
 * public site keeps working (with the spec's default copy) even before the
 * Supabase connection exists or before Maayan has customized anything yet.
 */
export async function getBusinessSettings() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from("business_settings").select("*");
    const map = new Map((data ?? []).map((row) => [row.key, row.value]));
    return {
      businessInfo: { ...DEFAULTS.business_info, ...(map.get("business_info") as object) } as BusinessInfo,
      availability: { ...DEFAULTS.availability, ...(map.get("availability") as object) } as AvailabilitySettings,
      policies: { ...DEFAULTS.policies, ...(map.get("policies") as object) } as PolicySettings,
      about: { ...DEFAULTS.about, ...(map.get("about") as object) } as AboutSettings,
    };
  } catch {
    // Supabase not configured yet (e.g. first local run before .env.local exists) —
    // fall back to defaults so `next dev` still renders the site.
    return {
      businessInfo: DEFAULTS.business_info,
      availability: DEFAULTS.availability,
      policies: DEFAULTS.policies,
      about: DEFAULTS.about,
    };
  }
}
