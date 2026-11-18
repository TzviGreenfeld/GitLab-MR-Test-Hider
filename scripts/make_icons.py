"""Draw the extension icons: a lab flask (tests) with a green "viewed" check badge.

Usage: python3 scripts/make_icons.py [out_dir]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "icons")
S = 1024  # master canvas; each size is downsampled from it

BG_TOP = (99, 72, 196)      # indigo
BG_BOTTOM = (58, 40, 132)
FLASK = (255, 255, 255)
LIQUID = (255, 176, 59)     # amber
BADGE = (46, 184, 92)       # green
BADGE_RING = (58, 40, 132)


def vertical_gradient(size, top, bottom):
    grad = Image.new("RGBA", (1, size))
    for y in range(size):
        t = y / (size - 1)
        grad.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    return grad.resize((size, size))


def flask_polygon(cx, top, neck_w, body_w, bottom, shoulder):
    """Outline of an Erlenmeyer flask: straight neck, then sloped sides to a flat base."""
    nl, nr = cx - neck_w / 2, cx + neck_w / 2
    bl, br = cx - body_w / 2, cx + body_w / 2
    return [(nl, top), (nr, top), (nr, shoulder), (br, bottom), (bl, bottom), (nl, shoulder)]


def master(detail=True):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # Rounded-square background with a gradient.
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=255)
    img.paste(vertical_gradient(S, BG_TOP, BG_BOTTOM), (0, 0), mask)
    d = ImageDraw.Draw(img)

    # Flask: white outline shape, amber liquid inside.
    cx, top, bottom = S * 0.43, S * 0.17, S * 0.80
    neck_w, body_w, shoulder = S * 0.20, S * 0.58, S * 0.40
    outer = flask_polygon(cx, top, neck_w, body_w, bottom, shoulder)
    d.polygon(outer, fill=FLASK)
    d.rounded_rectangle([cx - neck_w / 2 - S * 0.04, top - S * 0.03,
                         cx + neck_w / 2 + S * 0.04, top + S * 0.05],
                        radius=S * 0.025, fill=FLASK)  # lip

    # Inner cavity (background colour) and the liquid, inset from the outline.
    inset = S * 0.055
    inner = flask_polygon(cx, top + S * 0.06, neck_w - 2 * inset, body_w - 2.6 * inset,
                          bottom - inset, shoulder + inset * 0.4)
    cavity = Image.new("L", (S, S), 0)
    ImageDraw.Draw(cavity).polygon(inner, fill=255)
    img.paste(vertical_gradient(S, BG_TOP, BG_BOTTOM), (0, 0), cavity)

    liquid_top = S * 0.55
    liquid = Image.new("L", (S, S), 0)
    ld = ImageDraw.Draw(liquid)
    ld.polygon(inner, fill=255)
    ld.rectangle([0, 0, S, liquid_top], fill=0)
    img.paste(Image.new("RGBA", (S, S), LIQUID + (255,)), (0, 0), liquid)

    if detail:  # bubbles; dropped at 16px where they only add noise
        for bx, by, r in ((0.36, 0.66, 0.035), (0.47, 0.71, 0.025), (0.43, 0.48, 0.022)):
            d.ellipse([S * (bx - r), S * (by - r), S * (bx + r), S * (by + r)], fill=FLASK)

    # "Viewed" badge: green disc with a ring in the background colour and a white check.
    bx, by, br = S * 0.72, S * 0.72, S * 0.22
    ring = S * 0.045
    d.ellipse([bx - br - ring, by - br - ring, bx + br + ring, by + br + ring], fill=BADGE_RING)
    d.ellipse([bx - br, by - br, bx + br, by + br], fill=BADGE)
    w = round(S * 0.055)
    d.line([(bx - br * 0.48, by + br * 0.02), (bx - br * 0.12, by + br * 0.38),
            (bx + br * 0.50, by - br * 0.34)], fill=FLASK, width=w, joint="curve")
    for x, y in ((bx - br * 0.48, by + br * 0.02), (bx + br * 0.50, by - br * 0.34)):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=FLASK)  # round caps
    return img


OUT.mkdir(exist_ok=True)
full, simple = master(True), master(False)
for size in (16, 32, 48, 128):
    src = simple if size <= 16 else full
    src.resize((size, size), Image.LANCZOS).save(OUT / f"icon{size}.png")
