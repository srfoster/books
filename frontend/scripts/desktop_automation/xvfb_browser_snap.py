# Example:
# URL="https://www.wikipedia.org" OUT="screen.png" xvfb-run -a -s "-screen 0 1280x720x24" python3 xvfb_browser_snap.py

import os
import time
import subprocess
import numpy as np
import mss
import cv2

URL = os.environ.get("URL", "https://example.com")
OUT = os.environ.get("OUT", "screen.png")

def launch_chrome(url: str):
    # Try common Chrome/Chromium binary names
    candidates = ["google-chrome", "chromium", "chromium-browser"]
    chrome = None
    for c in candidates:
        if subprocess.call(["bash", "-lc", f"command -v {c} >/dev/null 2>&1"]) == 0:
            chrome = c
            break
    if chrome is None:
        raise RuntimeError("Could not find google-chrome/chromium/chromium-browser in PATH")

    # Use a separate user data directory to avoid connecting to existing Chrome instances
    # This prevents Chrome from opening on your main display when another instance is running
    import tempfile
    user_data_dir = tempfile.mkdtemp(prefix="chrome-xvfb-")
    
    # Launch a visible window (inside Xvfb virtual display)
    # --no-sandbox helps in some containerized environments; remove if undesired.
    args = [
        chrome,
        "--new-window",
        "--window-size=1280,720",
        "--window-position=0,0",
        "--disable-gpu",
        "--no-sandbox",
        f"--user-data-dir={user_data_dir}",  # Separate profile = separate instance
        url,
    ]
    
    # Explicitly pass the DISPLAY environment variable to Chrome
    env = os.environ.copy()
    display = os.environ.get('DISPLAY', ':0')
    env['DISPLAY'] = display
    print(f"Launching Chrome on DISPLAY={display} with temp profile: {user_data_dir}")
    
    return subprocess.Popen(args, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def screenshot_virtual_screen(out_path: str):
    with mss.mss() as sct:
        mon = sct.monitors[1]  # first monitor in virtual display
        img = np.array(sct.grab(mon))  # BGRA
        bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        cv2.imwrite(out_path, bgr)

def main():
    display = os.environ.get('DISPLAY')
    print(f"DISPLAY={display} URL={URL}")
    
    if not display or display == ':0':
        print("WARNING: Running on main display :0, not a virtual display!")
        print("Make sure you're running with: xvfb-run -a python3 script.py")
    
    p = launch_chrome(URL)

    # Give the browser time to render.
    # For robust waiting you can later add image-based "page loaded" checks.
    time.sleep(4)

    screenshot_virtual_screen(OUT)
    print(f"Wrote {OUT}")

    # Cleanup (optional)
    try:
        p.terminate()
    except Exception:
        pass

if __name__ == "__main__":
    main()