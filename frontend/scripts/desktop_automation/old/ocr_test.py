#!/usr/bin/env python3
"""
Standalone OCR testing script.
Usage: python3 ocr_test.py [image_file]
Default: screen.png
"""

import sys
import numpy as np
import cv2
import pytesseract
from PIL import Image, ImageEnhance

def ocr_image(image_path):
    """Extract text from image using OCR."""
    try:
        # Load image
        img = Image.open(image_path)
        print(f"Image size: {img.size}, mode: {img.mode}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Upscale 4x for better OCR on small button text
        width, height = img.size
        img_large = img.resize((width * 4, height * 4), Image.LANCZOS)
        
        # Moderate contrast enhancement
        enhancer = ImageEnhance.Contrast(img_large)
        img_enhanced = enhancer.enhance(1.8)
        
        # Convert to grayscale
        img_gray = img_enhanced.convert('L')
        
        # Run OCR on normal grayscale
        print("\n=== Running OCR on grayscale ===")
        text1 = pytesseract.image_to_string(img_gray, config=r'--oem 3 --psm 6')
        print(text1)
        
        # Convert to numpy for OpenCV
        img_np = np.array(img_enhanced)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        
        # Try different approach: Look for blue buttons specifically
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        
        # Mask for blue regions (buttons)
        lower_blue = np.array([100, 50, 50])
        upper_blue = np.array([130, 255, 255])
        mask_blue = cv2.inRange(img_hsv, lower_blue, upper_blue)
        
        # Dilate blue mask to capture button area
        kernel = np.ones((5, 5), np.uint8)
        mask_blue = cv2.dilate(mask_blue, kernel, iterations=3)
        
        # Find contours of blue regions
        contours, _ = cv2.findContours(mask_blue, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        print(f"\nFound {len(contours)} blue regions (potential buttons)")
        
        # Process each button region
        button_texts = []
        for i, contour in enumerate(contours):
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter small regions
            if w < 30 or h < 15:
                continue
                
            print(f"\nButton {i+1}: position=({x},{y}), size=({w}x{h})")
            
            # Extract button region with padding
            padding = 5
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(img_bgr.shape[1], x + w + padding)
            y2 = min(img_bgr.shape[0], y + h + padding)
            
            button_roi = img_bgr[y1:y2, x1:x2]
            
            # Convert to HSV and extract white text
            button_hsv = cv2.cvtColor(button_roi, cv2.COLOR_BGR2HSV)
            
            # Very bright pixels (white text)
            lower_white = np.array([0, 0, 200])
            upper_white = np.array([180, 30, 255])
            mask_white = cv2.inRange(button_hsv, lower_white, upper_white)
            
            # Clean up
            kernel_small = np.ones((2, 2), np.uint8)
            mask_white = cv2.morphologyEx(mask_white, cv2.MORPH_CLOSE, kernel_small)
            mask_white = cv2.morphologyEx(mask_white, cv2.MORPH_OPEN, kernel_small)
            
            # Crop to actual text bounding box to reduce image size
            coords = cv2.findNonZero(mask_white)
            if coords is None:
                print(f"No text pixels found in button")
                continue
                
            x_crop, y_crop, w_crop, h_crop = cv2.boundingRect(coords)
            mask_cropped = mask_white[y_crop:y_crop+h_crop, x_crop:x_crop+w_crop]
            
            # Upscale cropped region (6x is good balance)
            mask_large = cv2.resize(mask_cropped, None, fx=6, fy=6, interpolation=cv2.INTER_CUBIC)
            
            # Save button extraction
            button_file = f"/tmp/button_{i+1}.png"
            cv2.imwrite(button_file, mask_large)
            print(f"Button extraction saved: {button_file}, size={mask_large.shape}")
            
            # OCR with PSM 10 (single character/word - best for buttons)
            text = pytesseract.image_to_string(mask_large, config=r'--oem 3 --psm 10').strip()
            
            # Note: Sometimes buttons with 2-letter text like "OK" get misread as @ initially
            # but that's an OCR artifact - the actual button text is there
            if text:
                print(f"Button text: '{text}'")
                button_texts.append(text)
            else:
                print("No text detected in button")
        
        # Also try simple thresholding approach
        print("\n=== Using adaptive threshold on full image ===")
        img_gray_np = np.array(img_gray)
        
        # Otsu's thresholding
        _, thresh = cv2.threshold(img_gray_np, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        cv2.imwrite("/tmp/ocr_otsu.png", thresh)
        
        text_otsu = pytesseract.image_to_string(thresh, config=r'--oem 3 --psm 11')
        print(text_otsu)
        
        print("\n" + "="*50)
        print("Button texts found:", button_texts)
        print("Check extracted images in /tmp/")
        
    except Exception as e:
        print(f"Error during OCR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    image_file = sys.argv[1] if len(sys.argv) > 1 else "screen.png"
    print(f"Processing: {image_file}")
    ocr_image(image_file)
