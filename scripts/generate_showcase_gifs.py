import os
import sys
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Constants
WIDTH = 760
HEIGHT = 450
DOCS_ASSETS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "assets")
os.makedirs(DOCS_ASSETS, exist_ok=True)

# Load Fonts
def get_font(size, bold=False):
    font_name = "segoeuib.ttf" if bold else "segoeui.ttf"
    try:
        return ImageFont.truetype(font_name, size)
    except Exception:
        try:
            return ImageFont.truetype("arial.ttf", size)
        except Exception:
            return ImageFont.load_default()

FONT_SM = get_font(10)
FONT_BOLD_SM = get_font(10, bold=True)
FONT_MD = get_font(12)
FONT_BOLD_MD = get_font(12, bold=True)
FONT_LG = get_font(14, bold=True)

# Load Wallpaper
WP_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "wallpaper.png")
if os.path.exists(WP_PATH):
    try:
        raw_wp = Image.open(WP_PATH).convert("RGBA")
        WALLPAPER_BASE = raw_wp.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        darken = Image.new("RGBA", (WIDTH, HEIGHT), (10, 15, 26, 95))
        WALLPAPER_BASE = Image.alpha_composite(WALLPAPER_BASE, darken)
    except Exception:
        WALLPAPER_BASE = None
else:
    WALLPAPER_BASE = None

def get_base_canvas():
    if WALLPAPER_BASE:
        return WALLPAPER_BASE.copy()
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (15, 23, 42, 255))
    draw = ImageDraw.Draw(canvas)
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(15 + ratio * 10)
        g = int(23 + ratio * 15)
        b = int(42 + ratio * 20)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))
    return canvas

def draw_cursor(draw, x, y, clicking=False):
    fill_color = (200, 240, 255, 255) if clicking else (245, 245, 245, 255)
    border_color = (15, 23, 42, 255)
    poly = [
        (x, y),
        (x, y + 15),
        (x + 4, y + 12),
        (x + 8, y + 19),
        (x + 11, y + 18),
        (x + 7, y + 11),
        (x + 12, y + 11),
    ]
    draw.polygon(poly, fill=fill_color, outline=border_color)

def draw_hud(draw, img, x, y, state_text="Dolaşma", display_text="Ekran 2", files_text="48/51"):
    pill_w = 400
    pill_h = 36
    px = x - pill_w // 2
    py = y
    
    hud_bg = Image.new("RGBA", (pill_w, pill_h), (15, 23, 42, 225))
    hud_draw = ImageDraw.Draw(hud_bg)
    hud_draw.rounded_rectangle([0, 0, pill_w - 1, pill_h - 1], radius=14, outline=(255, 255, 255, 55), width=1)
    img.alpha_composite(hud_bg, (px, py))
    
    for r in range(3):
        for c in range(2):
            draw.ellipse([px + 10 + c * 3, py + 12 + r * 4, px + 12 + c * 3, py + 14 + r * 4], fill=(148, 163, 184, 180))
            
    draw.ellipse([px + 24, py + 9, px + 40, py + 25], fill=(6, 182, 212, 230), outline=(255, 255, 255, 120))
    draw.text((px + 46, py + 10), "Cleanfy", font=FONT_BOLD_MD, fill=(255, 255, 255, 255))
    
    st_color = (16, 185, 129, 200) if state_text == "Dolaşma" else (6, 182, 212, 220)
    draw.rounded_rectangle([px + 102, py + 8, px + 158, py + 26], radius=7, fill=st_color)
    draw.text((px + 110, py + 10), state_text, font=FONT_SM, fill=(255, 255, 255, 255))
    
    draw.rounded_rectangle([px + 164, py + 8, px + 220, py + 26], radius=7, fill=(30, 41, 59, 220), outline=(255, 255, 255, 40))
    draw.text((px + 172, py + 10), display_text, font=FONT_SM, fill=(148, 163, 184, 255))
    
    draw.rounded_rectangle([px + 226, py + 8, px + 264, py + 26], radius=7, fill=(30, 41, 59, 220), outline=(255, 255, 255, 40))
    draw.text((px + 233, py + 10), "Tara", font=FONT_SM, fill=(203, 213, 225, 255))
    
    draw.rounded_rectangle([px + 270, py + 8, px + 318, py + 26], radius=7, fill=(37, 99, 235, 220))
    draw.text((px + 278, py + 10), "Başlat", font=FONT_SM, fill=(255, 255, 255, 255))
    
    draw.rounded_rectangle([px + 324, py + 8, px + 388, py + 26], radius=7, fill=(15, 23, 42, 190), outline=(6, 182, 212, 80))
    draw.text((px + 332, py + 10), files_text, font=FONT_BOLD_SM, fill=(56, 189, 248, 255))

