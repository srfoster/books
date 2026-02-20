#!/usr/bin/env python3
"""
Simple aggressive OCR for buttons
"""

import sys
import numpy as np
import cv2
import pytesseract
from PIL import Image

image_path = sys.argv[1] if len(sys.argv) > 1 else "screen.png"

# Load and massively upscale
img = cv2.imread(image_path)
height, width = img.shape[:2]

# Upscale 6x
img_large = cv2.resize(img, (width * 6, height * 6), interpolation=cv2.INTER_CUBIC)

# Convert to grayscale
gray = cv2.cvtColor(img_large, cv2.COLOR_BGR2GRAY)

# Apply strong bilateral filter to reduce noise while keeping edges
gray = cv2.bilateralFilter(gray, 9, 75, 75)

# Otsu thresholding
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

cv2.imwrite("/tmp/simple_thresh.png", thresh)
print("Saved to /tmp/simple_thresh.png")

# Try OCR with different modes
print("\n=== PSM 11 (Sparse text) ===")
text = pytesseract.image_to_string(thresh, config=r'--oem 3 --psm 11')
print(text)

print("\n=== PSM 3 (Fully automatic) ===")
text = pytesseract.image_to_string(thresh, config=r'--oem 3 --psm 3')
print(text)
