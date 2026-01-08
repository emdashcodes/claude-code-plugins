#!/usr/bin/env python3

"""
edit_video.py
Video editing operations using FFmpeg (clip, merge, split)

Usage:
    python edit_video.py clip <input> <start> <end> <output>
    python edit_video.py merge <output> <input1> <input2> [input3...]
    python edit_video.py split <input> <duration> <prefix>

Examples:
    python edit_video.py clip video.mp4 00:01:30 00:02:45 clip.mp4
    python edit_video.py merge final.mp4 part1.mp4 part2.mp4 part3.mp4
    python edit_video.py split long.mp4 300 segment
"""

import sys
import os
import subprocess
import json
from pathlib import Path
import re


def parse_timestamp(timestamp):
    """
    Parse timestamp to seconds

    Supports formats:
    - HH:MM:SS
    - MM:SS
    - Seconds (int or float)

    Returns:
        Seconds as float, or None if invalid
    """
    if isinstance(timestamp, (int, float)):
        return float(timestamp)

    # Try to parse as number
    try:
        return float(timestamp)
    except ValueError:
        pass

    # Try HH:MM:SS or MM:SS format
    patterns = [
        r'^(\d+):(\d+):(\d+(?:\.\d+)?)$',  # HH:MM:SS or HH:MM:SS.mmm
        r'^(\d+):(\d+(?:\.\d+)?)$'  # MM:SS or MM:SS.mmm
    ]

    for pattern in patterns:
        match = re.match(pattern, timestamp)
        if match:
            groups = match.groups()
            if len(groups) == 3:  # HH:MM:SS
                hours, minutes, seconds = groups
                return int(hours) * 3600 + int(minutes) * 60 + float(seconds)
            elif len(groups) == 2:  # MM:SS
                minutes, seconds = groups
                return int(minutes) * 60 + float(seconds)

    return None


def clip_video(input_path, start_time, end_time, output_path):
    """
    Extract a clip from video

    Args:
        input_path: Path to input video
        start_time: Start timestamp (HH:MM:SS, MM:SS, or seconds)
        end_time: End timestamp (HH:MM:SS, MM:SS, or seconds)
        output_path: Path to output video

    Returns:
        True if successful, False otherwise
    """

    # Validate input
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return False

    # Parse timestamps
    start_seconds = parse_timestamp(start_time)
    end_seconds = parse_timestamp(end_time)

    if start_seconds is None:
        print(f"Error: Invalid start time: {start_time}", file=sys.stderr)
        return False

    if end_seconds is None:
        print(f"Error: Invalid end time: {end_time}", file=sys.stderr)
        return False

    if start_seconds >= end_seconds:
        print(f"Error: Start time must be before end time", file=sys.stderr)
        return False

    duration = end_seconds - start_seconds

    # Create output directory
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # FFmpeg command
    # Using -ss after -i for better accuracy with audio sync
    # Explicitly map video and audio streams
    cmd = [
        'ffmpeg',
        '-i', input_path,
        '-ss', str(start_seconds),  # Seek to start
        '-t', str(duration),  # Duration
        '-map', '0:v',  # Map video stream
        '-map', '0:a',  # Map audio stream
        '-c:v', 'copy',  # Copy video (no re-encoding)
        '-c:a', 'copy',  # Copy audio (no re-encoding)
        '-y',  # Overwrite
        output_path
    ]

    print(f"Clipping video...")
    print(f"  Input: {input_path}")
    print(f"  Start: {start_time} ({start_seconds:.2f}s)")
    print(f"  End: {end_time} ({end_seconds:.2f}s)")
    print(f"  Duration: {duration:.2f}s")
    print(f"  Output: {output_path}")

    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✓ Clip created successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return False


