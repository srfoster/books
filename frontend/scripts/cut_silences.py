#!/usr/bin/env python3
"""
remove_silence.py

Create a new video where silences longer than X seconds are removed.

Uses ffmpeg's silencedetect to find silence ranges, then builds a filtergraph
that keeps the non-silent ranges and concatenates them.

Can process either a single file or a folder:
- Single file: Removes silences and outputs to specified file
- Folder: Processes all video files in folder, removes silences from each,
  and concatenates them into a single output file named after the folder

Example (single file):
  python remove_silence.py input.mp4 output.mp4 --min_silence 1.0 --silence_db -35 --pad 0.08

Example (folder):
  python remove_silence.py my_video_folder --min_silence 1.0 --silence_db -35
  # Creates my_video_folder.mp4 with all videos concatenated

Example (process each file in folder individually with default settings):
  for f in folder/*.mp4; do python cut_silences.py "$f" "${f%.mp4}-trimmed.mp4"; done
"""

import argparse
import os
import re
import subprocess
import tempfile
import glob
import shutil
from dataclasses import dataclass
from typing import List, Tuple, Optional


@dataclass
class Silence:
    start: float
    end: float


def run_ffmpeg_silencedetect(
    input_path: str,
    silence_db: float,
    min_silence: float,
    ignore_clicks: bool = False,
) -> str:
    """
    Runs ffmpeg silencedetect and returns stderr text (where silencedetect logs).
    If ignore_clicks is True, applies filtering to reduce keyboard click interference.
    """
    # Build audio filter chain
    filters = []
    
    if ignore_clicks:
        # Highpass filter to remove low-frequency pops/thumps
        filters.append("highpass=f=200")
        # Lowpass to focus on speech frequencies and ignore high-frequency clicks
        filters.append("lowpass=f=3000")
    
    # Add silence detection
    filters.append(f"silencedetect=noise={silence_db}dB:d={min_silence}")
    
    filter_chain = ",".join(filters)
    
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-i", input_path,
        "-af", filter_chain,
        "-f", "null",
        "-",
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    # silencedetect prints to stderr
    return proc.stderr


def parse_silences(ffmpeg_stderr: str) -> List[Silence]:
    """
    Parses silencedetect output and returns Silence intervals.
    """
    # Lines look like:
    # [silencedetect @ ...] silence_start: 12.345
    # [silencedetect @ ...] silence_end: 15.678 | silence_duration: 3.333
    start_re = re.compile(r"silence_start:\s*(\d+(\.\d+)?)")
    end_re = re.compile(r"silence_end:\s*(\d+(\.\d+)?)")

    silences: List[Silence] = []
    current_start: Optional[float] = None

    for line in ffmpeg_stderr.splitlines():
        m1 = start_re.search(line)
        if m1:
            current_start = float(m1.group(1))
            continue

        m2 = end_re.search(line)
        if m2 and current_start is not None:
            end = float(m2.group(1))
            silences.append(Silence(start=current_start, end=end))
            current_start = None

    # If the file ends during silence, silencedetect may not emit a silence_end.
    # We'll handle that later by using overall duration if needed (optional).
    return silences


def get_duration_seconds(input_path: str) -> float:
    """
    Uses ffprobe to get duration in seconds.
    """
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        input_path,
    ]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(proc.stdout.strip())
    except subprocess.CalledProcessError as e:
        print(f"Error getting duration from '{input_path}':")
        print(f"  Return code: {e.returncode}")
        print(f"  stderr: {e.stderr}")
        print(f"  stdout: {e.stdout}")
        raise


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def invert_intervals(
    silences: List[Silence],
    duration: float,
    pad: float,
) -> List[Tuple[float, float]]:
    """
    Given silence intervals, return keep-intervals (non-silent).
    pad: seconds to keep on BOTH sides of a removed silence (i.e., shrink cut a bit)
    """
    # Convert silences to cut intervals with padding applied:
    cuts: List[Silence] = []
    for s in silences:
        cut_start = clamp(s.start + pad, 0.0, duration)
        cut_end = clamp(s.end - pad, 0.0, duration)
        if cut_end > cut_start:
            cuts.append(Silence(cut_start, cut_end))

    # Merge overlapping cuts
    cuts.sort(key=lambda s: s.start)
    merged: List[Silence] = []
    for c in cuts:
        if not merged or c.start > merged[-1].end:
            merged.append(c)
        else:
            merged[-1].end = max(merged[-1].end, c.end)

    # Invert to keep intervals
    keeps: List[Tuple[float, float]] = []
    t = 0.0
    for c in merged:
        if c.start > t:
            keeps.append((t, c.start))
        t = max(t, c.end)
    if t < duration:
        keeps.append((t, duration))

    # Drop tiny segments
    keeps = [(a, b) for (a, b) in keeps if b - a > 1e-3]
    return keeps


