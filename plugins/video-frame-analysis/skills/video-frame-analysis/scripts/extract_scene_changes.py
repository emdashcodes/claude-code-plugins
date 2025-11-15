#!/usr/bin/env python3
"""
Extract frames from video at scene changes using ffmpeg.

This script uses ffmpeg's scene detection filter to identify significant
visual changes in a video and extracts frames at those moments.
"""

import argparse
import subprocess
import sys
import os


def check_ffmpeg():
    """Check if ffmpeg is installed."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def extract_scene_frames(
    video_path,
    output_dir,
    start_time=None,
    end_time=None,
    threshold=0.3,
    max_frames=100,
    output_pattern="frame_%04d.png"
):
    """
    Extract frames at scene changes from a video.

    Args:
        video_path: Path to input video file
        output_dir: Directory to save extracted frames
        start_time: Start timestamp (e.g., '1:13:00', '00:05:30')
        end_time: End timestamp (e.g., '1:30:00')
        threshold: Scene detection threshold (0-1, default 0.3)
                  Higher = fewer scene changes detected
        max_frames: Maximum number of frames to extract
        output_pattern: Filename pattern (must include %d format specifier)

    Returns:
        Number of frames extracted, or None if error occurred
    """
    # Validate inputs
    if not os.path.exists(video_path):
        print(f"❌ Error: Video file not found: {video_path}", file=sys.stderr)
        return None

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Build ffmpeg command
    cmd = ["ffmpeg"]

    # Add start time if specified
    if start_time:
        cmd.extend(["-ss", start_time])

    # Input file
    cmd.extend(["-i", video_path])

    # Add end time if specified
    if end_time:
        cmd.extend(["-to", end_time])

    # Scene detection filter
    # select='gt(scene,threshold)' selects frames where scene score > threshold
    # showinfo prints frame information including timestamps
    cmd.extend([
        "-vf",
        f"select='gt(scene,{threshold})',showinfo",
        "-vsync", "vfr",
        "-frames:v", str(max_frames),
        os.path.join(output_dir, output_pattern)
    ])

    # Print extraction info
    print(f"🎬 Extracting scene change frames from: {os.path.basename(video_path)}")
    if start_time or end_time:
        time_range = f"From {start_time or 'start'} to {end_time or 'end'}"
        print(f"⏱️  {time_range}")
    print(f"🎯 Scene threshold: {threshold}")
    print(f"📊 Max frames: {max_frames}")
    print()

    # Run extraction
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True
        )

        # Count extracted frames
        frame_files = [
            f for f in os.listdir(output_dir)
            if f.startswith(output_pattern.split('%')[0]) and f.endswith('.png')
        ]
        frame_count = len(frame_files)

        print(f"✅ Extracted {frame_count} frames to: {output_dir}")
        return frame_count

    except subprocess.CalledProcessError as e:
        print(f"❌ Error extracting frames: {e.stderr}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Extract frames from video at scene changes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract scene changes from entire video
  %(prog)s video.mp4 -o ./frames

  # Extract from specific time range
  %(prog)s video.mp4 -o ./frames --start 1:13:00 --end 1:30:00

  # Adjust sensitivity (higher threshold = fewer frames)
  %(prog)s video.mp4 -o ./frames --threshold 0.5

  # Limit number of frames
  %(prog)s video.mp4 -o ./frames --max-frames 50
        """
    )

    parser.add_argument(
        "video",
        help="Path to input video file"
    )

    parser.add_argument(
        "-o", "--output-dir",
        required=True,
        help="Directory to save extracted frames"
    )

    parser.add_argument(
        "--start",
        help="Start timestamp (e.g., '1:13:00', '00:05:30')"
    )

    parser.add_argument(
        "--end",
        help="End timestamp (e.g., '1:30:00')"
    )

    parser.add_argument(
        "--threshold",
        type=float,
        default=0.3,
        help="Scene detection threshold (0-1, default: 0.3). Higher = fewer scenes."
    )

    parser.add_argument(
        "--max-frames",
        type=int,
        default=100,
        help="Maximum number of frames to extract (default: 100)"
    )

    parser.add_argument(
        "--pattern",
        default="frame_%04d.png",
        help="Output filename pattern (default: frame_%%04d.png)"
    )

    args = parser.parse_args()

    # Check for ffmpeg
    if not check_ffmpeg():
        print("❌ Error: ffmpeg is not installed or not in PATH", file=sys.stderr)
        print("Install with: brew install ffmpeg", file=sys.stderr)
        sys.exit(1)

    # Extract frames
    frame_count = extract_scene_frames(
        video_path=args.video,
        output_dir=args.output_dir,
        start_time=args.start,
        end_time=args.end,
        threshold=args.threshold,
        max_frames=args.max_frames,
        output_pattern=args.pattern
    )

    if frame_count is None:
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