def draw_desktop_icon(draw, img, x, y, name, icon_type='game', selected=False):
    tile_w, tile_h = 42, 42
    tx = x - tile_w // 2
    ty = y - tile_h // 2
    
    colors = {
        'game': (168, 85, 247, 230),
        'folder': (245, 158, 11, 230),
        'doc': (59, 130, 246, 230),
        'code': (16, 185, 129, 230),
        'zip': (236, 72, 153, 230),
    }
    glyph_bg = colors.get(icon_type, (100, 116, 139, 220))
    
    if selected:
        draw.rounded_rectangle([tx - 4, ty - 4, tx + tile_w + 3, ty + tile_h + 3], radius=10, fill=(6, 182, 212, 60), outline=(56, 189, 248, 230), width=2)
    else:
        draw.rounded_rectangle([tx, ty, tx + tile_w - 1, ty + tile_h - 1], radius=8, fill=(15, 23, 42, 180), outline=(255, 255, 255, 30), width=1)
    
    draw.rounded_rectangle([tx + 7, ty + 7, tx + tile_w - 8, ty + tile_h - 8], radius=6, fill=glyph_bg)
    
    symbol = "G" if icon_type == 'game' else "F" if icon_type == 'folder' else "D" if icon_type == 'doc' else "C" if icon_type == 'code' else "Z"
    draw.text((tx + 14, ty + 12), symbol, font=FONT_BOLD_SM, fill=(255, 255, 255, 255))
    
    text_bbox = FONT_SM.getbbox(name)
    tw = text_bbox[2] - text_bbox[0]
    lbl_x = x - tw // 2
    lbl_y = ty + tile_h + 2
    
    draw.rounded_rectangle([lbl_x - 3, lbl_y - 1, lbl_x + tw + 3, lbl_y + 13], radius=3, fill=(10, 15, 26, 210))
    draw.text((lbl_x, lbl_y), name, font=FONT_SM, fill=(241, 245, 249, 255))

