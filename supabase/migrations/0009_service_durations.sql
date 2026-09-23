-- Updates treatment durations per Maayan's actual working pace (2026-09-23):
--   מילוי אקריל (acrylic fill): 45 -> 60 min
--   הסרת לק ג'ל, מניקור וסידור ציפורן (gel removal + manicure + shaping): 30 -> 20 min
-- בניית ציפורניים (all three build variants) were already 75 min (1h15) — no change needed.
-- Matched by name rather than id, since ids differ between environments.

update public.services
set duration_minutes = 60
where kind = 'treatment' and name = 'מילוי אקריל';

update public.services
set duration_minutes = 20
where kind = 'treatment' and name = 'הסרת לק ג׳ל, מניקור וסידור ציפורן';
