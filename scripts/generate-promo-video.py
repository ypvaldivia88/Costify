#!/usr/bin/env python3
"""Generate Costify Facebook promo video (1080x1080)."""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/mobile/assets"
OUT_DIR = Path("/opt/cursor/artifacts/costify-promo")
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1080
BRAND = "#059669"
BRAND_DARK = "#047857"
BRAND_LIGHT = "#10B981"
WHITE = "#FFFFFF"
MUTED = "#D1FAE5"
ACCENT = "#FEF3C7"

FPS = 30


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def gradient_bg() -> Image.Image:
    img = Image.new("RGB", (W, H), BRAND)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(5 + (4 - 5) * t)
        g = int(150 + (120 - 150) * t)
        b = int(105 + (87 - 105) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    return img


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_centered_block(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font: ImageFont.FreeTypeFont,
    center_y: int,
    fill: str = WHITE,
    line_gap: int = 14,
):
    heights = [font.size + line_gap for _ in lines]
    total = sum(heights) - line_gap
    y = center_y - total // 2
    for line in lines:
        tw = draw.textlength(line, font=font)
        draw.text(((W - tw) / 2, y), line, font=font, fill=fill)
        y += font.size + line_gap


def paste_icon(base: Image.Image, size: int = 180, y_offset: int = 120) -> None:
    icon_path = ASSETS / "icon.png"
    if not icon_path.exists():
        return
    icon = Image.open(icon_path).convert("RGBA")
    icon = icon.resize((size, size), Image.Resampling.LANCZOS)
    x = (W - size) // 2
    base.paste(icon, (x, y_offset), icon)


def slide_hook() -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    paste_icon(img, 200, 140)

    title_font = load_font(58, bold=True)
    sub_font = load_font(34)

    lines = wrap_text(draw, "¿Sabes cuánto te cuesta lo que vendes?", title_font, 900)
    draw_centered_block(draw, lines, title_font, 520)

    sub = wrap_text(draw, "Muchos negocios pequeños pierden dinero sin darse cuenta.", sub_font, 860)
    draw_centered_block(draw, sub, sub_font, 700, fill=MUTED)

    badge_font = load_font(28, bold=True)
    rounded_rect(draw, (300, 860, 780, 930), 24, BRAND_DARK)
    text = "Cafeterías · Panaderías · Tiendas"
    tw = draw.textlength(text, font=badge_font)
    draw.text(((W - tw) / 2, 882), text, font=badge_font, fill=WHITE)
    return img


def slide_problem() -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    title_font = load_font(52, bold=True)
    body_font = load_font(34)
    bullet_font = load_font(30)

    draw_centered_block(draw, ["¿Te suena familiar?"], title_font, 200)

    bullets = [
        "Compras insumos y no sabes el costo real",
        "Pones precios «a ojo»",
        "Se acaba el stock y no te diste cuenta",
        "Al final del mes no sabes si ganaste",
    ]

    y = 320
    for bullet in bullets:
        rounded_rect(draw, (80, y, 1000, y + 108), 20, WHITE)
        draw.ellipse((108, y + 38, 136, y + 66), fill=BRAND)
        lines = wrap_text(draw, bullet, bullet_font, 820)
        draw.text((160, y + 34), lines[0], font=bullet_font, fill=BRAND_DARK)
        if len(lines) > 1:
            draw.text((160, y + 68), lines[1], font=body_font, fill="#374151")
        y += 128

    draw_centered_block(draw, ["Hay una forma más fácil."], body_font, 940, fill=MUTED)
    return img


def slide_intro() -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    paste_icon(img, 180, 150)

    brand_font = load_font(72, bold=True)
    title_font = load_font(50, bold=True)
    sub_font = load_font(34)

    draw_centered_block(draw, ["Costify"], brand_font, 400)
    draw_centered_block(
        draw,
        ["Costos, precios e inventario para tu negocio"],
        sub_font,
        500,
        fill=MUTED,
    )

    rounded_rect(draw, (70, 590, 1010, 760), 24, "#ffffff22")
    draw_centered_block(draw, ["La app para calcular costos,"], title_font, 640)
    draw_centered_block(draw, ["fijar precios y controlar inventario."], title_font, 710)
    return img


def slide_features() -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    title_font = load_font(50, bold=True)
    card_title = load_font(34, bold=True)
    card_body = load_font(28)

    draw_centered_block(draw, ["Todo en un solo lugar"], title_font, 150)

    cards = [
        ("💰", "Costos reales", "Suma insumos, gastos e impuestos"),
        ("🏷️", "Precios con ganancia", "Sabe a cuánto vender cada producto"),
        ("📦", "Inventario", "Controla almacén, stock y producción"),
    ]

    y = 260
    for emoji, title, body in cards:
        rounded_rect(draw, (80, y, 1000, y + 200), 24, WHITE)
        draw.text((120, y + 55), emoji, font=load_font(48))
        draw.text((220, y + 40), title, font=card_title, fill=BRAND_DARK)
        draw.text((220, y + 95), body, font=card_body, fill="#374151")
        y += 230

    draw_centered_block(draw, ["Pensada para negocios pequeños en Cuba"], load_font(30), 980, fill=ACCENT)
    return img


def slide_offline() -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)
    paste_icon(img, 220, 180)

    title_font = load_font(54, bold=True)
    body_font = load_font(34)
    highlight_font = load_font(40, bold=True)

    draw_centered_block(draw, ["Funciona sin internet"], title_font, 500)
    draw_centered_block(
        draw,
        [
            "Registra tus datos en el celular",
            "y sigue trabajando aunque falle la conexión.",
        ],
        body_font,
        640,
        fill=MUTED,
    )

    rounded_rect(draw, (160, 780, 920, 900), 28, BRAND_DARK)
    draw_centered_block(draw, ["Ideal para el día a día del negocio"], highlight_font, 840)
    return img


