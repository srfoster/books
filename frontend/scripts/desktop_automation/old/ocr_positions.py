#!/usr/bin/env python3
"""Find ALL text boxes with their positions"""

import sys
import cv2
import pytesseract
from pytesseract import Output

image_path = sys.argv[1] if len(sys.argv) > 1 else "screen.png"

# Load and upscale
img = cv2.imread(image_path)
height, width = img.shape[:2]
img_large = cv2.resize(img, (width * 4, height * 4), interpolation=cv2.INTER_CUBIC)

# Get detailed OCR data
data = pytesseract.image_to_data(img_large, config=r'--oem 3 --psm 11', output_type=Output.DICT)

print("All detected text with positions:\n")
n_boxes = len(data['text'])
for i in range(n_boxes):
    text = data['text'][i].strip()
    if text:  # Only show non-empty
        conf = int(data['conf'][i])
        x = data['left'][i] // 4  # Scale back to original coords
        y = data['top'][i] // 4
        w = data['width'][i] // 4
        h = data['height'][i] // 4
        print(f"'{text}' @ ({x},{y}) size=({w}x{h}) confidence={conf}%")

print("\nAll unique words found:")
unique_words = set(data['text'][i].strip() for i in range(n_boxes) if data['text'][i].strip())
for word in sorted(unique_words, key=str.lower):
    print(f"  {word}")
