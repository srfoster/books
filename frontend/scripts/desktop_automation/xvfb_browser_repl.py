#!/usr/bin/env python3
# Interactive REPL for controlling a browser in Xvfb
# Usage: xvfb-run -a -s "-screen 0 1280x720x24" python3 xvfb_browser_repl.py

import os
import sys
import time
import subprocess
import tempfile
import numpy as np
import mss
import cv2

class BrowserController:
    def __init__(self, url="https://example.com"):
        self.url = url
        self.process = None
        self.window_id = None
        self.display = os.environ.get('DISPLAY', ':0')
        self.user_data_dir = tempfile.mkdtemp(prefix="chrome-xvfb-")
        
    def launch_chrome(self):
        """Launch Chrome on the virtual display."""
        # Try common Chrome/Chromium binary names
        candidates = ["google-chrome", "chromium", "chromium-browser"]
        chrome = None
        for c in candidates:
            if subprocess.call(["bash", "-lc", f"command -v {c} >/dev/null 2>&1"]) == 0:
                chrome = c
                break
        if chrome is None:
            raise RuntimeError("Could not find google-chrome/chromium/chromium-browser in PATH")

        args = [
            chrome,
            "--new-window",
            "--window-size=1280,720",
            "--window-position=0,0",
            "--disable-gpu",
            "--no-sandbox",
            f"--user-data-dir={self.user_data_dir}",
            self.url,
        ]
        
        env = os.environ.copy()
        env['DISPLAY'] = self.display
        
        print(f"Launching Chrome on DISPLAY={self.display}")
        self.process = subprocess.Popen(args, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Wait for browser to start
        time.sleep(3)
        
        # Try to get window ID (not required for click/type to work)
        # self._find_window_id()
        
    def _find_window_id(self, timeout=5):
        """Find the Chrome window ID using xdotool."""
        end_time = time.time() + timeout
        while time.time() < end_time:
            result = subprocess.run(
                ["xdotool", "search", "--class", "chrome"],
                capture_output=True,
                text=True,
                env={"DISPLAY": self.display}
            )
            if result.stdout.strip():
                # Get all window IDs and use the last one (most recent)
                window_ids = result.stdout.strip().split('\n')
                self.window_id = window_ids[-1]
                print(f"Found Chrome window: {self.window_id}")
                return
            time.sleep(0.5)
        print("Warning: Could not find Chrome window ID (click/type will not work)")
        
    def screenshot(self, filename="screen.png"):
        """Take a screenshot of the virtual display."""
        try:
            # Set DISPLAY for mss
            old_display = os.environ.get('DISPLAY')
            os.environ['DISPLAY'] = self.display
            
            with mss.mss() as sct:
                mon = sct.monitors[1]  # first monitor in virtual display
                img = np.array(sct.grab(mon))  # BGRA
                bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
                cv2.imwrite(filename, bgr)
            
            # Restore original DISPLAY
            if old_display:
                os.environ['DISPLAY'] = old_display
            else:
                os.environ.pop('DISPLAY', None)
                
            print(f"Screenshot saved to: {filename}")
            return filename
        except Exception as e:
            print(f"Error taking screenshot: {e}")
            return None
            
    def click(self, x, y):
        """Click at the specified absolute screen coordinates."""
        try:
            # Move mouse to absolute screen coordinates and click
            # This works regardless of window focus or dialogs
            subprocess.run(
                ["xdotool", "mousemove", str(x), str(y)],
                env={"DISPLAY": self.display},
                check=True
            )
            time.sleep(0.1)
            subprocess.run(
                ["xdotool", "click", "1"],
                env={"DISPLAY": self.display},
                check=True
            )
            print(f"Clicked at screen position ({x}, {y})")
        except subprocess.CalledProcessError as e:
            print(f"Error clicking: {e}")
            
    def type_text(self, text):
        """Type text at the current mouse/keyboard focus."""
        try:
            # Just type - xdotool will type to whatever has focus
            # No need to find or activate a specific window
            subprocess.run(
                ["xdotool", "type", "--delay", "50", "--", text],
                env={"DISPLAY": self.display},
                check=True
            )
            print(f"Typed: {text}")
        except subprocess.CalledProcessError as e:
            print(f"Error typing: {e}")
            
    def key(self, keyname):
        """Send a keyboard key (e.g., Return, Tab, Escape, ctrl+a)."""
        try:
            subprocess.run(
                ["xdotool", "key", keyname],
                env={"DISPLAY": self.display},
                check=True
            )
            print(f"Pressed key: {keyname}")
        except subprocess.CalledProcessError as e:
            print(f"Error sending key: {e}")
            
    def ocr(self):
        """Extract text from current screen using OCR."""
        try:
            import pytesseract
            from PIL import Image, ImageEnhance
            import cv2
            
            # Always take a fresh screenshot
            temp_file = "/tmp/ocr_screenshot.png"
            print(f"Taking screenshot to {temp_file}...")
            result = self.screenshot(temp_file)
            if not result:
                print("Failed to take screenshot for OCR")
                return
            
            # Run OCR with preprocessing
            img = Image.open(temp_file)
            print(f"Image size: {img.size}, mode: {img.mode}")
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Upscale 3x for better OCR on small button text
            width, height = img.size
            img = img.resize((width * 3, height * 3), Image.LANCZOS)
            
            # Moderate contrast enhancement
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.5)
            
            # Convert to grayscale
            img_gray = img.convert('L')
            
            # Run OCR on normal grayscale
            text1 = pytesseract.image_to_string(img_gray, config=r'--oem 3 --psm 6')
            
            # Also try extracting white text on colored backgrounds (like buttons)
            # Convert to numpy array for OpenCV processing
            img_np = np.array(img)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            
            # Convert to HSV to better isolate colors
            img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
            
            # Create mask for bright/white pixels with more lenient thresholds
            # This should catch light gray and white text
            lower_white = np.array([0, 0, 150])  # Lower threshold for brightness
            upper_white = np.array([180, 80, 255])  # Allow more saturation
            mask_white = cv2.inRange(img_hsv, lower_white, upper_white)
            
            # Dilate to connect nearby white pixels (helps with anti-aliased text)
            kernel = np.ones((2, 2), np.uint8)
            mask_white = cv2.dilate(mask_white, kernel, iterations=1)
            
            # Create white text on black background image
            white_text_img = cv2.bitwise_and(img_bgr, img_bgr, mask=mask_white)
            white_text_gray = cv2.cvtColor(white_text_img, cv2.COLOR_BGR2GRAY)
            
            # Threshold to make it pure black and white
            _, white_text_thresh = cv2.threshold(white_text_gray, 1, 255, cv2.THRESH_BINARY)
            
            # Apply morphological operations to clean up
            white_text_thresh = cv2.morphologyEx(white_text_thresh, cv2.MORPH_CLOSE, kernel)
            
            # Save for debugging
            cv2.imwrite("/tmp/ocr_white_text.png", white_text_thresh)
            print("White text extraction saved to /tmp/ocr_white_text.png")
            
            # Run OCR on the white text extraction with PSM 11 (sparse text - better for buttons)
            text2 = pytesseract.image_to_string(white_text_thresh, config=r'--oem 3 --psm 11')
            
            # Also try with PSM 6 for better structured text
            text3 = pytesseract.image_to_string(white_text_thresh, config=r'--oem 3 --psm 6')
            
            # Combine results
            all_text = text1
            
            # Add white text results if they're different
            white_texts = []
            if text2.strip():
                white_texts.append(text2.strip())
            if text3.strip() and text3.strip() not in white_texts:
                white_texts.append(text3.strip())
            
            if white_texts:
                all_text += "\n\n[White text on colored backgrounds:]\n" + "\n".join(white_texts)
            
            if not all_text.strip():
                print("No text found. The screenshot might be blank or contain no readable text.")
                print(f"Check the screenshot at: {temp_file}")
            else:
                print("=== OCR Results ===")
                print(all_text)
                print("===================")
            
            return all_text
            
        except ImportError:
            print("Error: pytesseract not installed. Install with: pip install pytesseract")
            print("Also requires tesseract-ocr system package: sudo apt-get install tesseract-ocr")
        except Exception as e:
            print(f"Error during OCR: {e}")
            return text
        except ImportError:
            print("Error: pytesseract not installed. Install with: pip install pytesseract")
            print("Also requires tesseract-ocr system package: sudo apt-get install tesseract-ocr")
        except Exception as e:
            print(f"Error during OCR: {e}")
            
    def cleanup(self):
        """Clean up the browser process."""
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except:
                self.process.kill()
        print("Browser closed.")


