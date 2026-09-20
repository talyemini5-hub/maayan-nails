# Maayan Nails

מערכת ווב מלאה לעסק **Maayan Nails** — אתר ציבורי יוקרתי, מנוע קביעת תורים אמיתי עם הגנה מלאה מפני תורים כפולים, אזור אישי ללקוחות ואזור ניהול מקיף למעיין.

> **סטטוס נוכחי (ר' [STATUS.md](./STATUS.md)):** הבסיס המלא — סכימת מסד הנתונים, RLS, מנוע הזמינות/הזמנות ברמת ה-DB, מערכת העיצוב, עמוד הבית המלא ושכבת ה-API לקביעת תורים — בנוי, נבדק (`typecheck` + `lint` + `build` + בדיקות יחידה) ועובד. אזור הניהול המלא, ה-Auth הפעיל, ה-PWA וה-Deployment בפועל הם השלב הבא — ר' STATUS.md לפירוט מדויק של מה שנשאר ומה חוסם כרגע.

## טכנולוגיה ולמה

| שכבה | בחירה | למה |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | SSR/RSC לנתונים תמיד עדכניים (קריטי לזמינות תורים), API Routes מובנים, פריסה טבעית ל-Vercel |
| שפה | TypeScript (strict) | בטיחות טיפוסים על פני כל השכבות — DB → API → UI |
| מסד נתונים | Supabase (PostgreSQL) | RLS אמיתי, Auth מובנה, Storage, ותמיכה מעולה ב-`EXCLUDE` constraints למניעת חפיפות |
| עיצוב | Tailwind CSS v4 | טוקנים מוגדרים ב-CSS (`globals.css`), מהיר, נגיש |
| אימות טפסים | Zod + React Hook Form | ולידציה זהה בצד לקוח ובצד שרת |
| אימייל | Resend (מודולרי, ניתן להחלפה) | API פשוט, HTML templates בעברית/RTL |
| בדיקות | Vitest (unit) + Playwright (E2E) | מהיר, תמיכה טובה ב-TypeScript/RSC |
| פריסה | Vercel | אינטגרציה חלקה עם Next.js, כתובת חינמית לשלב הראשון |

כל הבחירות הטכנולוגיות נבדקו מול התיעוד הרשמי בזמן הבנייה (ראה `node_modules/next/dist/docs` ו-AGENTS.md של כל חבילה — הפרויקט נבנה על Next.js 16 שיש בו כמה שינויים לא-תואמים־לאחור מגרסאות קודמות, למשל `middleware.ts`→`proxy.ts`).

## החלטות ארכיטקטורה מרכזיות

1. **מניעת תורים כפולים ברמת מסד הנתונים, לא רק בקוד.** הטבלה `appointments` מוגנת ב-`EXCLUDE USING gist` constraint (`appointments_no_overlap`, ב-`supabase/migrations/0002_tables.sql`) שמונע פיזית שני תורים חופפים בסטטוס פעיל. גם אם שתי בקשות מגיעות באותה מילישנייה, פוסטגרס עצמו דוחה את השנייה — לא תלוי בקוד האפליקציה. כל נתיבי הכתיבה (יצירה, שינוי מועד, אישור בקשה) עוברים דרך פונקציות `SECURITY DEFINER` יחידות (`create_appointment_request`, `admin_upsert_appointment` וכו', ב-`0003_functions.sql`/`0004_appointment_management.sql`) כדי שהלוגיקה העסקית תהיה במקום אחד.
2. **קביעת תור לא דורשת הרשמה.** `create_appointment_request` מקבל פרטי קשר (שם/טלפון/אימייל) ומבצע find-or-create על טבלת `customers` בעצמו — כך שלקוחה חדשה יכולה לקבוע תור בלי ליצור חשבון קודם, כפי שנדרש. ההזדהות (Magic Link) נדרשת רק כדי לצפות ב"התורים שלי" ולנהל אותם.
3. **זמינות מחושבת בשרת בלבד, דרך RPC.** `get_available_slots` / `get_available_dates` הן פונקציות `SECURITY DEFINER` שמחזירות רק שעות פנויות בפועל — לא את שעות העבודה הגולמיות או סיבות החסימה (שיכולות להיות פרטיות, למשל "פגישה אישית"). כך אין הסתמכות על הסתרת מידע ב-Frontend.
4. **RLS על כל טבלה.** לקוחה יכולה לקרוא רק שורות ששייכות לה (`customers.profile_id = auth.uid()`); מנהלת (role=admin) רואה הכל. מדיניות מלאה ב-`0006_rls.sql`.
5. **הגדרות עסק בטבלת key/value (`business_settings`)** ולא כערכים קבועים בקוד — כדי שכל טקסט/מדיניות/שם עסק יהיו ניתנים לעריכה מהאדמין בלי דיפלוי מחדש.
6. **אזור זמן `Asia/Jerusalem` בכל מקום שמוצג ללקוחה** (`date-fns-tz`), בעוד שהאחסון במסד תמיד ב-`timestamptz` (UTC) — כדי שמעברי שעון קיץ לא ישברו חישובי זמינות.

## מבנה הפרויקט

```
src/
  app/(public)/        עמוד הבית, קביעת תור, גלריה, התורים שלי — עם Header/Footer/BottomNav
  app/admin/           אזור הניהול (מוגן ב-proxy.ts + RLS)
  app/api/             Route Handlers: appointments, admin, auth, webhooks
  components/          UI primitives + קומפוננטות עמוד הבית/אדמין
  lib/
    supabase/          לקוחות Supabase (client/server/service-role) + session refresh
    data/               שכבת גישה לנתונים (Server Components)
    validation/         סכימות Zod (הזמנה + אדמין)
    email/              תבניות + שליחה (Resend), עם Notification Log
    availability/       (RPC wrappers — יורחב בשלב הבא)
supabase/
  migrations/           0001..0006 — enums, tables, functions, RLS, triggers
  seed/seed.sql          שירותים/מחירים/שעות/הגדרות התחלתיים מהספק
  tests/booking_rules.sql  בדיקות SQL ידניות למניעת חפיפות (ר' למטה)
tests/unit/              בדיקות Vitest (ולידציה, פורמט, וואטסאפ)
```

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # ומלאי את הפרטים מ-Supabase (ר' למטה)
npm run dev
```

### חיבור Supabase

1. צרי פרויקט חדש ב-https://supabase.com/dashboard (מומלץ אזור קרוב, למשל Frankfurt).
2. Project Settings → API — העתיקי `Project URL`, `anon public key`, ו-`service_role key` ל-`.env.local`.
3. חברי את ה-CLI המקומי לפרויקט: `npx supabase link --project-ref <ref>`.
4. הריצי את המיגרציות: `npm run db:migrate` (=`supabase db push`).
5. טעני נתוני פתיחה: `npm run db:seed`.
6. (אופציונלי) עדכני טיפוסים אוטומטית: `npm run db:types`.

### יצירת משתמשת Admin ראשונה

אין דרך ליצור Admin דרך האתר בכוונה (זו פעולה רגישה). לאחר שיש משתמש ב-Auth (למשל נרשם/ה דרך מסך ה-Magic Link), הריצי בפוסטגרס (SQL Editor בדשבורד של Supabase):

```sql
update public.profiles set role = 'admin' where email = 'maayan@example.com';
```

## פריסה (Vercel)

1. `vercel link` (או חיבור ה-Repo מה-Dashboard).
2. הגדירי את כל משתני הסביבה מ-`.env.example` תחת Project Settings → Environment Variables.
3. `vercel --prod`.
4. לחיבור דומיין פרטי בעתיד: Vercel → Domains → Add — אין צורך בשינוי קוד, ה-`NEXT_PUBLIC_SITE_URL` פשוט יתעדכן למשתנה הסביבה החדש.

## גיבוי ושחזור

Supabase מבצע גיבויים אוטומטיים יומיים (Point-in-Time Recovery זמין בתוכניות בתשלום). בנוסף מומלץ:
- **גיבוי לוגי ידני:** `supabase db dump -f backup.sql` לפני כל שינוי מבני גדול.
- **שחזור:** `psql <connection-string> -f backup.sql` לפרויקט חדש/נקי, או שימוש ב-PITR מהדשבורד.
- קוד המקור עצמו מגובה דרך GitHub (כל commit הוא נקודת שחזור).

## בדיקות

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run test        # Vitest — ולידציה, פורמט, וואטסאפ (25 בדיקות, כולן עוברות)
npm run build       # Production build (Turbopack)
npm run test:e2e    # Playwright — ייכתב בשלב הבא מול Supabase חי
```

בדיקות ה-SQL הקריטיות ביותר — מניעת תורים כפולים ברמת ה-DB — נמצאות ב-`supabase/tests/booking_rules.sql` ורצות ידנית מול פרויקט Supabase מחובר (`supabase db execute --file supabase/tests/booking_rules.sql`), כי בדיקות ברמת מסד נתונים דורשות Postgres אמיתי (לא ניתן להריץ Docker/`supabase start` בסביבת הפיתוח הנוכחית).

## שירותים חיצוניים שעדיין דורשים הרשאה

| שירות | נדרש עבור | סטטוס |
|---|---|---|
| GitHub | Repository + היסטוריית קוד | ממתין ל-Personal Access Token |
| Supabase | מסד נתונים, Auth, Storage | ממתין ליצירת פרויקט + מפתחות |
| Vercel | פריסה לאינטרנט | ממתין ל-Access Token |
| Resend (או ספק אימייל אחר) | שליחת אימיילים ללקוחות | הושהה לבקשתך — הקוד מוכן, רק חסר `RESEND_API_KEY` |

## הכנות עתידיות (לא פעילות כרגע)

- **תשלומים:** ארכיטקטורת ה-`appointments` כוללת `price`/`final_price` נפרדים ומוכנה להוספת שדה `payment_status` + טבלת `payments` בלי לשנות את מנוע התורים. שום פרט אשראי לא נשמר במסד בשום שלב.
- **SMS / WhatsApp Business API / תזכורת 24 שעות:** `notification_logs` כבר תומך בכל סוג הודעה; שכבת ה-`email` בנויה כממשק מודולרי (`sendAppointmentNotification`) כך שהוספת ספק SMS/WhatsApp היא מימוש נוסף באותה שכבה, לא שינוי בלוגיקת התורים.
- **דו-שלבי לאדמין (2FA):** טבלת `profiles` ותהליך ה-Auth מוכנים להרחבה — Supabase Auth תומך ב-MFA באופן מובנה כשנרצה להפעיל.
- **זיהוי לקוחות לפי טלפון/SMS:** שכבת ה-Auth מופרדת מטבלת ה-`customers` (`profile_id` הוא הקישור היחיד), כך שהחלפת שיטת ההזדהות לא דורשת שינוי בהיסטוריית התורים.
