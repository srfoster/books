#!/usr/bin/env python3
"""
Extract text from all images in a directory using multiple OCR strategies.
"""

import os
import sys
from pathlib import Path
from ocr_pipeline import Pipeline


# Strategies to try in order
STRATEGIES = [
    'scale(2).ocr()',
    'scale(3).invert().ocr(psm=7)',
    'scale(6).invert().ocr(psm=10)',
    'scale(2).threshold().ocr(psm=6)',
    'scale(2).grayscale().adaptive_threshold().ocr(psm=11)',
]


def extract_from_directory(directory: str, verbose: bool = False):
    """
    Extract text from all images in a directory.
    Tries multiple strategies until text is found.
    
    Args:
        directory: Path to directory containing images
        verbose: If True, print which strategy worked
    
    Returns:
        Dict mapping filename to extracted text
    """
    results = {}
    
    # Find all PNG files
    image_files = sorted(Path(directory).glob('*.png'))
    
    for image_path in image_files:
        filename = image_path.name
        
        # Skip visualization files
        if 'visualization' in filename:
            continue
        
        text_found = None
        strategy_used = None
        
        # Try each strategy
        for strategy_str in STRATEGIES:
            try:
                pipeline = Pipeline.from_string(strategy_str)
                text = pipeline.run(str(image_path)).strip()
                
                if text:
                    text_found = text
                    strategy_used = strategy_str
                    break
            except Exception as e:
                if verbose:
                    print(f"  Strategy '{strategy_str}' failed: {e}")
                continue
        
        results[filename] = {
            'text': text_found or '',
            'strategy': strategy_used
        }
        
        if verbose and text_found:
            print(f"{filename}: [{strategy_used}]")
    
    return results


def print_results(results: dict):
    """Print extraction results."""
    for filename, data in results.items():
        print(f"=== {filename} ===")
        if data['text']:
            print(data['text'])
        else:
            print("(no text extracted)")
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract.py <directory> [--verbose]")
        print("\nExtracts text from all images in directory using multiple OCR strategies.")
        sys.exit(1)
    
    directory = sys.argv[1]
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    
    if not os.path.isdir(directory):
        print(f"Error: {directory} is not a directory")
        sys.exit(1)
    
    print(f"Extracting text from images in: {directory}")
    print(f"Trying {len(STRATEGIES)} strategies per image...\n")
    
    results = extract_from_directory(directory, verbose=verbose)
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60 + "\n")
    
    print_results(results)
    
    # Summary
    found = sum(1 for r in results.values() if r['text'])
    total = len(results)
    print(f"Extracted text from {found}/{total} images")