def draw_robot(draw, img, rx, ry, ra, lidar_a, brush_a, bumper=0.0):
    R = 34
    cone_len = 120
    sweep_angle = 0.35
    poly_cone = [(rx, ry)]
    steps = 14
    for i in range(steps + 1):
        ang = ra - sweep_angle + (2 * sweep_angle) * (i / steps)
        px = rx + math.cos(ang) * cone_len
        py = ry + math.sin(ang) * cone_len
        poly_cone.append((px, py))
    
    cone_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    cone_draw = ImageDraw.Draw(cone_layer)
    cone_draw.polygon(poly_cone, fill=(56, 189, 248, 38))
    for i in range(steps):
        a1 = ra - sweep_angle + (2 * sweep_angle) * (i / steps)
        a2 = ra - sweep_angle + (2 * sweep_angle) * ((i + 1) / steps)
        cone_draw.line([(rx + math.cos(a1) * cone_len, ry + math.sin(a1) * cone_len),
                        (rx + math.cos(a2) * cone_len, ry + math.sin(a2) * cone_len)],
                       fill=(56, 189, 248, 120), width=2)
    img.alpha_composite(cone_layer)
    
    def draw_brush(bx, by, dir_mult):
        for arm in range(3):
            arm_a = brush_a * dir_mult + (arm * math.pi * 2 / 3)
            ax = bx + math.cos(arm_a) * 9
            ay = by + math.sin(arm_a) * 9
            draw.line([(bx, by), (ax, ay)], fill=(226, 232, 240, 230), width=2)
            for br in range(-1, 2):
                br_a = arm_a + br * 0.35
                draw.line([(ax, ay), (ax + math.cos(br_a) * 4, ay + math.sin(br_a) * 4)], fill=(203, 213, 225, 200), width=1)
        draw.ellipse([bx - 2, by - 2, bx + 2, by + 2], fill=(148, 163, 184, 255))
    
    b1_x = rx + math.cos(ra + 0.6) * (R - 5)
    b1_y = ry + math.sin(ra + 0.6) * (R - 5)
    b2_x = rx + math.cos(ra - 0.6) * (R - 5)
    b2_y = ry + math.sin(ra - 0.6) * (R - 5)
    draw_brush(b1_x, b1_y, 1)
    draw_brush(b2_x, b2_y, -1)
    
    draw.ellipse([rx - R + 2, ry - R + 4, rx + R + 2, ry + R + 4], fill=(0, 0, 0, 110))
    draw.ellipse([rx - R, ry - R, rx + R, ry + R], fill=(248, 250, 252, 255), outline=(148, 163, 184, 255), width=2)
    draw.ellipse([rx - R + 3, ry - R + 3, rx + R - 3, ry + R - 3], fill=(241, 245, 249, 255), outline=(226, 232, 240, 255), width=1)
    
    b_color = (252, 165, 165, 255) if bumper > 0.1 else (156, 163, 175, 230)
    for off in range(-1, 2):
        draw.arc([rx - R + off, ry - R + off, rx + R - off, ry + R - off],
                 start=int(math.degrees(ra - 1.1)), end=int(math.degrees(ra + 1.1)), fill=b_color, width=2)
                 
    btn_x = rx + math.cos(ra) * 12
    btn_y = ry + math.sin(ra) * 12
    draw.rounded_rectangle([btn_x - 10, btn_y - 6, btn_x + 10, btn_y + 6], radius=4, fill=(226, 232, 240, 255), outline=(203, 213, 225, 255))
    draw.ellipse([btn_x - 3, btn_y - 3, btn_x + 3, btn_y + 3], fill=(6, 182, 212, 255))
    
    tR = 11
    draw.ellipse([rx - tR + 1, ry - tR + 2, rx + tR + 1, ry + tR + 2], fill=(0, 0, 0, 90))
    draw.ellipse([rx - tR, ry - tR, rx + tR, ry + tR], fill=(255, 255, 255, 255), outline=(203, 213, 225, 255), width=1)
    draw.ellipse([rx - tR + 3, ry - tR + 3, rx + tR - 3, ry + tR - 3], fill=(30, 41, 59, 255))
    draw.ellipse([rx - tR + 5, ry - tR + 5, rx + tR - 5, ry + tR - 5], fill=(248, 250, 252, 255))
    lx = rx + math.cos(lidar_a) * 4
    ly = ry + math.sin(lidar_a) * 4
    draw.ellipse([lx - 1.5, ly - 1.5, lx + 1.5, ly + 1.5], fill=(59, 130, 246, 255))

