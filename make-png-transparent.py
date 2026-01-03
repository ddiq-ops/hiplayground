#!/usr/bin/env python3
"""
Make PNG backgrounds transparent
Converts background colors (white, light colors) to transparent in PNG files
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow module not found.")
    print("Please install it by running: pip install Pillow")
    sys.exit(1)

def make_transparent(img_path, output_path=None, threshold=240):
    """
    Make background transparent by converting white/light pixels to transparent
    
    Args:
        img_path: Path to input PNG file
        output_path: Path to output PNG file (if None, overwrites original)
        threshold: Brightness threshold (0-255). Pixels brighter than this become transparent
    """
    try:
        img = Image.open(img_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get pixel data
        data = img.getdata()
        
        # Create new pixel data with transparency
        new_data = []
        for item in data:
            # If pixel is white or very light (RGB all above threshold), make it transparent
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                new_data.append((255, 255, 255, 0))  # Transparent
            else:
                new_data.append(item)  # Keep original
        
        # Update image with new data
        img.putdata(new_data)
        
        # Save
        if output_path is None:
            output_path = img_path
        
        img.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"Error processing {img_path.name}: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python make-png-transparent.py <png_파일_또는_폴더> [threshold]")
        print("예시:")
        print("  python make-png-transparent.py assets/games/gravity-run 240")
        print("  python make-png-transparent.py assets/games/gravity-run/bg_tile.png")
        print("\nthreshold: 밝기 임계값 (0-255, 기본값 240)")
        print("           이 값보다 밝은 픽셀은 투명하게 됩니다.")
        sys.exit(1)
    
    source_path = Path(sys.argv[1]).resolve()
    threshold = int(sys.argv[2]) if len(sys.argv) > 2 else 240
    
    if not source_path.exists():
        print(f"파일 또는 폴더를 찾을 수 없습니다: {source_path}")
        sys.exit(1)
    
    # Collect PNG files
    png_files = []
    if source_path.is_file():
        if source_path.suffix.lower() == '.png':
            png_files = [source_path]
        else:
            print(f"PNG 파일이 아닙니다: {source_path}")
            sys.exit(1)
    else:
        png_files = list(source_path.glob("*.png")) + list(source_path.glob("*.PNG"))
    
    if not png_files:
        print("PNG 파일을 찾을 수 없습니다.")
        sys.exit(0)
    
    print(f"처리할 파일: {len(png_files)}개")
    print(f"밝기 임계값: {threshold} (이 값보다 밝은 픽셀은 투명하게 됩니다)\n")
    
    success_count = 0
    error_count = 0
    
    for png_file in png_files:
        print(f"처리 중: {png_file.name}...", end=' ')
        if make_transparent(png_file, threshold=threshold):
            print("[OK]")
            success_count += 1
        else:
            print("[FAIL]")
            error_count += 1
    
    print(f"\n처리 완료!")
    print(f"성공: {success_count}개")
    if error_count > 0:
        print(f"실패: {error_count}개")

if __name__ == "__main__":
    main()

