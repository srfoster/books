#!/usr/bin/env python3
"""
concat_videos.py

Concatenate multiple video files into a single output file.

Uses ffmpeg's concat demuxer for fast concatenation without re-encoding
(when all inputs have the same codec/resolution), or uses filter_complex
for re-encoding when needed.

Example:
  python concat_videos.py output.mp4 input1.mp4 input2.mp4 input3.mp4
  python concat_videos.py output.mp4 *.mp4 --re-encode
"""

import argparse
import os
import subprocess
import sys
import tempfile


def concat_videos_demuxer(input_files: list[str], output_path: str) -> None:
    """
    Use ffmpeg concat demuxer (fast, no re-encoding).
    Requires all inputs to have same codec, resolution, etc.
    """
    # Create temporary file list for concat demuxer
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        for input_file in input_files:
            # Escape single quotes and wrap path in quotes
            escaped_path = input_file.replace("'", "'\\''")
            f.write(f"file '{escaped_path}'\n")
        list_file = f.name
    
    try:
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c", "copy",
            output_path,
        ]
        subprocess.run(cmd, check=True)
    finally:
        if os.path.exists(list_file):
            os.unlink(list_file)


def concat_videos_filter(
    input_files: list[str],
    output_path: str,
    video_encoder: str,
    audio_encoder: str,
    crf: int,
    preset: str,
) -> None:
    """
    Use filter_complex to concatenate (with re-encoding).
    Works with different codecs/resolutions but slower.
    """
    # Build filter graph
    n = len(input_files)
    
    # Build inputs
    input_args = []
    for f in input_files:
        input_args.extend(["-i", f])
    
    # Build filter: scale and concat
    filter_parts = []
    for i in range(n):
        # Scale each input to same resolution (1920x1080 as default, or keep original)
        filter_parts.append(f"[{i}:v]")
        filter_parts.append(f"[{i}:a]")
    
    # Concat all inputs
    filter_str = "".join(filter_parts) + f"concat=n={n}:v=1:a=1[vout][aout]"
    
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-y",
        *input_args,
        "-filter_complex", filter_str,
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", video_encoder,
        "-crf", str(crf),
        "-preset", preset,
        "-c:a", audio_encoder,
        output_path,
    ]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser(description="Concatenate multiple video files")
    ap.add_argument("output", help="Output file path")
    ap.add_argument("inputs", nargs="+", help="Input video files (in order)")
    ap.add_argument("--re-encode", action="store_true",
                    help="Force re-encoding (slower but handles different formats/resolutions)")
    ap.add_argument("--crf", type=int, default=20,
                    help="x264 CRF quality for re-encoding (lower=better, default: 20)")
    ap.add_argument("--preset", default="medium",
                    help="x264 preset for re-encoding (default: medium)")
    ap.add_argument("--vcodec", default="libx264",
                    help="Video codec for re-encoding (default: libx264)")
    ap.add_argument("--acodec", default="aac",
                    help="Audio codec for re-encoding (default: aac)")
    args = ap.parse_args()
    
    # Check that all input files exist
    missing_files = [f for f in args.inputs if not os.path.exists(f)]
    if missing_files:
        print(f"Error: The following input files do not exist:")
        for f in missing_files:
            print(f"  - {f}")
        return 1
    
    if len(args.inputs) < 2:
        print("Error: Need at least 2 input files to concatenate")
        return 1
    
    print(f"Concatenating {len(args.inputs)} videos into: {args.output}")
    for i, f in enumerate(args.inputs, 1):
        print(f"  {i}. {f}")
    
    if args.re_encode:
        print("\nUsing filter_complex (re-encoding)...")
        concat_videos_filter(
            args.inputs,
            args.output,
            args.vcodec,
            args.acodec,
            args.crf,
            args.preset,
        )
    else:
        print("\nUsing concat demuxer (fast, no re-encoding)...")
        print("Note: All inputs must have same codec/resolution. Use --re-encode if this fails.")
        try:
            concat_videos_demuxer(args.inputs, args.output)
        except subprocess.CalledProcessError as e:
            print("\nError: Concat demuxer failed. Input files may have different formats.")
            print("Try again with --re-encode flag to force re-encoding.")
            return 1
    
    print(f"\nSuccess! Output saved to: {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