# ==============================================================================
# 1. ANIMATION: HERO PHYSICS & LIDAR (1-hero-physics-demo.gif)
# ==============================================================================
def generate_hero_physics_gif():
    output_path = os.path.join(DOCS_ASSETS, "1-hero-physics-demo.gif")
    print(f"[*] 1/4 Üretiliyor: {output_path}")
    
    frames = []
    total_frames = 44
    
    # Static desktop icons
    left_icons = [
        ("Projeler", 60, 80, 'folder'),
        ("Belgeler.docx", 60, 160, 'doc'),
        ("Kodlar", 60, 240, 'folder'),
        ("main.py", 60, 320, 'code'),
    ]
    right_icons = [
        ("Cyberpunk 2077", 650, 120, 'game'),
        ("VALORANT", 650, 200, 'game'),
        ("Stardew Valley", 650, 280, 'game'),
        ("Arşiv.zip", 650, 360, 'zip'),
    ]
    
    # Dynamic target icon that gets physically bumped
    target_start_x, target_start_y = 360, 220
    target_curr_x, target_curr_y = target_start_x, target_start_y
    
    dust_particles = []
    
    for f in range(total_frames):
        img = get_base_canvas()
        draw = ImageDraw.Draw(img)
        
        # Draw HUD Dock at top
        draw_hud(draw, img, 380, 16, state_text="Dolaşma", display_text="Ekran 2", files_text="48/51")
        
        # Draw static icons
        for name, ix, iy, itype in left_icons:
            draw_desktop_icon(draw, img, ix, iy, name, itype)
        for name, ix, iy, itype in right_icons:
            draw_desktop_icon(draw, img, ix, iy, name, itype)
            
        # Robot Path Animation
        t = f / float(total_frames)
        # Phase 1: moving towards target (frames 0..18)
        # Phase 2: collision & bump (frames 18..24)
        # Phase 3: veering off towards right (frames 24..44)
        if f <= 18:
            prog = f / 18.0
            rx = 180 + prog * (325 - 180)
            ry = 340 - prog * (340 - 235)
            ra = -0.55
            bumper = 0.0
        elif f <= 24:
            prog = (f - 18) / 6.0
            rx = 325 + prog * 20
            ry = 235 - prog * 10
            ra = -0.55 + prog * 0.4
            bumper = 1.0 - prog * 0.4
            # Physics Bump target
            target_curr_x = target_start_x + prog * 65
            target_curr_y = target_start_y - prog * 35
        else:
            prog = (f - 24) / 20.0
            rx = 345 + prog * 180
            ry = 225 + prog * 40
            ra = -0.15 + prog * 0.35
            bumper = 0.0
            # Target damping glide
            target_curr_x = target_start_x + 65 + prog * 15
            target_curr_y = target_start_y - 35 - prog * 8
            
        lidar_a = f * 0.32
        brush_a = f * 0.55
        
        # Trailing dust motes
        if f % 2 == 0:
            dust_particles.append([rx - math.cos(ra) * 36 + random.randint(-4, 4),
                                   ry - math.sin(ra) * 36 + random.randint(-4, 4),
                                   random.randint(6, 12)])
        
        # Draw dust
        for p in dust_particles:
            p[2] -= 1
            if p[2] > 0:
                draw.ellipse([p[0] - 1.5, p[1] - 1.5, p[0] + 1.5, p[1] + 1.5], fill=(203, 213, 225, 140))
        dust_particles = [p for p in dust_particles if p[2] > 0]
        
        # Draw target icon
        draw_desktop_icon(draw, img, int(target_curr_x), int(target_curr_y), "Rapor.pdf", 'doc', selected=(f >= 18 and f <= 26))
        
        # Draw Robot
        draw_robot(draw, img, rx, ry, ra, lidar_a, brush_a, bumper)
        
        # Convert to 256 color palette
        p_img = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        frames.append(p_img)
        
    frames[0].save(output_path, save_all=True, append_images=frames[1:], duration=55, loop=0, optimize=True)
    mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[OK] 1/4 Tamamlandı: {output_path} ({mb:.2f} MB)")

