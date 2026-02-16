import os
import time
from datetime import datetime
import threading
import tkinter as tk
from tkinter import filedialog

from pynput import keyboard
import mss
from PIL import Image

# ----------------------------
# Configuration
# ----------------------------
SAVE_DIR = None  # Will be set by user dialog
# Accept both left and right modifier keys
CTRL_KEYS = {keyboard.Key.ctrl_l, keyboard.Key.ctrl_r}
ALT_KEYS = {keyboard.Key.alt_l, keyboard.Key.alt_r}
# S key can come as 's', 'S', or key code 83
TRIGGER_KEYS = {keyboard.KeyCode.from_char('s'), keyboard.KeyCode.from_char('S'), keyboard.KeyCode(vk=83)}
FILENAME_FMT = "%Y-%m-%d_%H-%M-%S"              # timestamp format


# ----------------------------
# Directory selection
# ----------------------------
def prompt_save_directory() -> str:
    """Show dialog to select save directory."""
    root = tk.Tk()
    root.withdraw()  # Hide the root window
    root.attributes('-topmost', True)  # Bring dialog to front
    
    directory = filedialog.askdirectory(
        title="Select folder to save screenshots",
        mustexist=True
    )
    root.destroy()
    
    if not directory:
        print("No directory selected. Exiting.")
        exit(1)
    
    return directory


# ----------------------------
# Screenshot capture
# ----------------------------
def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)

def save_clipboard_text() -> str:
    """Save clipboard text to a timestamped file."""
    ensure_dir(SAVE_DIR)
    
    # Get clipboard content
    root = tk.Tk()
    root.withdraw()
    try:
        clipboard_text = root.clipboard_get()
    except tk.TclError:
        print("Clipboard is empty or contains non-text content")
        root.destroy()
        return None
    root.destroy()
    
    if not clipboard_text.strip():
        print("Clipboard is empty")
        return None
    
    ts = datetime.now().strftime(FILENAME_FMT)
    filename = f"{ts}.txt"
    out_path = os.path.join(SAVE_DIR, filename)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(clipboard_text)
    
    return out_path

def save_region_png(left: int, top: int, right: int, bottom: int) -> str:
    ensure_dir(SAVE_DIR)

    x1, x2 = sorted([left, right])
    y1, y2 = sorted([top, bottom])

    w = max(1, x2 - x1)
    h = max(1, y2 - y1)

    ts = datetime.now().strftime(FILENAME_FMT)
    filename = f"{ts}.png"
    out_path = os.path.join(SAVE_DIR, filename)

    with mss.mss() as sct:
        monitor = {"left": x1, "top": y1, "width": w, "height": h}
        shot = sct.grab(monitor)
        # MSS gives BGRA; convert to PIL Image
        img = Image.frombytes("RGBA", shot.size, shot.bgra, "raw", "BGRA")
        img.save(out_path, "PNG")

    return out_path


# ----------------------------
# Tk region selection overlay
# ----------------------------
class RegionSelector:
    def __init__(self):
        self.root = tk.Tk()
        self.root.withdraw()  # hide until we configure

        # Fullscreen transparent-ish overlay
        self.root.attributes("-fullscreen", True)
        self.root.attributes("-topmost", True)
        self.root.attributes("-alpha", 0.25)  # transparency

        self.canvas = tk.Canvas(self.root, cursor="cross", bg="black")
        self.canvas.pack(fill=tk.BOTH, expand=True)

        self.start_x = None
        self.start_y = None
        self.rect_id = None
        self.result = None  # (x1,y1,x2,y2) or None

        self.canvas.bind("<ButtonPress-1>", self.on_press)
        self.canvas.bind("<B1-Motion>", self.on_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_release)

        # ESC cancels
        self.root.bind("<Escape>", lambda e: self.cancel())

        self.root.deiconify()

    def on_press(self, event):
        self.start_x = self.root.winfo_pointerx()
        self.start_y = self.root.winfo_pointery()
        self.rect_id = self.canvas.create_rectangle(
            self.start_x, self.start_y, self.start_x, self.start_y,
            outline="white", width=2
        )

    def on_drag(self, event):
        if self.rect_id is None:
            return
        cur_x = self.root.winfo_pointerx()
        cur_y = self.root.winfo_pointery()
        self.canvas.coords(self.rect_id, self.start_x, self.start_y, cur_x, cur_y)

    def on_release(self, event):
        if self.rect_id is None:
            self.cancel()
            return
        end_x = self.root.winfo_pointerx()
        end_y = self.root.winfo_pointery()
        self.result = (self.start_x, self.start_y, end_x, end_y)
        self.root.quit()

    def cancel(self):
        self.result = None
        self.root.quit()

    def run(self):
        self.root.mainloop()
        self.root.destroy()
        return self.result