def build_filtergraph(keeps: List[Tuple[float, float]]) -> str:
    """
    Builds an ffmpeg filter_complex that trims video+audio and concatenates.
    """
    parts = []
    for i, (a, b) in enumerate(keeps):
        # trim video, reset timestamps
        parts.append(
            f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]"
        )
        # trim audio, reset timestamps
        parts.append(
            f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]"
        )

    # Interleave video and audio inputs for concat filter
    interleaved_inputs = "".join([f"[v{i}][a{i}]" for i in range(len(keeps))])

    parts.append(f"{interleaved_inputs}concat=n={len(keeps)}:v=1:a=1[vout][aout]")
    return ";".join(parts)


def run_ffmpeg_cut(
    input_path: str,
    output_path: str,
    filtergraph: str,
    video_encoder: str,
    audio_encoder: str,
    crf: int,
    preset: str,
) -> None:
    # Write filtergraph to temp file to avoid Windows command line length limit
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(filtergraph)
        filter_file = f.name
    
    try:
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-y",
            "-i", input_path,
            "-filter_complex_script", filter_file,
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", video_encoder,
            "-crf", str(crf),
            "-preset", preset,
            "-c:a", audio_encoder,
            output_path,
        ]
        subprocess.run(cmd, check=True)
    finally:
        # Clean up temp file
        if os.path.exists(filter_file):
            os.unlink(filter_file)


def concatenate_videos(input_files: List[str], output_path: str, video_encoder: str, audio_encoder: str, crf: int, preset: str) -> None:
    """
    Concatenate multiple video files using ffmpeg concat demuxer.
    """
    # Create a temporary concat list file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        for input_file in input_files:
            # Escape single quotes and wrap in single quotes for ffmpeg concat
            escaped = input_file.replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")
        concat_file = f.name
    
    try:
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c:v", video_encoder,
            "-crf", str(crf),
            "-preset", preset,
            "-c:a", audio_encoder,
            output_path,
        ]
        subprocess.run(cmd, check=True)
    finally:
        # Clean up temp file
        if os.path.exists(concat_file):
            os.unlink(concat_file)


def process_single_file(
    input_path: str,
    output_path: str,
    silence_threshold: float,
    min_silence: float,
    ignore_clicks: bool,
    pad: float,
    video_encoder: str,
    audio_encoder: str,
    crf: int,
    preset: str,
) -> bool:
    """
    Process a single video file to remove silences.
    Returns True if processing was successful, False otherwise.
    """
    print(f"Processing: {input_path}")
    
    stderr = run_ffmpeg_silencedetect(input_path, silence_threshold, min_silence, ignore_clicks)
    silences = parse_silences(stderr)

    duration = get_duration_seconds(input_path)

    # Handle trailing silence_start without silence_end (optional best-effort)
    last_start_matches = re.findall(r"silence_start:\s*(\d+(\.\d+)?)", stderr)
    last_end_matches = re.findall(r"silence_end:\s*(\d+(\.\d+)?)", stderr)
    if len(last_start_matches) > len(last_end_matches) and last_start_matches:
        open_start = float(last_start_matches[-1][0])
        silences.append(Silence(start=open_start, end=duration))

    keeps = invert_intervals(silences, duration, pad)

    if not keeps:
        print(f"Warning: No non-silent segments found in {input_path}. Skipping.")
        return False

    # If nothing to cut, just copy streams
    if len(keeps) == 1 and abs(keeps[0][0] - 0.0) < 1e-6 and abs(keeps[0][1] - duration) < 1e-3:
        # No silence detected that meets criteria
        cmd = ["ffmpeg", "-hide_banner", "-y", "-i", input_path, "-c", "copy", output_path]
        subprocess.run(cmd, check=True)
        return True

    fg = build_filtergraph(keeps)
    run_ffmpeg_cut(
        input_path, output_path, fg,
        video_encoder=video_encoder,
        audio_encoder=audio_encoder,
        crf=crf,
        preset=preset,
    )
    return True