# ==============================================================================
# 2. ANIMATION: SELECTION BOX & ZONE ORGANIZER (2-selection-box-zones.gif)
# ==============================================================================
def generate_selection_box_gif():
    output_path = os.path.join(DOCS_ASSETS, "2-selection-box-zones.gif")
    print(f"[*] 2/4 Üretiliyor: {output_path}")
    
    frames = []
    total_frames = 50
    
    # 5 games to be organized
    scattered_games = [
        ("Cyberpunk 2077", 470, 160),
        ("VALORANT", 620, 170),
        ("Pro Soccer", 490, 260),
        ("Stardew Valley", 630, 270),
        ("BlokOyun", 550, 370),
    ]
    
    # Target slots inside selection box
    # Box bounds: x: 440, y: 110, w: 260, h: 290
    final_slots = [
        ("Cyberpunk 2077", 495, 175),
        ("VALORANT", 575, 175),
        ("Pro Soccer", 655, 175),
        ("Stardew Valley", 535, 275),
        ("BlokOyun", 615, 275),
    ]
    
    for f in range(total_frames):
        img = get_base_canvas()
        draw = ImageDraw.Draw(img)
        
        # HUD Dock
        draw_hud(draw, img, 380, 16, state_text="Düzenleme" if f >= 32 else "Dolaşma", display_text="Ekran 2", files_text="48/51")
        
        # Left static icons
        draw_desktop_icon(draw, img, 60, 80, "Projeler", 'folder')
        draw_desktop_icon(draw, img, 60, 160, "Rapor.pdf", 'doc')
        draw_desktop_icon(draw, img, 60, 240, "Kodlar", 'folder')
        
        # Phase 1: Drawing Selection Box (frames 0..16)
        # Phase 2: Dialog Modal Popup & Click (frames 17..32)
        # Phase 3: Gliding into Box Grid (frames 33..50)
        
        # Calculate box size
        if f <= 16:
            prog = f / 16.0
            bx = 440
            by = 110
            bw = int(prog * 260)
            bh = int(prog * 290)
            cur_x = bx + bw
            cur_y = by + bh
            clicking = True
        else:
            bx, by, bw, bh = 440, 110, 260, 290
            cur_x = 340
            cur_y = 285
            clicking = (f >= 28 and f <= 32)
            
        # Draw Selection Box
        if bw > 15 and bh > 15:
            box_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            box_draw = ImageDraw.Draw(box_layer)
            # Semi-transparent cyan fill
            box_draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=14, fill=(6, 182, 212, 28), outline=(6, 182, 212, 230), width=2)
            
            # Corner Handles
            for hx, hy in [(bx, by), (bx + bw, by), (bx, by + bh), (bx + bw, by + bh)]:
                box_draw.rectangle([hx - 3, hy - 3, hx + 3, hy + 3], fill=(56, 189, 248, 255), outline=(15, 23, 42, 255))
                
            # Top Badge
            badge_text = f"1. Alan (Cyan Mavi): {bw} × {bh} px" if f < 32 else "🎯 1. Oyunlar (5 dosya)"
            badge_color = (6, 182, 212, 230) if f < 32 else (16, 185, 129, 230)
            box_draw.rounded_rectangle([bx + 12, by - 12, bx + 195, by + 8], radius=6, fill=badge_color)
            box_draw.text((bx + 18, by - 10), badge_text, font=FONT_BOLD_SM, fill=(255, 255, 255, 255))
            
            img.alpha_composite(box_layer)
            
        # Draw Games (either scattered, or smoothly gliding into box)
        for idx in range(len(scattered_games)):
            g_name = scattered_games[idx][0]
            sx, sy = scattered_games[idx][1], scattered_games[idx][2]
            tx, ty = final_slots[idx][1], final_slots[idx][2]
            
            if f < 32:
                gx, gy = sx, sy
                is_selected = (f >= 16)
            else:
                glide_p = min(1.0, (f - 32) / 12.0)
                # Ease out quad
                ease = 1 - (1 - glide_p) * (1 - glide_p)
                gx = int(sx + ease * (tx - sx))
                gy = int(sy + ease * (ty - sy))
                is_selected = True
                
            draw_desktop_icon(draw, img, gx, gy, g_name, 'game', selected=is_selected)
            
        # Draw Glassmorphism Dialog Popup (frames 16..32)
        if 16 <= f <= 32:
            dlg_w, dlg_h = 240, 160
            dx, dy = 180, 160
            dlg_bg = Image.new("RGBA", (dlg_w, dlg_h), (15, 23, 42, 240))
            dlg_draw = ImageDraw.Draw(dlg_bg)
            dlg_draw.rounded_rectangle([0, 0, dlg_w - 1, dlg_h - 1], radius=12, fill=(15, 23, 42, 230), outline=(6, 182, 212, 120), width=1)
            
            # Dialog Header
            dlg_draw.text((12, 10), "✨ 1. Alan İsteği (Cyan Mavi)", font=FONT_BOLD_SM, fill=(56, 189, 248, 255))
            dlg_draw.text((12, 26), "Bu alana eklenecek dosyalar plana kaydedilir", font=FONT_SM, fill=(148, 163, 184, 255))
            
            # Input Box
            dlg_draw.rounded_rectangle([12, 44, dlg_w - 12, 68], radius=6, fill=(10, 15, 26, 255), outline=(6, 182, 212, 180), width=1)
            dlg_draw.text((18, 50), "Buraya sadece oyunları koy", font=FONT_SM, fill=(255, 255, 255, 255))
            
            # Preset Pill
            dlg_draw.rounded_rectangle([12, 74, 110, 94], radius=5, fill=(6, 182, 212, 40), outline=(6, 182, 212, 140))
            dlg_draw.text((18, 78), "🎮 Sadece Oyunlar", font=FONT_SM, fill=(56, 189, 248, 255))
            
            # Counter Info
            dlg_draw.rounded_rectangle([12, 100, dlg_w - 12, 120], radius=5, fill=(255, 255, 255, 12))
            dlg_draw.text((16, 104), "Kategori: Oyunlar • 5 öğe bulundu", font=FONT_SM, fill=(203, 213, 225, 255))
            
            # Submit Button
            btn_col = (16, 185, 129, 240) if f >= 28 else (37, 99, 235, 240)
            dlg_draw.rounded_rectangle([12, 126, dlg_w - 12, 150], radius=6, fill=btn_col)
            dlg_draw.text((45, 131), "+ Bu Alanı Plana Ekle (5)", font=FONT_BOLD_SM, fill=(255, 255, 255, 255))
            
            img.alpha_composite(dlg_bg, (dx, dy))
            
        # Top overlay confirmation banner when plan added (frames 33..50)
        if f > 32:
            conf_w = 260
            cx = WIDTH // 2 - conf_w // 2
            draw.rounded_rectangle([cx, 58, cx + conf_w, 88], radius=8, fill=(15, 23, 42, 230), outline=(16, 185, 129, 180), width=1)
            draw.text((cx + 12, 65), "🎯 Plan Hazır: Planı Onayla & Diz", font=FONT_BOLD_SM, fill=(52, 211, 153, 255))
            
        # Draw Cursor
        draw_cursor(draw, cur_x, cur_y, clicking=clicking)
        
        p_img = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        frames.append(p_img)
        
    frames[0].save(output_path, save_all=True, append_images=frames[1:], duration=60, loop=0, optimize=True)
    mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[OK] 2/4 Tamamlandı: {output_path} ({mb:.2f} MB)")