def repl(controller):
    """Run the interactive REPL."""
    print("\nBrowser REPL started!")
    print("Available commands:")
    print("  screenshot [FILE] - Save screenshot (default: screen.png)")
    print("  click X Y         - Click at absolute screen coordinates (X, Y)")
    print("  type TEXT         - Type TEXT into focused element")
    print("  key KEYNAME       - Press key (e.g., Return, Tab, Escape, ctrl+a)")
    print("  ocr               - Take screenshot and extract text using OCR")
    print("  quit/exit         - Exit the REPL")
    print()
    
    while True:
        try:
            line = input("browser> ").strip()
            
            if not line:
                continue
                
            parts = line.split(None, 1)
            cmd = parts[0].lower()
            
            if cmd in ["quit", "exit"]:
                break
            elif cmd == "screenshot":
                if len(parts) < 2:
                    controller.screenshot()  # Use default
                else:
                    controller.screenshot(parts[1])
            elif cmd == "click":
                if len(parts) < 2:
                    print("Usage: click X Y")
                else:
                    coords = parts[1].split()
                    if len(coords) != 2:
                        print("Usage: click X Y")
                    else:
                        try:
                            x, y = int(coords[0]), int(coords[1])
                            controller.click(x, y)
                        except ValueError:
                            print("Error: X and Y must be integers")
            elif cmd == "type":
                if len(parts) < 2:
                    print("Usage: type TEXT")
                else:
                    controller.type_text(parts[1])
            elif cmd == "key":
                if len(parts) < 2:
                    print("Usage: key KEYNAME")
                else:
                    controller.key(parts[1])
            elif cmd == "ocr":
                controller.ocr()
            else:
                print(f"Unknown command: {cmd}")
                
        except KeyboardInterrupt:
            print("\nUse 'quit' or 'exit' to close.")
        except EOFError:
            break


def main():
    url = os.environ.get("URL", "https://www.wikipedia.org")
    
    controller = BrowserController(url)
    
    try:
        controller.launch_chrome()
        repl(controller)
    finally:
        controller.cleanup()


if __name__ == "__main__":
    main()
