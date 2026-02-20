#!/usr/bin/env python3
"""
Extract characters with position/size information from an image.
"""

import cv2
import pytesseract


def extract_chars(image_path, scale=2):
    """
    Extract characters from an image with their positions and sizes.
    
    Args:
        image_path: Path to the image file
        scale: Upscaling factor for better OCR (default 2)
    
    Returns:
        List of tuples: [(x, y, w, h, char), ...]
        where x,y is top-left position, w,h is size, char is the character
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    
    height, width = img.shape[:2]
    
    # Upscale for better OCR
    img_large = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # Get character boxes
    boxes = pytesseract.image_to_boxes(img_large)
    
    chars = []
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
        
        chars.append((x, y, w, h, char))
    
    return chars


def chars_to_text(chars, space_threshold=10, line_threshold=5):
    """
    Convert character list to text with inferred spaces.
    
    Args:
        chars: List of (x, y, w, h, char) tuples
        space_threshold: Horizontal gap (in pixels) to infer a space
        line_threshold: Vertical tolerance for grouping characters into same line
    
    Returns:
        String with spaces inferred from gaps
    """
    if not chars:
        return ""
    
    # Filter out noise (very large boxes)
    filtered = [c for c in chars if c[2] < 100 and c[3] < 100]
    
    # Group characters by line (similar y-coordinates)
    lines = []
    sorted_by_y = sorted(filtered, key=lambda c: c[1])
    
    current_line = [sorted_by_y[0]]
    current_y = sorted_by_y[0][1]
    
    for char in sorted_by_y[1:]:
        if abs(char[1] - current_y) <= line_threshold:
            current_line.append(char)
        else:
            lines.append(current_line)
            current_line = [char]
            current_y = char[1]
    lines.append(current_line)
    
    # Process each line
    result = []
    for line in lines:
        # Sort line by x-coordinate
        line_sorted = sorted(line, key=lambda c: c[0])
        
        line_text = []
        prev_x = None
        
        for x, y, w, h, char in line_sorted:
            if prev_x is not None and (x - prev_x) > space_threshold:
                line_text.append(' ')
            
            line_text.append(char)
            prev_x = x + w
        
        result.append(''.join(line_text))
    
    return '\n'.join(result)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 extract_chars.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    chars = extract_chars(image_path)
    
    # Print all characters with inferred spaces (use ~20px threshold for word boundaries)
    text = chars_to_text(chars, space_threshold=20, line_threshold=5)
    print(text)
    
    # Print individual character details
    print(f"\nFound {len(chars)} characters:")
    for i, (x, y, w, h, char) in enumerate(chars):
        print(f"{i:03d}: '{char}' at ({x},{y}) size {w}x{h}")
