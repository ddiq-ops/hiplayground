#!/usr/bin/env python3
"""
Split sprite sheet PNG files into individual WebP files
Each PNG contains 5 sprites horizontally (1024x1024 image, each sprite is 204.8px x 1024px)
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow module not found.")
    print("Please install it by running: pip install Pillow")
    sys.exit(1)

def split_sprite_sheet(png_file, output_dir):
    """Split a sprite sheet PNG into 5 individual WebP files"""
    try:
        img = Image.open(png_file)
        width, height = img.size
        
        if width != 1024 or height != 1024:
            print(f"Warning: {png_file.name} is not 1024x1024 (actual: {width}x{height})")
        
        # Convert to RGBA if needed (for transparency)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Calculate sprite dimensions
        sprite_width = width / 5  # 204.8px
        sprite_height = height    # 1024px
        
        # Extract base filename (without extension)
        base_name = png_file.stem
        
        # Parse level range from filename (e.g., weapon-levelup01_05 -> start=1, end=5)
        try:
            parts = base_name.split('_')
            if len(parts) >= 2:
                range_part = parts[-1]  # Get last part (e.g., "05")
                end_level = int(range_part)
                start_level = end_level - 4  # Assuming range is 5 levels
            else:
                # Fallback: use filename as is
                start_level = 1
                end_level = 5
        except:
            start_level = 1
            end_level = 5
        
        print(f"\nProcessing {png_file.name}:")
        print(f"  Image size: {width}x{height}")
        print(f"  Sprite size: {sprite_width}px x {sprite_height}px")
        print(f"  Level range: {start_level} to {end_level}")
        
        # Create output directory if it doesn't exist
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Split into 5 sprites
        for i in range(5):
            level = start_level + i
            
            # Calculate crop coordinates (left, top, right, bottom)
            left = int(i * sprite_width)
            right = int((i + 1) * sprite_width)
            top = 0
            bottom = height
            
            # Crop the sprite
            sprite = img.crop((left, top, right, bottom))
            
            # Generate output filename
            output_filename = f"weapon-levelup{level:02d}.webp"
            output_path = output_dir / output_filename
            
            # Save as WebP with quality 80 and transparency
            sprite.save(output_path, 'WEBP', quality=80, method=6)
            
            print(f"  Sprite {i+1} (Level {level}): {left}px-{right}px -> {output_filename} ({output_path.stat().st_size} bytes)")
        
        return True
        
    except Exception as e:
        print(f"Error processing {png_file}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    script_dir = Path(__file__).parent
    png_dir = script_dir / 'assets' / 'games' / 'weapon-levelup' / 'images' / 'png'
    output_dir = script_dir / 'assets' / 'games' / 'weapon-levelup' / 'images' / 'webp'
    
    if not png_dir.exists():
        print(f"PNG directory not found: {png_dir}")
        sys.exit(1)
    
    # Find all PNG files
    png_files = sorted(png_dir.glob('*.png')) + sorted(png_dir.glob('*.PNG'))
    
    if not png_files:
        print(f"No PNG files found in {png_dir}")
        sys.exit(0)
    
    print(f"Found {len(png_files)} PNG file(s)")
    print(f"Output directory: {output_dir}")
    
    success_count = 0
    error_count = 0
    
    for png_file in png_files:
        if split_sprite_sheet(png_file, output_dir):
            success_count += 1
        else:
            error_count += 1
    
    print(f"\n{'='*60}")
    print(f"Conversion complete!")
    print(f"Success: {success_count} file(s)")
    if error_count > 0:
        print(f"Errors: {error_count} file(s)")
    print(f"Total WebP files created: {success_count * 5}")

if __name__ == "__main__":
    main()