def slide_cta() -> Image.Image:
    img = gradient_bg()
    draw = ImageDraw.Draw(img)

    paste_icon(img, 170, 120)

    title_font = load_font(46, bold=True)
    sub_font = load_font(30)
    cta_font = load_font(36, bold=True)
    brand_font = load_font(64, bold=True)

    draw_centered_block(draw, ["Costify"], brand_font, 360)

    draw_centered_block(
        draw,
        ["Deja de adivinar precios.", "Empieza a controlar tu negocio."],
        title_font,
        520,
    )

    rounded_rect(draw, (200, 660, 880, 770), 30, WHITE)
    draw_centered_block(draw, ["Descarga Costify hoy"], cta_font, 715, fill=BRAND_DARK)

    draw_centered_block(
        draw,
        ["Comparte con quien tenga un negocio pequeño"],
        sub_font,
        900,
        fill=MUTED,
    )
    return img


def save_slides() -> list[tuple[Path, float]]:
    slides = [
        (slide_hook(), 4.0),
        (slide_problem(), 5.0),
        (slide_intro(), 4.5),
        (slide_features(), 5.5),
        (slide_offline(), 4.0),
        (slide_cta(), 5.0),
    ]
    frames_dir = OUT_DIR / "frames"
    frames_dir.mkdir(exist_ok=True)

    manifest: list[tuple[Path, float]] = []
    for idx, (slide, duration) in enumerate(slides, start=1):
        path = frames_dir / f"slide_{idx:02d}.png"
        slide.save(path, "PNG")
        manifest.append((path, duration))
        print(f"Saved {path} ({duration}s)")
    return manifest


def build_video(manifest: list[tuple[Path, float]], output: Path) -> None:
    concat_file = OUT_DIR / "concat.txt"
    lines: list[str] = []
    for path, duration in manifest:
        lines.append(f"file '{path}'")
        lines.append(f"duration {duration}")
    lines.append(f"file '{manifest[-1][0]}'")
    concat_file.write_text("\n".join(lines) + "\n")

    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(concat_file),
        "-vf",
        "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        str(FPS),
        "-movflags",
        "+faststart",
        str(output),
    ]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    manifest = save_slides()
    output = OUT_DIR / "costify-promo-facebook.mp4"
    build_video(manifest, output)
    print(f"\nVideo ready: {output}")
