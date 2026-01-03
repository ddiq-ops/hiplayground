#!/usr/bin/env python3
"""
Remove background pattern (checkerboard) from PNG images
Detects background color from image edges and makes it transparent
"""

import sys
from pathlib import Path
from collections import Counter

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow module not found.")
    print("Please install it by running: pip install Pillow")
    sys.exit(1)

def get_edge_colors(img, sample_size=5):
    """Get colors from image edges to determine background"""
    width, height = img.size
    edge_colors = []
    
    # Sample from all four edges
    for y in range(min(sample_size, height)):
        for x in range(0, width, max(1, width // 50)):  # Sample every Nth pixel
            edge_colors.append(img.getpixel((x, y)))
    for y in range(max(0, height - sample_size), height):
        for x in range(0, width, max(1, width // 50)):
            edge_colors.append(img.getpixel((x, y)))
    for x in range(min(sample_size, width)):
        for y in range(0, height, max(1, height // 50)):
            edge_colors.append(img.getpixel((x, y)))
    for x in range(max(0, width - sample_size), width):
        for y in range(0, height, max(1, height // 50)):
            edge_colors.append(img.getpixel((x, y)))
    
    return edge_colors

def color_distance(c1, c2):
    """Calculate color distance (Euclidean distance in RGB space)"""
    if len(c1) < 3 or len(c2) < 3:
        return 0
    r1, g1, b1 = c1[0], c1[1], c1[2]
    r2, g2, b2 = c2[0], c2[1], c2[2]
    return ((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) ** 0.5

def remove_background(img_path, threshold=40):
    """
    Remove background by detecting edge colors and making similar colors transparent
    """
    try:
        img = Image.open(img_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get edge colors to determine background
        edge_colors = get_edge_colors(img)
        
        # Find most common edge colors (likely background)
        color_counts = Counter(edge_colors)
        if color_counts:
            top_colors = [color for color, count in color_counts.most_common(5)]
        else:
            top_colors = []
        
        # Get pixel data
        data = list(img.getdata())
        width, height = img.size
        
        # Create new pixel data with transparency
        new_data = []
        for i, pixel in enumerate(data):
            r, g, b = pixel[0], pixel[1], pixel[2]
            a = pixel[3] if len(pixel) > 3 else 255
            
            # Calculate lightness
            lightness = (r + g + b) / 3
            
            # Check if pixel matches background colors
            is_background = False
            
            # Check against top background colors
            for bg_color in top_colors[:3]:  # Check top 3 background colors
                if len(bg_color) >= 3:
                    dist = color_distance((r, g, b), bg_color[:3])
                    if dist <= threshold:
                        is_background = True
                        break
            
            # Also check for very light colors (white/light gray)
            if lightness > 220:
                is_background = True
            
            # Also check for very dark colors if background is dark
            if top_colors:
                avg_edge_brightness = sum(sum(c[:3]) for c in top_colors[:3] if len(c) >= 3) / (len(top_colors[:3]) * 3) if top_colors[:3] else 128
                if avg_edge_brightness < 100 and lightness < 60:  # Dark background
                    is_background = True
            
            if is_background:
                new_data.append((r, g, b, 0))  # Transparent
            else:
                new_data.append((r, g, b, a))  # Keep original with existing alpha
        
        # Update image with new data
        img.putdata(new_data)
        
        # Save
        img.save(img_path, 'PNG')
        return True
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python remove-background-pattern.py <png_파일_또는_폴더> [threshold]")
        print("예시:")
        print("  python remove-background-pattern.py assets/games/gravity-run 40")
        print("\nthreshold: 색상 거리 임계값 (기본값 40)")
        sys.exit(1)
    
    source_path = Path(sys.argv[1]).resolve()
    threshold = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    
    if not source_path.exists():
        print(f"파일 또는 폴더를 찾을 수 없습니다: {source_path}")
        sys.exit(1)
    
    # Collect PNG files (exclude webp folder)
    png_files = []
    if source_path.is_file():
        if source_path.suffix.lower() == '.png':
            png_files = [source_path]
        else:
            print(f"PNG 파일이 아닙니다: {source_path}")
            sys.exit(1)
    else:
        all_png = list(source_path.glob("*.png")) + list(source_path.glob("*.PNG"))
        png_files = [f for f in all_png if 'webp' not in str(f)]
    
    if not png_files:
        print("PNG 파일을 찾을 수 없습니다.")
        sys.exit(0)
    
    print(f"처리할 파일: {len(png_files)}개")
    print(f"임계값: {threshold}\n")
    
    success_count = 0
    error_count = 0
    
    for png_file in png_files:
        print(f"처리 중: {png_file.name}...", end=' ')
        if remove_background(png_file, threshold=threshold):
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
