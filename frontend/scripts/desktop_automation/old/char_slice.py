#!/usr/bin/env python3
"""
Slice an image into individual characters using OCR.
Usage: python3 char_slice.py screen.png
"""

import sys
import os
import cv2
import pytesseract

def char_slice(image_path, output_dir="char_slices"):
    """Slice image into individual character regions."""
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not load {image_path}")
        return
    
    height, width = img.shape[:2]
    print(f"Image: {width}x{height}")
    
    # Upscale for better OCR
    scale = 2
    img_large = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Get character boxes
    print("Running OCR for characters...")
    boxes = pytesseract.image_to_boxes(img_large)
    
    regions = []
    for line in boxes.splitlines():
        parts = line.split()
        if len(parts) < 6:
            continue
        
        char = parts[0]
        x = int(parts[1]) // scale
        y_bottom = int(parts[2]) // scale
        x2 = int(parts[3]) // scale
        y_top = int(parts[4]) // scale
        
        # Convert from bottom-left origin to top-left origin
        y = height - y_top
        h = y_top - y_bottom
        w = x2 - x
        
        regions.append((x, y, w, h, char))
    
    print(f"Found {len(regions)} characters")
    print(f"Saving to {output_dir}/...")
    
    # Save character list to text file
    with open(f"{output_dir}/characters.txt", 'w') as f:
        for i, (x, y, w, h, char) in enumerate(regions):
            f.write(f"{i:03d}: '{char}' at ({x},{y}) size {w}x{h}\n")
    
    # Save slices
    for i, (x, y, w, h, char) in enumerate(regions):
        slice_img = img[y:y+h, x:x+w]
        char_safe = char if char.isalnum() else f"char{ord(char)}"
        filename = f"{output_dir}/slice_{i:03d}_x{x}y{y}_w{w}h{h}_{char_safe}.png"
        cv2.imwrite(filename, slice_img)
    
    print(f"✓ Saved {len(regions)} character slices")
    
    # Visualization
    vis = img.copy()
    for i, (x, y, w, h, char) in enumerate(regions):
        cv2.rectangle(vis, (x, y), (x+w, y+h), (0, 0, 255), 1)
    cv2.imwrite(f"{output_dir}/visualization.png", vis)

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "screen.png"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "char_slices"
    char_slice(image_path, output_dir)
