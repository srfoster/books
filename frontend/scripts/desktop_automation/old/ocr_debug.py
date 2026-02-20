#!/usr/bin/env python3
"""Just look at the button_2 image and show what we see"""

import cv2
import numpy as np

img = cv2.imread("/tmp/button_2.png", cv2.IMREAD_GRAYSCALE)
print(f"Button shape: {img.shape}")
print(f"Button has {np.count_nonzero(img)} white pixels out of {img.size} total")

# Show pixel intensity distribution
print(f"\nPixel stats: min={img.min()}, max={img.max()}, mean={img.mean():.1f}")

# Maybe the button has a lot of white space. Try cropping to just the text area
# Find bounding box of non-zero pixels
coords = cv2.findNonZero(img)
if coords is not None:
    x, y, w, h = cv2.boundingRect(coords)
    print(f"\nText bounding box: x={x}, y={y}, w={w}, h={h}")
    
    # Crop to text
    cropped = img[y:y+h, x:x+w]
    cv2.imwrite("/tmp/button_2_cropped.png", cropped)
    print(f"Cropped image saved: /tmp/button_2_cropped.png")
    print(f"Cropped shape: {cropped.shape}")
    
    # Try OCR on cropped, massively upscaled version
    import pytesseract
    huge = cv2.resize(cropped, None, fx=10, fy=10, interpolation=cv2.INTER_CUBIC)
    cv2.imwrite("/tmp/button_2_huge.png", huge)
    print(f"Huge version saved: /tmp/button_2_huge.png ({huge.shape})")
    
    # Try with tessdata config for better single-word detection
    configs = [
        '--psm 8',
        '--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        '--psm 10',
    ]
    
    print("\nOCR attempts:")
    for cfg in configs:
        text = pytesseract.image_to_string(huge, config=cfg).strip()
        print(f"  {cfg}: '{text}'")