# ==============================================================================
# 3. ANIMATION: MULTI-SCREEN & HUD DRAG (3-multi-screen-hud.gif)
# ==============================================================================
def generate_multi_screen_hud_gif():
    output_path = os.path.join(DOCS_ASSETS, "3-multi-screen-hud.gif")
    print(f"[*] 3/4 Üretiliyor: {output_path}")
    
    frames = []
    total_frames = 40
    
    for f in range(total_frames):
        img = get_base_canvas()
        draw = ImageDraw.Draw(img)
        
        # Desktop Icons
        draw_desktop_icon(draw, img, 70, 90, "Belgeler", 'folder')
        draw_desktop_icon(draw, img, 70, 180, "Rapor.pdf", 'doc')
        draw_desktop_icon(draw, img, 650, 120, "Oyunlar", 'folder')
        draw_desktop_icon(draw, img, 650, 210, "VALORANT", 'game')
        
        # Phase 1: Dragging HUD (frames 0..18)
        # HUD moves from x=380, y=16 to x=430, y=55
        if f <= 18:
            prog = f / 18.0
            ease = prog * prog * (3 - 2 * prog)
            hud_x = int(380 + ease * 60)
            hud_y = int(16 + ease * 45)
            cur_x = hud_x - 180
            cur_y = hud_y + 18
            clicking = True
            show_dropdown = False
            cur_screen = "Ekran 2"
        # Phase 2: Opening Monitor Selector Dropdown (frames 19..40)
        else:
            hud_x = 440
            hud_y = 61
            clicking = (f >= 34 and f <= 37)
            prog = (f - 19) / 21.0
            cur_x = hud_x + int(-40 + prog * 10)
            cur_y = hud_y + int(30 + prog * 50)
            show_dropdown = True
            cur_screen = "Ekran 3" if f >= 35 else "Ekran 2"
            
        # Draw HUD Dock
        draw_hud(draw, img, hud_x, hud_y, state_text="Dolaşma", display_text=cur_screen, files_text="50 Öğe")
        
        # Draw Screen Selector Modal Dropdown
        if show_dropdown:
            drop_w, drop_h = 240, 110
            dx = hud_x - 120
            dy = hud_y + 44
            
            drop_bg = Image.new("RGBA", (drop_w, drop_h), (15, 23, 42, 245))
            drop_draw = ImageDraw.Draw(drop_bg)
            drop_draw.rounded_rectangle([0, 0, drop_w - 1, drop_h - 1], radius=10, fill=(15, 23, 42, 235), outline=(255, 255, 255, 45), width=1)
            
            screens = [
                ("🖥️ Ekran 1: Sol Monitör (1536×864)", False),
                ("🖥️ Ekran 2: Orta Monitör [Ana] (1920×1080)", f < 35),
                ("🖥️ Ekran 3: Sağ Monitör (1920×1080)", f >= 35),
            ]
            
            for s_idx, (s_label, s_active) in enumerate(screens):
                sy = 10 + s_idx * 30
                fill_c = (6, 182, 212, 45) if s_active else (255, 255, 255, 8)
                text_c = (56, 189, 248, 255) if s_active else (203, 213, 225, 255)
                drop_draw.rounded_rectangle([8, sy, drop_w - 8, sy + 25], radius=6, fill=fill_c)
                drop_draw.text((14, sy + 5), s_label, font=FONT_SM, fill=text_c)
                
            img.alpha_composite(drop_bg, (dx, dy))
            
        # Draw Cursor
        draw_cursor(draw, cur_x, cur_y, clicking=clicking)
        
        p_img = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        frames.append(p_img)
        
    frames[0].save(output_path, save_all=True, append_images=frames[1:], duration=60, loop=0, optimize=True)
    mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[OK] 3/4 Tamamlandı: {output_path} ({mb:.2f} MB)")

