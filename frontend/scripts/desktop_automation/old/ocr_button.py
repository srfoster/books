#!/usr/bin/env python3
"""
OCR tuning for a specific button image
Usage: python3 ocr_button.py /tmp/button_2.png
"""

import sys
import numpy as np
import cv2
import pytesseract
from PIL import Image, ImageEnhance

button_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/button_2.png"

# Load button image
img = cv2.imread(button_path, cv2.IMREAD_GRAYSCALE)
print(f"Button image size: {img.shape}")

# Save original
cv2.imwrite("/tmp/step_0_original.png", img)

# Try various preprocessing strategies
strategies = []

# Strategy 1: Massive upscaling
img1 = cv2.resize(img, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
# Denoise
img1 = cv2.fastNlMeansDenoising(img1, None, 10, 7, 21)
# Sharpen
kernel_sharpen = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
img1 = cv2.filter2D(img1, -1, kernel_sharpen)
# Binary threshold
_, img1 = cv2.threshold(img1, 127, 255, cv2.THRESH_BINARY)
cv2.imwrite("/tmp/step_1_massive_upscale.png", img1)
strategies.append(("Massive upscale + denoise", img1))

# Strategy 2: Morphological operations
img2 = cv2.resize(img, None, fx=6, fy=6, interpolation=cv2.INTER_CUBIC)
# Dilate to make text thicker
kernel = np.ones((3, 3), np.uint8)
img2 = cv2.dilate(img2, kernel, iterations=1)
# Threshold
_, img2 = cv2.threshold(img2, 100, 255, cv2.THRESH_BINARY)
cv2.imwrite("/tmp/step_2_dilate.png", img2)
strategies.append(("Dilate + threshold", img2))

# Strategy 3: Adaptive threshold
img3 = cv2.resize(img, None, fx=5, fy=5, interpolation=cv2.INTER_CUBIC)
img3 = cv2.adaptiveThreshold(img3, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
cv2.imwrite("/tmp/step_3_adaptive.png", img3)
strategies.append(("Adaptive threshold", img3))

# Strategy 4: Simple invert
img4 = cv2.resize(img, None, fx=8, fy=8, interpolation=cv2.INTER_CUBIC)
img4 = cv2.bitwise_not(img4)  # Invert: white text on black -> black text on white
_, img4 = cv2.threshold(img4, 200, 255, cv2.THRESH_BINARY)
cv2.imwrite("/tmp/step_4_invert.png", img4)
strategies.append(("Invert colors", img4))

# Strategy 5: Bilateral filter + threshold
img5 = cv2.resize(img, None, fx=6, fy=6, interpolation=cv2.INTER_CUBIC)
img5 = cv2.bilateralFilter(img5, 9, 75, 75)
_, img5 = cv2.threshold(img5, 128, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
cv2.imwrite("/tmp/step_5_bilateral.png", img5)
strategies.append(("Bilateral filter", img5))

# Try OCR on each strategy
print("\n" + "="*60)
for name, processed_img in strategies:
    print(f"\n=== {name} ===")
    
    # Try different PSM modes
    configs = [
        ('PSM 7 - single line', '--oem 3 --psm 7'),
        ('PSM 8 - single word', '--oem 3 --psm 8'),
        ('PSM 10 - single char', '--oem 3 --psm 10'),
        ('PSM 13 - raw line', '--oem 3 --psm 13'),
    ]
    
    results = []
    for config_name, config in configs:
        text = pytesseract.image_to_string(processed_img, config=config).strip()
        if text:
            results.append(f"{config_name}: '{text}'")
    
    if results:
        for r in results:
            print(f"  {r}")
    else:
        print("  (no text detected)")

print("\n" + "="*60)
print("Check images: /tmp/step_*.png")
