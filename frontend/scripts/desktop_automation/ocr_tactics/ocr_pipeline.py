#!/usr/bin/env python3
"""
OCR Pipeline DSL - A functional library for composing OCR strategies.

Example usage:
    pipeline = Pipeline() \
        .scale(3) \
        .invert() \
        .ocr(psm=7)
    
    text = pipeline.run('button.png')
"""

import cv2
import pytesseract
from typing import Callable, Optional
import numpy as np


class Pipeline:
    """Functional pipeline for OCR preprocessing and extraction."""
    
    def __init__(self):
        self.steps = []
    
    def scale(self, factor: float):
        """Upscale image by factor."""
        def _scale(img):
            return cv2.resize(img, None, fx=factor, fy=factor, interpolation=cv2.INTER_CUBIC)
        self.steps.append(('scale', factor, _scale))
        return self
    
    def invert(self):
        """Invert colors (bitwise NOT)."""
        def _invert(img):
            return cv2.bitwise_not(img)
        self.steps.append(('invert', None, _invert))
        return self
    
    def grayscale(self):
        """Convert to grayscale."""
        def _grayscale(img):
            if len(img.shape) == 3:
                return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            return img
        self.steps.append(('grayscale', None, _grayscale))
        return self
    
    def threshold(self, value: int = 127):
        """Binary threshold."""
        def _threshold(img):
            gray = img if len(img.shape) == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, result = cv2.threshold(gray, value, 255, cv2.THRESH_BINARY)
            return result
        self.steps.append(('threshold', value, _threshold))
        return self
    
    def adaptive_threshold(self, block_size: int = 11, c: int = 2):
        """Adaptive threshold."""
        def _adaptive(img):
            gray = img if len(img.shape) == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            return cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                        cv2.THRESH_BINARY, block_size, c)
        self.steps.append(('adaptive_threshold', (block_size, c), _adaptive))
        return self
    
    def blur(self, kernel_size: int = 5):
        """Gaussian blur."""
        def _blur(img):
            return cv2.GaussianBlur(img, (kernel_size, kernel_size), 0)
        self.steps.append(('blur', kernel_size, _blur))
        return self
    
    def dilate(self, kernel_size: int = 3, iterations: int = 1):
        """Morphological dilation."""
        def _dilate(img):
            kernel = np.ones((kernel_size, kernel_size), np.uint8)
            return cv2.dilate(img, kernel, iterations=iterations)
        self.steps.append(('dilate', (kernel_size, iterations), _dilate))
        return self
    
    def erode(self, kernel_size: int = 3, iterations: int = 1):
        """Morphological erosion."""
        def _erode(img):
            kernel = np.ones((kernel_size, kernel_size), np.uint8)
            return cv2.erode(img, kernel, iterations=iterations)
        self.steps.append(('erode', (kernel_size, iterations), _erode))
        return self
    
    def ocr(self, psm: Optional[int] = None, lang: str = 'eng'):
        """Extract text with Tesseract OCR."""
        config = f'--psm {psm}' if psm else ''
        config += f' -l {lang}'
        
        def _ocr(img):
            return pytesseract.image_to_string(img, config=config.strip())
        
        self.steps.append(('ocr', psm, _ocr))
        return self
    
    def run(self, image_path: str) -> str:
        """Execute pipeline on an image."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        current = img
        for step_name, param, func in self.steps:
            current = func(current)
            
            # OCR returns string, not image
            if step_name == 'ocr':
                return current
        
        # If no OCR step, just run default OCR
        return pytesseract.image_to_string(current)
    
    def describe(self) -> str:
        """Return description of pipeline steps."""
        description = "Pipeline:\n"
        for i, (name, param, _) in enumerate(self.steps, 1):
            param_str = f"({param})" if param is not None else ""
            description += f"  {i}. {name}{param_str}\n"
        return description
    
    @staticmethod
    def from_string(pipeline_str: str):
        """
        Create pipeline from string notation.
        
        Example: "scale(3).invert().ocr(psm=7)"
        """
        pipeline = Pipeline()
        
        # Parse the string
        parts = pipeline_str.split('.')
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            # Parse function call: name(arg1, arg2, kwarg=val)
            if '(' in part:
                name = part[:part.index('(')]
                args_str = part[part.index('(')+1:part.rindex(')')]
                
                # Parse arguments
                args = []
                kwargs = {}
                
                if args_str.strip():
                    for arg in args_str.split(','):
                        arg = arg.strip()
                        if '=' in arg:
                            key, val = arg.split('=', 1)
                            # Try to convert to int
                            try:
                                kwargs[key.strip()] = int(val.strip())
                            except ValueError:
                                kwargs[key.strip()] = val.strip().strip("'\"")
                        else:
                            # Try to convert to int
                            try:
                                args.append(int(arg))
                            except ValueError:
                                args.append(arg.strip("'\""))
                
                # Call the method
                method = getattr(pipeline, name)
                method(*args, **kwargs)
            else:
                # No arguments
                method = getattr(pipeline, part)
                method()
        
        return pipeline


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 ocr_pipeline.py <image_path> <pipeline>")
        print("\nPipeline format: 'scale(3).invert().ocr(psm=7)'")
        print("\nAvailable operations:")
        print("  scale(factor)")
        print("  invert()")
        print("  grayscale()")
        print("  threshold(value)")
        print("  adaptive_threshold(block_size, c)")
        print("  blur(kernel_size)")
        print("  dilate(kernel_size, iterations)")
        print("  erode(kernel_size, iterations)")
        print("  ocr(psm=N, lang='eng')")
        print("\nExample:")
        print("  python3 ocr_pipeline.py button.png 'scale(3).invert().ocr(psm=7)'")
        sys.exit(1)
    
    image_path = sys.argv[1]
    pipeline_str = sys.argv[2] if len(sys.argv) > 2 else 'scale(2).ocr()'
    
    pipeline = Pipeline.from_string(pipeline_str)
    print(pipeline.describe())
    print("Result:")
    print(pipeline.run(image_path))
