#!/usr/bin/env python3
"""
Generate PNG icons from SVG for ContextZero Chrome Extension
"""

import os
import sys
from pathlib import Path

def create_png_icon(size, output_path):
    """Create a PNG icon using PIL (Python Imaging Library)"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("PIL not available. Please install: pip install Pillow")
        return False
    
    # Create a new image with a transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = max(2, size // 32)
    bg_radius = size // 2 - margin
    center = size // 2
    
    # Draw background circle
    draw.ellipse([center - bg_radius, center - bg_radius, 
                  center + bg_radius, center + bg_radius], 
                 fill=(45, 55, 72, 255), outline=(74, 85, 104, 255), width=max(1, size // 32))
    
    # Brain shape (simplified)
    brain_scale = size / 128
    brain_offset = size * 0.25
    
    # Left brain hemisphere
    left_brain = [
        (brain_offset + 16 * brain_scale, brain_offset + 20 * brain_scale),
        (brain_offset + 12 * brain_scale, brain_offset + 12 * brain_scale),
        (brain_offset + 4 * brain_scale, brain_offset + 12 * brain_scale),
        (brain_offset + 4 * brain_scale, brain_offset + 20 * brain_scale),
        (brain_offset + 8 * brain_scale, brain_offset + 36 * brain_scale),
        (brain_offset + 16 * brain_scale, brain_offset + 44 * brain_scale),
        (brain_offset + 28 * brain_scale, brain_offset + 56 * brain_scale),
        (brain_offset + 32 * brain_scale, brain_offset + 60 * brain_scale),
        (brain_offset + 28 * brain_scale, brain_offset + 56 * brain_scale),
        (brain_offset + 24 * brain_scale, brain_offset + 52 * brain_scale),
        (brain_offset + 16 * brain_scale, brain_offset + 44 * brain_scale),
        (brain_offset + 12 * brain_scale, brain_offset + 40 * brain_scale),
        (brain_offset + 10 * brain_scale, brain_offset + 32 * brain_scale),
        (brain_offset + 16 * brain_scale, brain_offset + 20 * brain_scale),
    ]
    
    # Right brain hemisphere
    right_brain = [
        (brain_offset + 48 * brain_scale, brain_offset + 20 * brain_scale),
        (brain_offset + 52 * brain_scale, brain_offset + 12 * brain_scale),
        (brain_offset + 60 * brain_scale, brain_offset + 12 * brain_scale),
        (brain_offset + 60 * brain_scale, brain_offset + 20 * brain_scale),
        (brain_offset + 56 * brain_scale, brain_offset + 36 * brain_scale),
        (brain_offset + 48 * brain_scale, brain_offset + 44 * brain_scale),
        (brain_offset + 36 * brain_scale, brain_offset + 56 * brain_scale),
        (brain_offset + 32 * brain_scale, brain_offset + 60 * brain_scale),
        (brain_offset + 36 * brain_scale, brain_offset + 56 * brain_scale),
        (brain_offset + 40 * brain_scale, brain_offset + 52 * brain_scale),
        (brain_offset + 48 * brain_scale, brain_offset + 44 * brain_scale),
        (brain_offset + 52 * brain_scale, brain_offset + 40 * brain_scale),
        (brain_offset + 54 * brain_scale, brain_offset + 32 * brain_scale),
        (brain_offset + 48 * brain_scale, brain_offset + 20 * brain_scale),
    ]
    
    # Draw brain hemispheres
    draw.polygon(left_brain, fill=(96, 165, 250, 255), outline=(59, 130, 246, 255))
    draw.polygon(right_brain, fill=(96, 165, 250, 255), outline=(59, 130, 246, 255))
    
    # Neural connection points
    if size >= 32:
        dot_size = max(1, size // 32)
        # Central connection
        draw.ellipse([center - dot_size * 2, center - dot_size * 2, 
                     center + dot_size * 2, center + dot_size * 2], 
                    fill=(252, 211, 77, 255))
        
        # Neural dots
        neural_dots = [
            (brain_offset + 20 * brain_scale, brain_offset + 30 * brain_scale),
            (brain_offset + 44 * brain_scale, brain_offset + 30 * brain_scale),
            (brain_offset + 24 * brain_scale, brain_offset + 48 * brain_scale),
            (brain_offset + 40 * brain_scale, brain_offset + 48 * brain_scale),
        ]
        
        for x, y in neural_dots:
            draw.ellipse([x - dot_size, y - dot_size, x + dot_size, y + dot_size], 
                        fill=(252, 211, 77, 255))
    
    # Memory indicator (M badge)
    if size >= 32:
        badge_size = max(8, size // 8)
        badge_x = size - badge_size - margin
        badge_y = margin + badge_size
        
        # Badge circle
        draw.ellipse([badge_x - badge_size, badge_y - badge_size, 
                     badge_x + badge_size, badge_y + badge_size], 
                    fill=(245, 158, 11, 255), outline=(217, 119, 6, 255), width=1)
        
        # M letter
        if size >= 48:
            try:
                font_size = max(8, size // 10)
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            # Get text bbox to center it
            bbox = draw.textbbox((0, 0), "M", font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            text_x = badge_x - text_width // 2
            text_y = badge_y - text_height // 2
            
            draw.text((text_x, text_y), "M", fill=(255, 255, 255, 255), font=font)
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"Created {output_path}")
    return True

def main():
    script_dir = Path(__file__).parent
    
    # Generate the three required sizes
    sizes = [16, 48, 128]
    
    for size in sizes:
        output_path = script_dir / f"icon{size}.png"
        if create_png_icon(size, output_path):
            print(f"✓ Generated {size}x{size} icon")
        else:
            print(f"✗ Failed to generate {size}x{size} icon")
    
    print("\nIcon generation complete!")

if __name__ == "__main__":
    main()