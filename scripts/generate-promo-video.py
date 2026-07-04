#!/usr/bin/env python3
"""Generate Costify Facebook promo video (1080x1080) with narration."""

from __future__ import annotations

import asyncio
import subprocess
import wave
from pathlib import Path

import edge_tts
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "apps/mobile/assets"
OUT_DIR = Path("/opt/cursor/artifacts/costify-promo")
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1080
BRAND = "#059669"
BRAND_DARK = "#047857"
WHITE = "#FFFFFF"
MUTED = "#D1FAE5"
ACCENT = "#FEF3C7"
VOICE = "es-CU-BelkysNeural"
FPS = 30
PAUSE_BETWEEN_SCENES = 0.35

NARRATION = [
    "¿Sabes cuánto te cuesta lo que vendes? Muchos negocios pequeños pierden dinero sin darse cuenta.",
    "¿Te suena familiar? Compras insumos y no sabes el costo real. Pones precios a ojo. Se acaba el stock y no te diste cuenta. Al final del mes no sabes si ganaste.",
    "Conoce Costify. Costos, precios e inventario para tu negocio. La app para calcular costos, fijar precios y controlar inventario.",
    "Todo en un solo lugar. Costos reales, precios con ganancia e inventario. Pensada para negocios pequeños en Cuba.",
    "Funciona sin internet. Registra tus datos en el celular y sigue trabajando aunque falle la conexión.",
    "Deja de adivinar precios. Empieza a controlar tu negocio. Descarga Costify hoy.",
]


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

    paste_icon(img, 150, 110)

    brand_font = load_font(68, bold=True)
    sub_font = load_font(30)
    body_font = load_font(32, bold=True)

    draw_centered_block(draw, ["Costify"], brand_font, 340)

    tagline = wrap_text(draw, "Costos, precios e inventario para tu negocio", sub_font, 880)
    draw_centered_block(draw, tagline, sub_font, 430, fill=MUTED)

    body_lines = wrap_text(
        draw,
        "La app para calcular costos, fijar precios y controlar inventario.",
        body_font,
        860,
    )
    line_gap = 12
    line_height = body_font.size + line_gap
    card_h = max(170, len(body_lines) * line_height + 48)
    card_y = 540

    rounded_rect(draw, (70, card_y, 1010, card_y + card_h), 24, WHITE)
    draw_centered_block(draw, body_lines, body_font, card_y + card_h // 2, fill=BRAND_DARK, line_gap=line_gap)
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
        wrap_text(draw, "Registra tus datos en el celular y sigue trabajando aunque falle la conexión.", body_font, 880),
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


SLIDE_BUILDERS = [
    slide_hook,
    slide_problem,
    slide_intro,
    slide_features,
    slide_offline,
    slide_cta,
]


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


async def generate_narration_clips() -> list[Path]:
    audio_dir = OUT_DIR / "audio"
    audio_dir.mkdir(exist_ok=True)
    paths: list[Path] = []

    for idx, text in enumerate(NARRATION, start=1):
        out = audio_dir / f"narration_{idx:02d}.mp3"
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(str(out))
        paths.append(out)
        print(f"Generated narration {out.name} ({wav_duration_mp3(out):.1f}s)")
    return paths


def wav_duration_mp3(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def save_slides(durations: list[float]) -> list[tuple[Path, float]]:
    frames_dir = OUT_DIR / "frames"
    frames_dir.mkdir(exist_ok=True)

    manifest: list[tuple[Path, float]] = []
    for idx, (builder, duration) in enumerate(zip(SLIDE_BUILDERS, durations), start=1):
        path = frames_dir / f"slide_{idx:02d}.png"
        builder().save(path, "PNG")
        manifest.append((path, duration))
        print(f"Saved {path} ({duration:.1f}s)")
    return manifest


def build_silent_video(manifest: list[tuple[Path, float]], output: Path) -> None:
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
        "-an",
        str(output),
    ]
    subprocess.run(cmd, check=True)


def build_audio_track(audio_clips: list[Path], durations: list[float], output: Path) -> None:
    parts_dir = OUT_DIR / "audio_parts"
    parts_dir.mkdir(exist_ok=True)
    part_files: list[Path] = []

    for idx, (clip, duration) in enumerate(zip(audio_clips, durations)):
        padded = parts_dir / f"part_{idx:02d}.wav"
        silence = duration - wav_duration_mp3(clip)
        if silence < 0:
            silence = 0.1

        filter_complex = (
            f"[0:a]apad=pad_dur={silence:.3f},atrim=0:{duration:.3f}[a]"
        )
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(clip),
                "-filter_complex",
                filter_complex,
                "-map",
                "[a]",
                "-ar",
                "44100",
                "-ac",
                "2",
                str(padded),
            ],
            check=True,
            capture_output=True,
        )
        part_files.append(padded)

    concat_list = OUT_DIR / "audio_concat.txt"
    concat_list.write_text("\n".join(f"file '{p}'" for p in part_files) + "\n")

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(output),
        ],
        check=True,
    )


def mux_video_audio(video: Path, audio: Path, output: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(output),
        ],
        check=True,
    )


async def main() -> None:
    audio_clips = await generate_narration_clips()

    durations = [
        max(3.5, wav_duration_mp3(clip) + PAUSE_BETWEEN_SCENES)
        for clip in audio_clips
    ]

    manifest = save_slides(durations)

    silent_video = OUT_DIR / "video_silent.mp4"
    build_silent_video(manifest, silent_video)

    audio_track = OUT_DIR / "narration.m4a"
    build_audio_track(audio_clips, durations, audio_track)

    output = OUT_DIR / "costify-promo-facebook.mp4"
    mux_video_audio(silent_video, audio_track, output)

    final_copy = Path("/opt/cursor/artifacts/costify-promo-facebook.mp4")
    subprocess.run(["cp", str(output), str(final_copy)], check=True)
    print(f"\nVideo ready: {output}")
    print(f"Copied to: {final_copy}")


if __name__ == "__main__":
    asyncio.run(main())