def merge_videos(output_path, *input_paths):
    """
    Merge multiple videos into one

    Args:
        output_path: Path to output video
        *input_paths: Paths to input videos (in order)

    Returns:
        True if successful, False otherwise
    """

    # Validate inputs
    for input_path in input_paths:
        if not os.path.exists(input_path):
            print(f"Error: Input file not found: {input_path}", file=sys.stderr)
            return False

    if len(input_paths) < 2:
        print(f"Error: Need at least 2 videos to merge", file=sys.stderr)
        return False

    # Create output directory
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Create concat file list
    concat_file = "/tmp/ffmpeg_concat_list.txt"
    with open(concat_file, 'w') as f:
        for input_path in input_paths:
            # Use absolute paths
            abs_path = os.path.abspath(input_path)
            f.write(f"file '{abs_path}'\n")

    # FFmpeg command
    cmd = [
        'ffmpeg',
        '-f', 'concat',
        '-safe', '0',
        '-i', concat_file,
        '-c', 'copy',  # Copy streams (fast)
        output_path,
        '-y'  # Overwrite
    ]

    print(f"Merging videos...")
    for i, input_path in enumerate(input_paths, 1):
        print(f"  {i}. {input_path}")
    print(f"  Output: {output_path}")

    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✓ Videos merged successfully")

        # Clean up concat file
        os.remove(concat_file)

        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        if os.path.exists(concat_file):
            os.remove(concat_file)
        return False


def split_video(input_path, segment_duration, output_prefix):
    """
    Split video into segments of specified duration

    Args:
        input_path: Path to input video
        segment_duration: Duration of each segment in seconds
        output_prefix: Prefix for output files (e.g., "seg" → seg_001.mp4, seg_002.mp4)

    Returns:
        True if successful, False otherwise
    """

    # Validate input
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return False

    try:
        duration_seconds = float(segment_duration)
        if duration_seconds <= 0:
            print(f"Error: Duration must be positive", file=sys.stderr)
            return False
    except ValueError:
        print(f"Error: Invalid duration: {segment_duration}", file=sys.stderr)
        return False

    # Get file extension
    input_ext = Path(input_path).suffix

    # FFmpeg command
    output_pattern = f"{output_prefix}_%03d{input_ext}"

    cmd = [
        'ffmpeg',
        '-i', input_path,
        '-c', 'copy',  # Copy streams (fast)
        '-f', 'segment',
        '-segment_time', str(duration_seconds),
        '-reset_timestamps', '1',
        output_pattern,
        '-y'  # Overwrite
    ]

    print(f"Splitting video...")
    print(f"  Input: {input_path}")
    print(f"  Segment duration: {duration_seconds}s")
    print(f"  Output pattern: {output_pattern}")

    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✓ Video split successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Clip:  python edit_video.py clip <input> <start> <end> <output>")
        print("  Merge: python edit_video.py merge <output> <input1> <input2> [input3...]")
        print("  Split: python edit_video.py split <input> <duration> <prefix>")
        print()
        print("Examples:")
        print("  python edit_video.py clip video.mp4 00:01:30 00:02:45 clip.mp4")
        print("  python edit_video.py merge final.mp4 part1.mp4 part2.mp4 part3.mp4")
        print("  python edit_video.py split long.mp4 300 segment")
        sys.exit(1)

    operation = sys.argv[1].lower()

    if operation == "clip":
        if len(sys.argv) != 6:
            print("Usage: python edit_video.py clip <input> <start> <end> <output>")
            sys.exit(1)

        input_path = sys.argv[2]
        start_time = sys.argv[3]
        end_time = sys.argv[4]
        output_path = sys.argv[5]

        success = clip_video(input_path, start_time, end_time, output_path)

    elif operation == "merge":
        if len(sys.argv) < 5:
            print("Usage: python edit_video.py merge <output> <input1> <input2> [input3...]")
            sys.exit(1)

        output_path = sys.argv[2]
        input_paths = sys.argv[3:]

        success = merge_videos(output_path, *input_paths)

    elif operation == "split":
        if len(sys.argv) != 5:
            print("Usage: python edit_video.py split <input> <duration> <prefix>")
            sys.exit(1)

        input_path = sys.argv[2]
        segment_duration = sys.argv[3]
        output_prefix = sys.argv[4]

        success = split_video(input_path, segment_duration, output_prefix)

    else:
        print(f"Error: Unknown operation '{operation}'", file=sys.stderr)
        print("Valid operations: clip, merge, split", file=sys.stderr)
        sys.exit(1)

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
