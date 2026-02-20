#!/usr/bin/env python3
"""
Slice an image into regions based on edges.
Usage: python3 slice.py screen.png
"""

import sys
import os
import cv2

def slice_image(image_path, output_dir="slices"):
    """Slice image into regions with visible edges/boundaries."""
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not load {image_path}")
        return
    
    height, width = img.shape[:2]
    print(f"Image: {width}x{height}")
    
    # Find edges
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    
    # Find contours (closed shapes)
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    print(f"Found {len(contours)} contours")
    
    # Save each contour as a slice
    regions = []
    for i, contour in enumerate(contours):
        x, y, w, h = cv2.boundingRect(contour)
        
        # Skip tiny (< 15px width/height) or huge regions
        if w < 15 or h < 15:
            continue
        area = w * h
        if area > (width * height) / 2:
            continue
        
        regions.append((x, y, w, h))
    
    print(f"Saving {len(regions)} regions...")
    
    # Remove near-duplicates (similar size + high overlap)
    # Keep larger region if two regions are similar in size and heavily overlapping
    regions_with_area = [(x, y, w, h, w*h) for x, y, w, h in regions]
    regions_sorted = sorted(regions_with_area, key=lambda r: r[4], reverse=True)
    
    filtered_regions = []
    
    for x, y, w, h, area in regions_sorted:
        # Check if similar-sized overlapping region already exists
        should_skip = False
        for sx, sy, sw, sh in filtered_regions:
            # Calculate intersection
            ix1 = max(x, sx)
            iy1 = max(y, sy)
            ix2 = min(x + w, sx + sw)
            iy2 = min(y + h, sy + sh)
            
            if ix2 > ix1 and iy2 > iy1:
                intersection_area = (ix2 - ix1) * (iy2 - iy1)
                current_area = w * h
                existing_area = sw * sh
                
                # Check if sizes are similar (within 2x of each other)
                size_ratio = max(current_area, existing_area) / min(current_area, existing_area)
                
                # Only deduplicate if similar size AND high overlap
                if size_ratio < 2:  # Similar size
                    overlap_pct = (intersection_area / current_area * 100) if current_area > 0 else 0
                    if overlap_pct > 80:
                        should_skip = True
                        break
        
        if not should_skip:
            filtered_regions.append((x, y, w, h))
    
    print(f"After deduplication: {len(filtered_regions)} regions")
    
    for i, (x, y, w, h) in enumerate(filtered_regions):
        slice_img = img[y:y+h, x:x+w]
        filename = f"{output_dir}/slice_{i:03d}_x{x}y{y}_w{w}h{h}.png"
        cv2.imwrite(filename, slice_img)
    
    print(f"✓ Saved to {output_dir}/")
    
    # Visualization
    vis = img.copy()
    for i, (x, y, w, h) in enumerate(regions):
        cv2.rectangle(vis, (x, y), (x+w, y+h), (0, 255, 0), 2)
    cv2.imwrite(f"{output_dir}/visualization.png", vis)

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "screen.png"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "slices"
    slice_image(image_path, output_dir)

