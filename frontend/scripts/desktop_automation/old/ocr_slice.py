#!/usr/bin/env python3
"""
Slice an image into text regions using OCR.
Usage: python3 ocr_slice.py screen.png
"""

import sys
import os
import cv2
import pytesseract
from pytesseract import Output

def ocr_slice(image_path, output_dir="ocr_slices"):
    """Slice image into text regions detected by OCR."""
    
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
    
    # Run OCR (PSM 11 for sparse text detection)
    print("Running OCR...")
    data = pytesseract.image_to_data(img_large, output_type=Output.DICT, config='--psm 11')
    
    # Extract text regions
    regions = []
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        if not text:
            continue
        
        conf = int(data['conf'][i])
        if conf < 30:
            continue
        
        # Scale back to original coordinates
        x = data['left'][i] // scale
        y = data['top'][i] // scale
        w = data['width'][i] // scale
        h = data['height'][i] // scale
        
        regions.append((x, y, w, h, text))
    
    print(f"Found {len(regions)} text regions")
    print(f"Saving to {output_dir}/...")
    
    # Save slices
    for i, (x, y, w, h, text) in enumerate(regions):
        slice_img = img[y:y+h, x:x+w]
        text_label = text.replace(' ', '_').replace('/', '_')[:20]
        filename = f"{output_dir}/slice_{i:03d}_x{x}y{y}_w{w}h{h}_{text_label}.png"
        cv2.imwrite(filename, slice_img)
    
    print(f"✓ Saved {len(regions)} slices")
    
    # Visualization
    vis = img.copy()
    for i, (x, y, w, h, text) in enumerate(regions):
        cv2.rectangle(vis, (x, y), (x+w, y+h), (255, 0, 0), 2)
    cv2.imwrite(f"{output_dir}/visualization.png", vis)

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "screen.png"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "ocr_slices"
    ocr_slice(image_path, output_dir)
