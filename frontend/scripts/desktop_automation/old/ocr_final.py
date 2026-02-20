#!/usr/bin/env python3
"""
Final working OCR for screen.png
Key insight: PSM 10 works for short button text like "OK"
"""

import sys
import numpy as np
import cv2
import pytesseract
from PIL import Image, ImageEnhance

image_path = sys.argv[1] if len(sys.argv) > 1 else "screen.png"

# Load
img = Image.open(image_path)
if img.mode != 'RGB':
    img = img.convert('RGB')

# Upscale 4x
width, height = img.size
img = img.resize((width * 4, height * 4), Image.LANCZOS)

# Moderate contrast
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(1.8)

# Grayscale
img_gray = img.convert('L')

# Standard OCR
print("=== Main Text ===")
text_main = pytesseract.image_to_string(img_gray, config=r'--oem 3 --psm 6')
print(text_main)

# Button detection
img_np = np.array(img)
img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

# Find blue buttons
lower_blue = np.array([100, 50, 50])
upper_blue = np.array([130, 255, 255])
mask_blue = cv2.inRange(img_hsv, lower_blue, upper_blue)

kernel = np.ones((5, 5), np.uint8)
mask_blue = cv2.dilate(mask_blue, kernel, iterations=3)

contours, _ = cv2.findContours(mask_blue, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

print("\n=== Buttons ===")
for i, contour in enumerate(contours):
    x, y, w, h = cv2.boundingRect(contour)
    if w < 30 or h < 15:
        continue
    
    # Extract button
    button_roi = img_bgr[y:y+h, x:x+w]
    button_hsv = cv2.cvtColor(button_roi, cv2.COLOR_BGR2HSV)
    
    # White text
    mask_white = cv2.inRange(button_hsv, np.array([0, 0, 200]), np.array([180, 30, 255]))
    
    # Crop to text
    coords = cv2.findNonZero(mask_white)
    if coords is not None:
        bx, by, bw, bh = cv2.boundingRect(coords)
        text_region = mask_white[by:by+bh, bx:bx+bw]
        
        # Upscale 6x
        text_large = cv2.resize(text_region, None, fx=6, fy=6, interpolation=cv2.INTER_CUBIC)
        
        # OCR with PSM 10
        text = pytesseract.image_to_string(text_large, config=r'--oem 3 --psm 10').strip()
        if text:
            print(f"Button: '{text}'")
