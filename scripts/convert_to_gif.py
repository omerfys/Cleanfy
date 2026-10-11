import os
import sys
import glob

# UTF-8 stdout encoding for Windows console compatibility
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from PIL import Image
import imageio.v3 as iio

def convert_video_to_gif(video_path, output_path=None, max_width=960, fps=16):
    """
    Converts an MP4/WebM video into an optimized GIF for GitHub documentation.
    """
    if not os.path.exists(video_path):
        print(f"[HATA] Dosya bulunamadi: {video_path}")
        return False

    if output_path is None:
        base, _ = os.path.splitext(video_path)
        output_path = base + ".gif"

    print(f"[*] Video okunuyor: {video_path}")
    try:
        frames_iter = iio.imiter(video_path)
    except Exception as e:
        print(f"[HATA] Video okunamadi: {e}")
        return False

    processed_frames = []
    frame_count = 0

    for idx, frame in enumerate(frames_iter):
        frame_count += 1
        img = Image.fromarray(frame)
        
        # Yeniden boyutlandirma (En-Boy oranini koruyarak)
        if max_width and img.width > max_width:
            w_percent = max_width / float(img.width)
            h_size = int(float(img.height) * float(w_percent))
            img = img.resize((max_width, h_size), Image.Resampling.LANCZOS)
        
        # 256 renk paletine optimize donusturme (Dithering ile)
        img_p = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        processed_frames.append(img_p)

    if not processed_frames:
        print("[HATA] Islenecek kare bulunamadi.")
        return False

    print(f"[*] {len(processed_frames)} kare islendi. GIF kaydediliyor: {output_path}")
    duration = int(1000 / fps)

    processed_frames[0].save(
        output_path,
        save_all=True,
        append_images=processed_frames[1:],
        duration=duration,
        loop=0,
        optimize=True
    )

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[OK] GIF basariyla olusturuldu: {output_path} ({size_mb:.2f} MB)")
    return True

def auto_convert_all():
    assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "assets")
    mp4_files = glob.glob(os.path.join(assets_dir, "*.mp4"))
    
    if not mp4_files:
        print(f"[BILGI] {assets_dir} klasorunde donusturulecek .mp4 dosyasi bulunamadi.")
        print("Kayit yaptiginiz .mp4 videolarini docs/assets/ icine koyup bu betigi calistirabilirsiniz:")
        print("Ornek kullanim: python scripts/convert_to_gif.py docs/assets/kayit.mp4 docs/assets/demo.gif")
        return

    for mp4 in mp4_files:
        convert_video_to_gif(mp4)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        out_file = sys.argv[2] if len(sys.argv) > 2 else None
        convert_video_to_gif(input_file, out_file)
    else:
        auto_convert_all()
