#!/usr/bin/env python3
"""
Extract text from an image using OCR.
"""

import cv2
import pytesseract


def extract_text(image_path, scale=2):
    """
    Extract text from an image with OCR.
    Tries multiple generic preprocessing strategies if initial attempt fails.
    
    Args:
        image_path: Path to the image file
        scale: Upscaling factor for better OCR (default 2)
    
    Returns:
        String with extracted text
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    # Try higher upscaling for small images
    if img.shape[0] < 50 or img.shape[1] < 100:
        scale = 6  # Increased from 4
    
    # Upscale for better OCR
    img_large = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Strategy 1: Inverted first (works better for colored buttons with white text)
    img_inverted = cv2.bitwise_not(img_large)
    text = pytesseract.image_to_string(img_inverted, config='--psm 7')
    if text.strip():
        return text
    
    # Strategy 2: Original image
    text = pytesseract.image_to_string(img_large, config='--psm 7')
    if text.strip():
        return text
    
    # Strategy 3: Grayscale + high contrast
    gray = cv2.cvtColor(img_large, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    text = pytesseract.image_to_string(thresh, config='--psm 7')
    if text.strip():
        return text
    
    # Strategy 4: Inverted grayscale threshold
    _, thresh_inv = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    text = pytesseract.image_to_string(thresh_inv, config='--psm 7')
    if text.strip():
        return text
    
    # Strategy 5: Adaptive threshold
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    text = pytesseract.image_to_string(adaptive, config='--psm 7')
    
    return text


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 extract_text.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    text = extract_text(image_path)
    print(text)