# ==============================================================================
# 4. ANIMATION: PREVIEW PLAN & SAFE UNDO (4-preview-plan-undo.gif)
# ==============================================================================
def generate_preview_plan_undo_gif():
    output_path = os.path.join(DOCS_ASSETS, "4-preview-plan-undo.gif")
    print(f"[*] 4/4 Üretiliyor: {output_path}")
    
    frames = []
    total_frames = 44
    
    for f in range(total_frames):
        img = get_base_canvas()
        draw = ImageDraw.Draw(img)
        
        # HUD Dock
        draw_hud(draw, img, 380, 16, state_text="Tamamlama" if f >= 30 else "Dolaşma", display_text="Ekran 2", files_text="48/51")
        
        # Left static icons
        draw_desktop_icon(draw, img, 60, 80, "Projeler", 'folder')
        draw_desktop_icon(draw, img, 60, 160, "Rapor.pdf", 'doc')
        draw_desktop_icon(draw, img, 650, 120, "Oyunlar", 'folder')
        
        # Phase 1: Preview Modal Open (frames 0..28)
        # Phase 2: Confirmation & Celebration / Undo Toast (frames 29..44)
        if f <= 28:
            mw, mh = 480, 290
            mx = WIDTH // 2 - mw // 2
            my = HEIGHT // 2 - mh // 2 + 10
            
            modal_bg = Image.new("RGBA", (mw, mh), (15, 23, 42, 248))
            modal_draw = ImageDraw.Draw(modal_bg)
            modal_draw.rounded_rectangle([0, 0, mw - 1, mh - 1], radius=16, fill=(15, 23, 42, 240), outline=(255, 255, 255, 50), width=1)
            
            # Modal Header
            modal_draw.text((20, 16), "📁 Masaüstü Düzenleme Planı ve Önizleme", font=FONT_BOLD_MD, fill=(255, 255, 255, 255))
            modal_draw.text((20, 36), "Dosyaları inceleyin; onayladığınızda düzenleme gerçekleştirilir.", font=FONT_SM, fill=(148, 163, 184, 255))
            
            # Active Zone Plan Banner
            modal_draw.rounded_rectangle([20, 56, mw - 20, 88], radius=8, fill=(6, 182, 212, 35), outline=(6, 182, 212, 120), width=1)
            modal_draw.text((30, 62), "🎯 Özel Alan Planı: Oyunlar (13 dosya) • Belgeler (5 dosya)", font=FONT_BOLD_SM, fill=(56, 189, 248, 255))
            modal_draw.text((30, 74), "Onayladığınızda simgeler belirlediğiniz alanlara nizami dizilir.", font=FONT_SM, fill=(203, 213, 225, 255))
            
            # Table Header
            modal_draw.rounded_rectangle([20, 96, mw - 20, 120], radius=6, fill=(30, 41, 59, 180))
            modal_draw.text((30, 102), "Dosya Adı", font=FONT_BOLD_SM, fill=(148, 163, 184, 255))
            modal_draw.text((200, 102), "Boyut", font=FONT_BOLD_SM, fill=(148, 163, 184, 255))
            modal_draw.text((280, 102), "Kategori / Hedef Alan", font=FONT_BOLD_SM, fill=(148, 163, 184, 255))
            
            # Table Rows
            table_rows = [
                ("[x] Cyberpunk 2077.url", "2.4 KB", "🎮 Oyunlar"),
                ("[x] VALORANT.lnk", "1.8 KB", "🎮 Oyunlar"),
                ("[x] Stardew Valley.url", "2.1 KB", "🎮 Oyunlar"),
                ("[x] Proje_Raporu.docx", "450 KB", "📄 Belgeler"),
            ]
            for r_idx, (r_name, r_sz, r_target) in enumerate(table_rows):
                ry = 126 + r_idx * 24
                modal_draw.text((30, ry), r_name, font=FONT_SM, fill=(241, 245, 249, 255))
                modal_draw.text((200, ry), r_sz, font=FONT_SM, fill=(148, 163, 184, 255))
                modal_draw.text((280, ry), r_target, font=FONT_BOLD_SM, fill=(56, 189, 248, 255))
                modal_draw.line([(20, ry + 20), (mw - 20, ry + 20)], fill=(255, 255, 255, 15))
                
            # Bottom Buttons
            modal_draw.rounded_rectangle([20, 246, 90, 274], radius=8, fill=(30, 41, 59, 220))
            modal_draw.text((38, 253), "Kapat", font=FONT_SM, fill=(203, 213, 225, 255))
            
            btn_col = (16, 185, 129, 240) if f < 24 else (5, 150, 105, 255)
            modal_draw.rounded_rectangle([mw - 230, 246, mw - 20, 274], radius=8, fill=btn_col)
            modal_draw.text((mw - 215, 253), "▶ Planı Onayla ve Alanlara Diz", font=FONT_BOLD_SM, fill=(255, 255, 255, 255))
            
            img.alpha_composite(modal_bg, (mx, my))
            
            cur_x = mx + mw - 120
            cur_y = my + 260
            clicking = (f >= 22 and f <= 26)
            draw_cursor(draw, cur_x, cur_y, clicking=clicking)
            
        else:
            # Celebration & Undo Toast
            tw, th = 340, 110
            tx = WIDTH // 2 - tw // 2
            ty = HEIGHT // 2 - th // 2
            
            toast_bg = Image.new("RGBA", (tw, th), (15, 23, 42, 245))
            toast_draw = ImageDraw.Draw(toast_bg)
            toast_draw.rounded_rectangle([0, 0, tw - 1, th - 1], radius=14, fill=(15, 23, 42, 240), outline=(16, 185, 129, 180), width=2)
            
            toast_draw.text((20, 18), "🎉 Harika! Masaüstünüz Düzenlendi", font=FONT_BOLD_MD, fill=(52, 211, 153, 255))
            toast_draw.text((20, 38), "18 dosya başarıyla alanlara yerleştirildi.", font=FONT_SM, fill=(203, 213, 225, 255))
            
            # Geri Al Button
            toast_draw.rounded_rectangle([20, 64, 150, 92], radius=7, fill=(245, 158, 11, 230))
            toast_draw.text((32, 71), "↩️ Geri Al (Undo)", font=FONT_BOLD_SM, fill=(255, 255, 255, 255))
            
            toast_draw.rounded_rectangle([160, 64, 250, 92], radius=7, fill=(30, 41, 59, 220))
            toast_draw.text((182, 71), "Raporu Aç", font=FONT_SM, fill=(203, 213, 225, 255))
            
            img.alpha_composite(toast_bg, (tx, ty))
            
        p_img = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        frames.append(p_img)
        
    frames[0].save(output_path, save_all=True, append_images=frames[1:], duration=60, loop=0, optimize=True)
    mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[OK] 4/4 Tamamlandı: {output_path} ({mb:.2f} MB)")

if __name__ == "__main__":
    print("🚀 Cleanfy GitHub Showcase GIF Üreticisi Başlatılıyor...")
    generate_hero_physics_gif()
    generate_selection_box_gif()
    generate_multi_screen_hud_gif()
    generate_preview_plan_undo_gif()
    print("🎉 Tüm 4 GIF başarıyla docs/assets/ içine kaydedildi!")
