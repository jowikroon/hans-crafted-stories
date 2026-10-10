"""
make-og-image.py — genereert public/og-image.png (1200x630) uit public/hans-profile.jpg.

Waarom: de vorige og-image.png was een niet-ingevuld template ("JOHN DOE — Creative
Director — johndoeportfolio.com") en stond als og:image op ELKE pagina en als
Person.image in de JSON-LD (SEO-fix batch 2 2026-09-22). Deze generator is
reproduceerbaar; draai opnieuw na een nieuwe headshot of titelwijziging.

Gebruik:  python3 scripts/make-og-image.py [--font-dir DIR]
Fonts:    Inter Medium/Bold (Switzer-fallback); vallen terug op DejaVu Sans.
"""
import argparse, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "hans-profile.jpg")
OUT = os.path.join(ROOT, "public", "og-image.png")

W, H = 1200, 630
BG = (250, 248, 242)        # #FAF8F2 creme (site --background)
INK = (23, 21, 15)          # #17150F ink (site --foreground)
MUTED = (110, 106, 94)      # #6E6A5E
GREEN = (28, 122, 72)       # #1C7A48 editorial green (site --primary)
LINE = (218, 213, 199)      # #DAD5C7

NAME = "Hans van Leeuwen"
TITLE = "Freelance & Interim\nE-commerce Manager"
SUB = "Amazon NL/DE · Bol.com · AI-assisted operations"
DOMAIN = "hansvanleeuwen.com"
LOC = "Amersfoort, NL · working across NL/EU"


def font(candidates, size):
    for c in candidates:
        if c and os.path.exists(c):
            return ImageFont.truetype(c, size)
    for fb in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if os.path.exists(fb):
            return ImageFont.truetype(fb, size)
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--font-dir", default=os.environ.get("OG_FONT_DIR", "/tmp/fonts"))
    a = ap.parse_args()
    bold = [os.path.join(a.font_dir, "inter-2.ttf"), os.path.join(a.font_dir, "Inter-Bold.ttf")]
    medium = [os.path.join(a.font_dir, "inter-1.ttf"), os.path.join(a.font_dir, "Inter-Medium.ttf")]

    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Left: portrait panel (photo is 840x1080; crop to 3:4 and fit height)
    photo = Image.open(SRC).convert("RGB")
    pw, ph = photo.size
    target_w = 420
    scale = H / ph
    photo = photo.resize((int(pw * scale), H), Image.LANCZOS)
    # centre-crop to target width
    left = max(0, (photo.width - target_w) // 2)
    photo = photo.crop((left, 0, left + target_w, H))
    img.paste(photo, (0, 0))
    # soft divider
    d.rectangle([target_w, 0, target_w + 2, H], fill=LINE)

    # Right: text block
    x = target_w + 60
    y = 72
    f_eyebrow = font(medium, 22)
    f_name = font(bold, 62)
    f_title = font(medium, 36)
    f_sub = font(medium, 24)
    f_domain = font(bold, 26)

    d.rectangle([x, y + 9, x + 28, y + 11], fill=GREEN)
    d.text((x + 40, y), "E-COMMERCE & MARKETPLACES", font=f_eyebrow, fill=GREEN)
    y += 52
    d.text((x, y), NAME, font=f_name, fill=INK)
    y += 86
    d.multiline_text((x, y), TITLE, font=f_title, fill=INK, spacing=8)
    y += 108
    d.text((x, y), SUB, font=f_sub, fill=MUTED)
    y += 40
    d.text((x, y), LOC, font=f_sub, fill=MUTED)

    # Proof line
    y += 66
    d.rectangle([x, y, x + 6, y + 32], fill=GREEN)  # één regel: geen klantcijfers (anonimisering 2026-09-23)
    d.multiline_text((x + 22, y - 2), "10+ years on marketplaces", font=f_sub, fill=INK, spacing=10)

    # Footer domain
    d.rectangle([x, H - 92, W - 64, H - 91], fill=LINE)
    d.text((x, H - 72), DOMAIN, font=f_domain, fill=GREEN)

    img.save(OUT, "PNG", optimize=True)
    kb = os.path.getsize(OUT) // 1024
    print(f"[make-og-image] wrote {OUT} ({W}x{H}, {kb}KB)")
    if kb > 300:
        print("[make-og-image] WARNING: >300KB, compress (pngquant) before commit", file=sys.stderr)


if __name__ == "__main__":
    main()
