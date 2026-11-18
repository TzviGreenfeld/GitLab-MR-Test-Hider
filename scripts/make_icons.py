"""Draw the extension icons: an orange rounded square with a white check mark."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "icons")
SCALE = 8  # draw large, then downsample for smooth edges


def icon(size):
    s = size * SCALE
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s // 5, fill=(226, 67, 41, 255))
    w = max(s // 9, SCALE)
    d.line([(s * 0.24, s * 0.52), (s * 0.43, s * 0.70), (s * 0.77, s * 0.32)],
           fill="white", width=w, joint="curve")
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(exist_ok=True)
for size in (16, 32, 48, 128):
    icon(size).save(OUT / f"icon{size}.png")