def get_video_files(folder_path: str) -> List[str]:
    """
    Get all video files from a folder, sorted by name.
    """
    video_extensions = ['*.mp4', '*.mkv', '*.avi', '*.mov', '*.flv', '*.wmv', '*.webm', '*.m4v']
    video_files = []
    
    for ext in video_extensions:
        pattern = os.path.join(folder_path, ext)
        video_files.extend(glob.glob(pattern))
    
    # Sort files naturally by name
    video_files.sort()
    return video_files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="Input movie file (mp4/mkv/etc.) or folder containing video files")
    ap.add_argument("output", nargs='?', default=None, help="Output file (optional for folder input - will use folder name)")
    ap.add_argument("--min_silence", type=float, default=1.0,
                    help="Minimum silence duration (seconds) to remove (default: 1.0)")
    ap.add_argument("--silence_db", type=float, default=-20,
                    help="Silence threshold in dB (default: -35). HIGHER values = more aggressive. "
                         "Use -30 or -25 for noisy backgrounds like washing machines. "
                         "Use -40 for quiet recordings.")
    ap.add_argument("--aggressive", action="store_true",
                    help="Use aggressive silence detection (-25 dB) for noisy environments. "
                         "Overrides --silence_db if both are specified.")
    ap.add_argument("--ignore_clicks", action="store_true",
                    help="Apply filtering to ignore keyboard clicks and pops during silence detection. "
                         "Uses bandpass filter (200Hz-3000Hz) to focus on speech frequencies.")
    ap.add_argument("--pad", type=float, default=1,
                    help="Padding kept around each removed silence (seconds) (default: 0.05)")
    ap.add_argument("--crf", type=int, default=20, help="x264 CRF quality (lower=better, default: 20)")
    ap.add_argument("--preset", default="medium", help="x264 preset (default: medium)")
    ap.add_argument("--vcodec", default="libx264", help="Video codec (default: libx264)")
    ap.add_argument("--acodec", default="aac", help="Audio codec (default: aac)")
    args = ap.parse_args()

    # Check if input exists
    if not os.path.exists(args.input):
        print(f"Error: Input does not exist: {args.input}")
        print(f"Current working directory: {os.getcwd()}")
        return 1

    # Determine silence threshold
    if args.aggressive:
        silence_threshold = -25.0
    elif args.silence_db is not None:
        silence_threshold = args.silence_db
    else:
        silence_threshold = -35.0

    # Check if input is a directory
    if os.path.isdir(args.input):
        # Process folder mode
        folder_name = os.path.basename(os.path.normpath(args.input))
        
        # Determine output path
        if args.output:
            output_path = args.output
        else:
            # Place output file adjacent to the input folder (same location)
            input_normalized = os.path.normpath(args.input)
            output_path = input_normalized + ".mp4"
        
        print(f"Processing folder: {args.input}")
        print(f"Output will be: {output_path}")
        
        # Get all video files in folder
        video_files = get_video_files(args.input)
        
        if not video_files:
            print(f"Error: No video files found in folder: {args.input}")
            return 1
        
        print(f"Found {len(video_files)} video file(s)")
        
        # Create temporary directory for processed files
        temp_dir = tempfile.mkdtemp()
        temp_files = []
        
        try:
            # Process each video file
            for i, video_file in enumerate(video_files):
                temp_output = os.path.join(temp_dir, f"processed_{i:04d}.mp4")
                
                success = process_single_file(
                    video_file,
                    temp_output,
                    silence_threshold,
                    args.min_silence,
                    args.ignore_clicks,
                    args.pad,
                    args.vcodec,
                    args.acodec,
                    args.crf,
                    args.preset,
                )
                
                if success:
                    temp_files.append(temp_output)
            
            if not temp_files:
                print("Error: No files were successfully processed")
                return 1
            
            # Concatenate all processed files
            if len(temp_files) == 1:
                # Just one file, rename it to output
                print(f"Only one file processed, moving to output...")
                shutil.move(temp_files[0], output_path)
            else:
                print(f"Concatenating {len(temp_files)} processed files...")
                concatenate_videos(temp_files, output_path, args.vcodec, args.acodec, args.crf, args.preset)
            
            print(f"Done! Output saved to: {output_path}")
            
        finally:
            # Clean up temporary files
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        
        return 0
    
    else:
        # Process single file mode
        if not args.output:
            print("Error: Output file required when input is a file")
            return 1
        
        success = process_single_file(
            args.input,
            args.output,
            silence_threshold,
            args.min_silence,
            args.ignore_clicks,
            args.pad,
            args.vcodec,
            args.acodec,
            args.crf,
            args.preset,
        )
        
        if not success:
            print("Error: Failed to process file")
            return 1
        
        print(f"Done! Output saved to: {args.output}")
        return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())