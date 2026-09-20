"""
Generates the PWA icon set for Maayan Nails from the design tokens in
src/app/globals.css (burgundy background, ivory monogram, rose-gold accent
dot) — no external assets, no network access needed, safe to re-run any
time real photography/branding isn't ready yet.

Usage: python3 scripts/generate-icons.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

BURGUNDY = (110, 43, 58)
WINE = (88, 32, 44)
IVORY = (251, 248, 244)
ROSE_GOLD = (185, 139, 122)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_base(size, monogram_scale, dot=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Soft diagonal gradient burgundy -> wine for a touch of depth.
    for y in range(size):
        t = y / size
        r = int(BURGUNDY[0] + (WINE[0] - BURGUNDY[0]) * t)
        g = int(BURGUNDY[1] + (WINE[1] - BURGUNDY[1]) * t)
        b = int(BURGUNDY[2] + (WINE[2] - BURGUNDY[2]) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Monogram "M" in ivory, Playfair-esque serif stand-in.
    font_size = int(size * monogram_scale)
    font = load_font(font_size)
    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1] - size * 0.02),
        text,
        font=font,
        fill=IVORY,
    )

    if dot:
        r = size * 0.035
        cx, cy = size * 0.5, size * 0.5 + size * 0.24
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ROSE_GOLD)

    return img


def make_rounded(size, radius_ratio=0.22):
    img = draw_base(size, monogram_scale=0.52)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=int(size * radius_ratio), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def make_maskable(size):
    # Maskable icons must fill the full square (no transparency/rounding —
    # the OS applies its own mask) and keep the monogram inside the ~80%
    # "safe zone" circle, so shrink it a bit relative to the plain icons.
    return draw_base(size, monogram_scale=0.4)


make_rounded(192).save(os.path.join(OUT_DIR, "icon-192.png"))
make_rounded(512).save(os.path.join(OUT_DIR, "icon-512.png"))
make_maskable(512).convert("RGB").save(os.path.join(OUT_DIR, "icon-maskable-512.png"))

# Apple touch icon: no transparency, slightly less corner rounding since iOS
# applies its own mask on top.
make_rounded(180, radius_ratio=0.0).convert("RGB").save(os.path.join(OUT_DIR, "apple-touch-icon.png"))

print("Icons written to", OUT_DIR)