# ----------------------------
# Hotkey handling
# ----------------------------
pressed = set()
busy_lock = threading.Lock()
escape_count = 0
escape_threshold = 5

def start_snip_flow():
    # Prevent re-entry if hotkey pressed multiple times quickly
    if not busy_lock.acquire(blocking=False):
        return
    try:
        selector = RegionSelector()
        coords = selector.run()
        if not coords:
            return
        out = save_region_png(*coords)
        # Optional: tiny feedback in console
        print(f"Saved: {out}")
    finally:
        busy_lock.release()

def save_clipboard_flow():
    """Save clipboard content to text file."""
    if not busy_lock.acquire(blocking=False):
        return
    try:
        out = save_clipboard_text()
        if out:
            print(f"Saved clipboard to: {out}")
    finally:
        busy_lock.release()

def on_press(key):
    global escape_count
    
    # Check for 5 Escapes in a row to exit
    if key == keyboard.Key.esc:
        escape_count += 1
        if escape_count >= escape_threshold:
            print("\nExiting...")
            return False  # Stop listener
        print(f"Escape pressed {escape_count}/{escape_threshold} times")
        return
    else:
        escape_count = 0  # Reset if any other key is pressed
    
    # Check for Ctrl+C to save clipboard
    if hasattr(key, 'char') and key.char == '\x03':
        print("  -> Saving clipboard content!")
        threading.Thread(target=save_clipboard_flow, daemon=True).start()
        return
    
    pressed.add(key)
    # Debug output
    print(f"Key pressed: {key}, Current pressed: {pressed}")
    
    # Check if we have Ctrl (left or right), Alt (left or right), and 's' all pressed
    has_ctrl = bool(pressed & CTRL_KEYS)
    has_alt = bool(pressed & ALT_KEYS)
    
    # Check for S key by looking at vk attribute (virtual key code 83) or char
    has_trigger = False
    for k in pressed:
        if hasattr(k, 'vk') and k.vk == 83:  # S key
            has_trigger = True
            break
        if hasattr(k, 'char') and k.char in ('s', 'S'):
            has_trigger = True
            break
    
    print(f"  has_ctrl={has_ctrl}, has_alt={has_alt}, has_trigger={has_trigger}")
    
    if has_ctrl and has_alt and has_trigger:
        print("  -> Triggering screenshot!")
        # run snip UI on a separate thread so listener doesn't freeze
        threading.Thread(target=start_snip_flow, daemon=True).start()

def on_release(key):
    if key in pressed:
        pressed.discard(key)  # Use discard to avoid KeyError

def main():
    global SAVE_DIR
    SAVE_DIR = prompt_save_directory()
    ensure_dir(SAVE_DIR)
    print(f"SnipShot running. Hotkeys:")
    print(f"  - Ctrl+Alt+S: Take screenshot")
    print(f"  - Ctrl+C: Save clipboard text to file")
    print(f"Saving to: {SAVE_DIR}")
    print(f"Press Escape 5 times in a row to exit")
    print(f"\nDebug mode enabled - watching for keys...")
    try:
        with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
            listener.join()
    except KeyboardInterrupt:
        print("\nExiting...")
        exit(0)

if __name__ == "__main__":
    main()
