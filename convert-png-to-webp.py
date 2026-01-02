import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow module not found.")
    print("Please install it by running: python -m pip install --user Pillow")
    sys.exit(1)

# 사용법 안내
if len(sys.argv) < 2:
    print("사용법:")
    print("  python convert-png-to-webp.py <png_폴더_경로>")
    print("예시:")
    print("  python convert-png-to-webp.py assets/games/weapon-levelup/images")
    sys.exit(1)

# 인자로 받은 폴더(=png가 있는 images 폴더)
source_dir = Path(sys.argv[1]).resolve()

if not source_dir.exists() or not source_dir.is_dir():
    print("폴더를 찾을 수 없습니다:", source_dir)
    sys.exit(1)

# 출력 폴더: images/webp
webp_dir = source_dir / "webp"
webp_dir.mkdir(exist_ok=True)
print(f"Source directory: {source_dir}")
print(f"Output directory: {webp_dir}")

# PNG 파일 찾기(대소문자 모두)
png_files = list(source_dir.glob("*.png")) + list(source_dir.glob("*.PNG"))

if not png_files:
    print("No PNG files found in the source directory.")
    sys.exit(0)

print(f"Found {len(png_files)} PNG file(s) to convert.\n")

success_count = 0
error_count = 0

for png_file in png_files:
    try:
        img = Image.open(png_file)

        # 투명도 보존용
        if img.mode != "RGBA":
            img = img.convert("RGBA")

        webp_file = webp_dir / f"{png_file.stem}.webp"

        # 이미 존재하면 덮어쓰기(원치 않으면 여기서 skip 처리 가능)
        img.save(webp_file, "WEBP", quality=80, method=6)

        original_size = png_file.stat().st_size
        webp_size = webp_file.stat().st_size
        size_reduction = (1 - webp_size / original_size) * 100 if original_size else 0

        print(f"✓ {png_file.name} → webp/{webp_file.name} ({size_reduction:.1f}% smaller)")
        success_count += 1

    except Exception as e:
        print(f"✗ Error converting {png_file.name}: {e}")
        error_count += 1

print("\nConversion complete!")
print(f"Success: {success_count} file(s)")
if error_count > 0:
    print(f"Errors: {error_count} file(s)")
