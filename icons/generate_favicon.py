#!/usr/bin/env python3
"""
Generate a simple favicon-style icon for ContextZero
"""

from pathlib import Path

def create_favicon(size=32):
    """Create a simple favicon using PIL"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("PIL not available. Please install: pip install Pillow")
        return False
    
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = 2
    bg_radius = size // 2 - margin
    center = size // 2
    
    # Draw background circle with gradient effect
    draw.ellipse([center - bg_radius, center - bg_radius, 
                  center + bg_radius, center + bg_radius], 
                 fill=(59, 130, 246, 255), outline=(37, 99, 235, 255), width=1)
    
    # Draw brain symbol (simplified)
    brain_size = size * 0.3
    brain_x = center - brain_size // 2
    brain_y = center - brain_size // 2
    
    # Left brain lobe
    draw.ellipse([brain_x - brain_size//4, brain_y, 
                  brain_x + brain_size//4, brain_y + brain_size], 
                 fill=(255, 255, 255, 200))
    
    # Right brain lobe
    draw.ellipse([brain_x + brain_size//4, brain_y, 
                  brain_x + brain_size//4 + brain_size//2, brain_y + brain_size], 
                 fill=(255, 255, 255, 200))
    
    # Neural connection dot
    dot_size = max(1, size // 16)
    draw.ellipse([center - dot_size, center - dot_size, 
                  center + dot_size, center + dot_size], 
                 fill=(252, 211, 77, 255))
    
    return img

def main():
    script_dir = Path(__file__).parent
    
    # Generate favicon
    favicon = create_favicon(32)
    if favicon:
        favicon.save(script_dir / "favicon.png", 'PNG')
        print("✓ Generated favicon.png")
        
        # Also create a 16x16 version for browser tabs
        favicon_small = create_favicon(16)
        if favicon_small:
            favicon_small.save(script_dir / "favicon-16.png", 'PNG')
            print("✓ Generated favicon-16.png")
    
    print("\nFavicon generation complete!")

if __name__ == "__main__":
    main()