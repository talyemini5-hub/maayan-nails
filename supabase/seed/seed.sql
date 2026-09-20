-- Maayan Nails — seed data (idempotent: safe to re-run)

-- ============================================================
-- BUSINESS SETTINGS
-- ============================================================
insert into public.business_settings (key, value) values
  ('business_info', jsonb_build_object(
    'name', 'Maayan Nails',
    'address', 'הכרמים 104, אופקים',
    'phone', '052-329-8003',
    'whatsapp_intl', '+972523298003',
    'instagram_url', 'https://www.instagram.com/maayan.nails.art',
    'timezone', 'Asia/Jerusalem',
    'logo_url', null
  )),
  ('availability', jsonb_build_object(
    'slot_interval_minutes', 30,
    'booking_horizon_days', 30,
    'short_notice_hours', 4,
    'hold_duration_minutes', 15
  )),
  ('policies', jsonb_build_object(
    'reschedule_cutoff_hours', 2,
    'warranty_text', 'אחריות עד שבוע ממועד הטיפול. לאחר שבוע תיקון יתבצע בתשלום.',
    'nail_art_policy_text', 'יש לשלוח מראש את הציור הרצוי ולעדכן בזמן תיאום התור אם רוצים להוסיף ציור.',
    'cancellation_policy_text', 'ניתן לשנות מועד או לבטל תור עד שעתיים לפני מועד התור דרך אזור "התורים שלי". בפחות משעתיים, יש ליצור קשר ישיר בוואטסאפ.'
  )),
  ('about', jsonb_build_object(
    'title', 'נעים להכיר, מעיין',
    'intro', 'אני אוהבת ליצור ציפורניים נקיות, מדויקות ומותאמות לכל אחת באופן אישי. מבחינתי כל טיפול הוא שילוב של אסתטיקה, דיוק וחוויה נעימה.',
    'values', jsonb_build_array('יחס אישי', 'עבודה מדויקת', 'התאמה אישית'),
    'image_url', null
  ))
on conflict (key) do nothing;

-- ============================================================
-- WORKING HOURS — default: Sun-Thu 09:00-19:00, Fri 09:00-14:00, Sat closed
-- (placeholder default; editable in Admin settings)
-- ============================================================
insert into public.working_hours (day_of_week, is_open, start_time, end_time) values
  (0, true,  '09:00', '19:00'), -- Sunday
  (1, true,  '09:00', '19:00'), -- Monday
  (2, true,  '09:00', '19:00'), -- Tuesday
  (3, true,  '09:00', '19:00'), -- Wednesday
  (4, true,  '09:00', '19:00'), -- Thursday
  (5, true,  '09:00', '14:00'), -- Friday
  (6, false, null, null)         -- Saturday - closed
on conflict (day_of_week) do nothing;

-- ============================================================
-- SERVICES — treatments
-- ============================================================
insert into public.services (kind, name, price, is_price_from, duration_minutes, prep_buffer_minutes, is_active, requires_approval, sort_order, description) values
  ('treatment', 'לק ג׳ל מבנה אנטומי', 140, false, null, 0, true, false, 10, 'מניקור מבנה אנטומי ולק ג׳ל'),
  ('treatment', 'מילוי אקריל', 140, false, null, 0, true, false, 20, 'מילוי לציפורניות בנויות'),
  ('treatment', 'לק ג׳ל רגליים', 100, false, null, 0, true, false, 30, 'פדיקור ולק ג׳ל'),
  ('treatment', 'הסרת לק ג׳ל, מניקור וסידור ציפורן', 80, false, null, 0, true, false, 40, null),
  ('treatment', 'בניית ציפורניים באקריל', 350, false, null, 0, true, false, 50, null),
  ('treatment', 'בניית ציפורניים בטיפסים הפוכים', 350, false, null, 0, true, false, 60, null),
  ('treatment', 'בניית ציפורניים בפוליג׳ל', 350, false, null, 0, true, false, 70, null)
on conflict do nothing;

-- "אורך XL או ארוך מאוד" kept as its own addon-style line item per spec (150₪),
-- editable to move between "treatment extra" and "addon" from the admin panel.
insert into public.services (kind, name, price, is_price_from, duration_minutes, prep_buffer_minutes, is_active, requires_approval, sort_order, description) values
  ('addon', 'אורך XL או ארוך מאוד', 150, false, null, 0, true, false, 80, 'תוספת אורך')
on conflict do nothing;

-- ============================================================
-- SERVICES — addons
-- ============================================================
insert into public.services (kind, name, price, price_max, is_price_from, duration_minutes, prep_buffer_minutes, is_active, requires_approval, sort_order, description) values
  ('addon', 'פאני באני', 20, null, false, null, 0, true, false, 100, null),
  ('addon', 'תיקון ציפורן', 10, null, false, null, 0, true, false, 110, null),
  ('addon', 'פרנץ׳', 20, null, false, null, 0, true, false, 120, null),
  ('addon', 'אומברה', 20, null, false, null, 0, true, false, 130, null),
  ('addon', 'ציור או קישוט', 10, 50, true, null, 0, true, true, 140, 'המחיר הסופי ייקבע ע"י מעיין בהתאם למורכבות')
on conflict do nothing;

-- ============================================================
-- Link addons to treatments (all addons available for all treatments, as a
-- sane default — editable per-service from the admin panel)
-- ============================================================
insert into public.service_addons (service_id, addon_id)
select t.id, a.id
from public.services t
cross join public.services a
where t.kind = 'treatment' and a.kind = 'addon'
on conflict do nothing;

-- ============================================================
-- DEMO REVIEWS — status = draft, NOT shown on the live site until Maayan
-- explicitly marks them approved + published from the admin panel.
-- ============================================================
insert into public.reviews (customer_name, rating, content, status, is_demo) values
  ('נועה כהן', 5, 'הידיים שלי אף פעם לא נראו כל כך טוב. מעיין מדייקת בכל פרט ואווירה בסטודיו נעימה מאוד.', 'draft', true),
  ('שירה לוי', 5, 'מגיעה כבר שנה לטיפולים ותמיד יוצאת מרוצה. השירות אדיב, נקי ומקצועי.', 'draft', true),
  ('טל אברהם', 4, 'אהבתי מאוד את העיצוב שהציעה לי, בדיוק מה שרציתי בלי שהייתי צריכה להסביר יותר מדי.', 'draft', true)
on conflict do nothing;

-- ============================================================
-- GALLERY — a few placeholder rows (image_url to be replaced from admin)
-- ============================================================
insert into public.gallery (title, category, image_url, orientation, is_featured, is_published, sort_order) values
  ('לק ג׳ל נודי', 'gel_polish', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200', 'portrait', true, true, 10),
  ('בנייה בפוליג׳ל', 'extensions', 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=1200', 'landscape', true, true, 20),
  ('פרנץ׳ קלאסי', 'french', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1200', 'square', false, true, 30)
on conflict do nothing;
