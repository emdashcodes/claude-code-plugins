#!/usr/bin/env python3
"""
Extract frames from video at specific timestamps.

This script extracts frames at regular intervals or specific timestamps,
useful for sampling video content systematically.
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


def extract_at_intervals(
    video_path,
    output_dir,
    start_time=None,
    duration=None,
    interval=30,
    output_pattern="frame_%04d.png"
):
    """
    Extract frames at regular intervals.

    Args:
        video_path: Path to input video file
        output_dir: Directory to save extracted frames
        start_time: Start timestamp (e.g., '1:13:00')
        duration: Duration to extract (in seconds)
        interval: Seconds between frames (default: 30)
        output_pattern: Filename pattern

    Returns:
        Number of frames extracted, or None if error occurred
    """
    # Validate inputs
    if not os.path.exists(video_path):
        print(f"❌ Error: Video file not found: {video_path}", file=sys.stderr)
        return None

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Build ffmpeg command
    cmd = ["ffmpeg"]

    # Add start time if specified
    if start_time:
        cmd.extend(["-ss", start_time])

    # Add duration if specified
    if duration:
        cmd.extend(["-t", str(duration)])

    # Input file
    cmd.extend(["-i", video_path])

    # Extract at interval using fps filter
    # fps=1/30 means one frame every 30 seconds
    cmd.extend([
        "-vf", f"fps=1/{interval}",
        os.path.join(output_dir, output_pattern)
    ])

    # Print extraction info
    print(f"🎬 Extracting frames every {interval}s from: {os.path.basename(video_path)}")
    if start_time:
        print(f"⏱️  Starting at: {start_time}")
    if duration:
        print(f"⏱️  Duration: {duration}s")
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


def extract_at_specific_times(
    video_path,
    output_dir,
    timestamps,
    output_pattern="frame_{timestamp}.png"
):
    """
    Extract frames at specific timestamps.

    Args:
        video_path: Path to input video file
        output_dir: Directory to save extracted frames
        timestamps: List of timestamps (e.g., ['1:13:00', '1:15:30'])
        output_pattern: Filename pattern (use {timestamp} placeholder)

    Returns:
        Number of frames extracted
    """
    if not os.path.exists(video_path):
        print(f"❌ Error: Video file not found: {video_path}", file=sys.stderr)
        return None

    os.makedirs(output_dir, exist_ok=True)

    print(f"🎬 Extracting frames at {len(timestamps)} specific timestamps")
    print()

    success_count = 0

    for timestamp in timestamps:
        # Build output filename
        safe_timestamp = timestamp.replace(':', '-')
        output_file = output_pattern.replace('{timestamp}', safe_timestamp)
        output_path = os.path.join(output_dir, output_file)

        # Build ffmpeg command
        cmd = [
            "ffmpeg",
            "-ss", timestamp,
            "-i", video_path,
            "-frames:v", "1",
            "-y",  # Overwrite
            output_path
        ]

        try:
            subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True
            )
            print(f"✅ {timestamp} → {output_file}")
            success_count += 1
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed at {timestamp}: {e.stderr}", file=sys.stderr)

    print()
    print(f"✅ Extracted {success_count}/{len(timestamps)} frames to: {output_dir}")
    return success_count


def main():
    parser = argparse.ArgumentParser(
        description="Extract frames at specific timestamps or intervals",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract one frame every 30 seconds
  %(prog)s video.mp4 -o ./frames --interval 30

  # Extract frames from 1:13:00 for 5 minutes (300s), one per minute
  %(prog)s video.mp4 -o ./frames --start 1:13:00 --duration 300 --interval 60

  # Extract at specific timestamps
  %(prog)s video.mp4 -o ./frames --timestamps 1:13:00 1:15:30 1:20:00
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

    # Mode 1: Regular intervals
    parser.add_argument(
        "--interval",
        type=int,
        help="Extract one frame every N seconds"
    )

    parser.add_argument(
        "--start",
        help="Start timestamp (e.g., '1:13:00')"
    )

    parser.add_argument(
        "--duration",
        type=int,
        help="Duration to extract (in seconds)"
    )

    # Mode 2: Specific timestamps
    parser.add_argument(
        "--timestamps",
        nargs='+',
        help="List of specific timestamps to extract"
    )

    parser.add_argument(
        "--pattern",
        default="frame_%04d.png",
        help="Output filename pattern"
    )

    args = parser.parse_args()

    # Check for ffmpeg
    if not check_ffmpeg():
        print("❌ Error: ffmpeg is not installed or not in PATH", file=sys.stderr)
        print("Install with: brew install ffmpeg", file=sys.stderr)
        sys.exit(1)

    # Validate mode
    if args.timestamps:
        # Mode: Specific timestamps
        frame_count = extract_at_specific_times(
            video_path=args.video,
            output_dir=args.output_dir,
            timestamps=args.timestamps,
            output_pattern=args.pattern
        )
    elif args.interval:
        # Mode: Regular intervals
        frame_count = extract_at_intervals(
            video_path=args.video,
            output_dir=args.output_dir,
            start_time=args.start,
            duration=args.duration,
            interval=args.interval,
            output_pattern=args.pattern
        )
    else:
        print("❌ Error: Must specify either --interval or --timestamps", file=sys.stderr)
        parser.print_help()
        sys.exit(1)

    if frame_count is None:
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
