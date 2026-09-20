import type { Metadata } from "next";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import { getAdminAppointments } from "@/lib/data/admin-appointments";
import { formatInTimeZone } from "date-fns-tz";
import { BUSINESS_TIMEZONE } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "יומן | ניהול", robots: { index: false, follow: false } };

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function todayStr() {
  return formatInTimeZone(new Date(), BUSINESS_TIMEZONE, "yyyy-MM-dd");
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const monthCursor = month && /^\d{4}-\d{2}$/.test(month) ? new Date(`${month}-01T00:00:00`) : startOfMonth(new Date());

  const appointments = await getAdminAppointments();
  const countsByDate = new Map<string, { total: number; pending: number }>();
  for (const a of appointments) {
    if (a.appointment_status === "cancelled" || a.appointment_status === "declined") continue;
    const dateStr = a.start_at.slice(0, 10);
    const entry = countsByDate.get(dateStr) ?? { total: 0, pending: 0 };
    entry.total += 1;
    if (a.appointment_status === "pending_approval") entry.pending += 1;
    countsByDate.set(dateStr, entry);
  }

  const days = eachDayOfInterval({ start: startOfMonth(monthCursor), end: endOfMonth(monthCursor) });
  const leadingBlanks = getDay(startOfMonth(monthCursor));
  const today = todayStr();
  const prevMonth = format(addMonths(monthCursor, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthCursor, 1), "yyyy-MM");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-brand text-2xl text-charcoal">יומן</h1>
        <p className="mt-1 text-sm text-charcoal-soft">מספר התורים בכל יום. לחיצה על יום עוברת לרשימת התורים המלאה.</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-charcoal/10 bg-ivory p-4">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/admin/calendar?month=${prevMonth}`}
            className="rounded-full p-2 text-charcoal-soft transition-colors hover:bg-cream"
            aria-label="חודש קודם"
          >
            ‹
          </Link>
          <span className="font-brand text-lg text-charcoal">{format(monthCursor, "MMMM yyyy", { locale: he })}</span>
          <Link
            href={`/admin/calendar?month=${nextMonth}`}
            className="rounded-full p-2 text-charcoal-soft transition-colors hover:bg-cream"
            aria-label="חודש הבא"
          >
            ›
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-charcoal-soft/70">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const counts = countsByDate.get(dateStr);
            const isToday = dateStr === today;

            return (
              <Link
                key={dateStr}
                href="/admin/appointments"
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-colors hover:bg-cream",
                  isToday && "ring-2 ring-burgundy/40",
                  counts ? "bg-dusty-rose/30 font-medium text-charcoal" : "text-charcoal-soft/60"
                )}
              >
                <span>{format(day, "d")}</span>
                {counts && (
                  <span className="text-[0.65rem] text-burgundy">
                    {counts.total}
                    {counts.pending > 0 && "•"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
