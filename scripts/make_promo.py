"""Draw the 440x280 Chrome Web Store small promo tile from the 128px icon."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(sys.argv[1] if len(sys.argv) > 1 else "store/promo-small-440x280.png")
W, H, SCALE = 440, 280, 3
TOP, BOTTOM = (99, 72, 196), (58, 40, 132)


def font(size, bold):
    names = (["DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"] if bold
             else ["DejaVuSans.ttf", "LiberationSans-Regular.ttf"])
    for name in names:
        for base in ("/usr/share/fonts/truetype/dejavu/", "/usr/share/fonts/truetype/liberation/", ""):
            try:
                return ImageFont.truetype(base + name, size)
            except OSError:
                pass
    return ImageFont.load_default()


w, h = W * SCALE, H * SCALE
img = Image.new("RGB", (w, h))
d = ImageDraw.Draw(img)
for y in range(h):
    t = y / (h - 1)
    d.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))

icon = Image.open(Path(__file__).resolve().parent.parent / "icons/icon128.png").convert("RGBA")
icon = icon.resize((150 * SCALE, 150 * SCALE), Image.LANCZOS)
# Soft white plate behind the icon so its own background separates from the tile.
plate = 8 * SCALE
ix, iy = 30 * SCALE, (h - icon.height) // 2
d.rounded_rectangle([ix - plate, iy - plate, ix + icon.width + plate, iy + icon.height + plate],
                    radius=40 * SCALE, fill=(255, 255, 255))
img.paste(icon, (ix, iy), icon)

tx = ix + icon.width + 26 * SCALE
d.text((tx, 78 * SCALE), "GitLab MR", font=font(30 * SCALE, True), fill="white")
d.text((tx, 114 * SCALE), "Test Hider", font=font(30 * SCALE, True), fill="white")
sub = font(14 * SCALE, False)
d.text((tx, 162 * SCALE), "Mark test files as Viewed", font=sub, fill=(222, 214, 250))
d.text((tx, 182 * SCALE), "in one click", font=sub, fill=(222, 214, 250))

out.parent.mkdir(parents=True, exist_ok=True)
img.resize((W, H), Image.LANCZOS).save(out)
print(out)
