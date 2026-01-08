#!/usr/bin/env python3

"""
extract_frames.py
Extract frames from a video at specified intervals using FFmpeg

Usage:
    python extract_frames.py <video_path> <interval_seconds> <output_dir>

Example:
    python extract_frames.py video.mp4 2 /tmp/frames
"""

import sys
import os
import subprocess
import json
from pathlib import Path


def get_video_duration(video_path):
    """Get video duration in seconds using ffprobe"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'json',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        return float(data['format']['duration'])
    except Exception as e:
        print(f"Error getting video duration: {e}", file=sys.stderr)
        return None


def extract_frames_scene_detect(video_path, output_dir, threshold=0.2):
    """
    Extract frames using scene change detection

    Args:
        video_path: Path to input video file
        output_dir: Directory to save extracted frames
        threshold: Scene detection threshold (0.0-1.0, lower=more sensitive)

    Returns:
        List of paths to extracted frame files
    """

    # Validate inputs
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}", file=sys.stderr)
        return []

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Get video duration
    duration = get_video_duration(video_path)
    if duration:
        print(f"Video duration: {duration:.2f}s")

    output_pattern = str(output_path / "frame_%04d.png")

    # FFmpeg command with scene detection and scaling
    # eq(n,0) - include first frame
    # gt(scene,threshold) - include frames when scene change exceeds threshold
    # scale filter: limit to 2000px max dimension (for Claude API multi-image limits)
    cmd = [
        'ffmpeg',
        '-i', video_path,
        '-vf', f"select='eq(n,0)+gt(scene,{threshold})',scale='min(2000,iw)':'min(2000,ih)':force_original_aspect_ratio=decrease,showinfo",
        '-vsync', 'vfr',  # Variable frame rate
        '-q:v', '2',  # High quality
        output_pattern,
        '-y'  # Overwrite existing files
    ]

    print(f"Extracting frames using scene detection...")
    print(f"Threshold: {threshold} (lower = more sensitive)")
    print(f"Output directory: {output_dir}")

    try:
        # Run FFmpeg
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )

        # Get list of extracted frames
        frame_files = sorted(output_path.glob("frame_*.png"))
        frame_paths = [str(f) for f in frame_files]

        # Parse timestamps from FFmpeg stderr (showinfo filter output)
        frame_metadata = []
        import re

        # Pattern to match showinfo output: pts_time:12.345
        for match in re.finditer(r'pts_time:(\d+\.?\d*)', result.stderr):
            timestamp = float(match.group(1))
            frame_metadata.append(timestamp)

        # Verify we got timestamps for all frames
        if len(frame_metadata) != len(frame_paths):
            print(f"Warning: Got {len(frame_metadata)} timestamps for {len(frame_paths)} frames")
            # Don't estimate - just use what we got or null

        # Build metadata
        metadata = {
            "extraction_method": "scene-detect",
            "threshold": threshold,
            "total_frames": len(frame_paths),
            "frames": []
        }

        for i, frame_path in enumerate(frame_paths):
            frame_num = i + 1
            timestamp = frame_metadata[i] if i < len(frame_metadata) else None

            metadata["frames"].append({
                "frame_number": frame_num,
                "filename": os.path.basename(frame_path),
                "path": frame_path,
                "timestamp_seconds": timestamp
            })

            if timestamp is not None:
                print(f"  Frame {frame_num:04d} @ {timestamp:7.2f}s: {frame_path}")
            else:
                print(f"  Frame {frame_num:04d}: {frame_path}")

        # Save metadata JSON
        metadata_path = output_path / "frames_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"✓ Extracted {len(frame_paths)} frames (scene changes)")
        print(f"✓ Saved metadata: {metadata_path}")

        return frame_paths

    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return []
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return []


def extract_frames(video_path, interval_seconds, output_dir):
    """
    Extract frames from video at regular intervals

    Args:
        video_path: Path to input video file
        interval_seconds: Time between frames (in seconds)
        output_dir: Directory to save extracted frames

    Returns:
        List of paths to extracted frame files
    """

    # Validate inputs
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}", file=sys.stderr)
        return []

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Get video duration
    duration = get_video_duration(video_path)
    if duration:
        estimated_frames = int(duration / interval_seconds)
        print(f"Video duration: {duration:.2f}s")
        print(f"Estimated frames: ~{estimated_frames}")

    # FFmpeg command to extract frames with scaling
    # fps=1/interval means one frame every N seconds
    # scale filter: limit to 2000px max dimension (for Claude API multi-image limits)
    fps_value = f"1/{interval_seconds}"
    output_pattern = str(output_path / "frame_%04d.png")

    cmd = [
        'ffmpeg',
        '-i', video_path,
        '-vf', f"fps={fps_value},scale='min(2000,iw)':'min(2000,ih)':force_original_aspect_ratio=decrease",
        '-q:v', '2',  # High quality (2-5 is good)
        output_pattern,
        '-y'  # Overwrite existing files
    ]

    print(f"Extracting frames every {interval_seconds} seconds...")
    print(f"Output directory: {output_dir}")

    try:
        # Run FFmpeg
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )

        # Get list of extracted frames
        frame_files = sorted(output_path.glob("frame_*.png"))
        frame_paths = [str(f) for f in frame_files]

        # Build metadata with calculated timestamps
        metadata = {
            "extraction_method": "interval",
            "interval_seconds": interval_seconds,
            "total_frames": len(frame_paths),
            "frames": []
        }

        for i, frame_path in enumerate(frame_paths):
            frame_num = i + 1
            timestamp = i * interval_seconds  # Frame 1 at 0s, Frame 2 at interval, etc.

            metadata["frames"].append({
                "frame_number": frame_num,
                "filename": os.path.basename(frame_path),
                "path": frame_path,
                "timestamp_seconds": timestamp
            })

            print(f"  Frame {frame_num:04d} @ {timestamp:6.2f}s: {frame_path}")

        # Save metadata JSON
        metadata_path = output_path / "frames_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"✓ Extracted {len(frame_paths)} frames")
        print(f"✓ Saved metadata: {metadata_path}")

        return frame_paths

    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return []
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return []


def main():
    if len(sys.argv) < 4 or len(sys.argv) > 5:
        print("Usage:")
        print("  Interval mode: python extract_frames.py <video_path> <interval_seconds> <output_dir>")
        print("  Scene detect:  python extract_frames.py <video_path> --scene-detect <output_dir> [threshold]")
        print()
        print("Arguments:")
        print("  video_path       - Path to input video file")
        print("  interval_seconds - Time between frames (e.g., 2 for every 2 seconds)")
        print("  --scene-detect   - Use scene change detection instead of intervals")
        print("  output_dir       - Directory to save extracted frames")
        print("  threshold        - Scene detection sensitivity 0.0-1.0 (optional, default: 0.3)")
        print()
        print("Examples:")
        print("  python extract_frames.py video.mp4 2 /tmp/frames")
        print("  python extract_frames.py video.mp4 --scene-detect /tmp/frames")
        print("  python extract_frames.py video.mp4 --scene-detect /tmp/frames 0.4")
        sys.exit(1)

    video_path = sys.argv[1]
    mode = sys.argv[2]

    # Scene detection mode
    if mode == "--scene-detect":
        output_dir = sys.argv[3]
        threshold = 0.02  # Default threshold optimized for screen recordings

        if len(sys.argv) == 5:
            try:
                threshold = float(sys.argv[4])
                if not 0.0 <= threshold <= 1.0:
                    print("Error: threshold must be between 0.0 and 1.0", file=sys.stderr)
                    sys.exit(1)
            except ValueError:
                print("Error: threshold must be a number", file=sys.stderr)
                sys.exit(1)

        # Extract frames using scene detection
        frame_paths = extract_frames_scene_detect(video_path, output_dir, threshold)

        if not frame_paths:
            sys.exit(1)

        # Output JSON
        print()
        print("JSON output:")
        print(json.dumps({
            "mode": "scene-detect",
            "frame_count": len(frame_paths),
            "threshold": threshold,
            "frames": frame_paths
        }, indent=2))

    # Interval mode
    else:
        try:
            interval_seconds = float(mode)
            if interval_seconds <= 0:
                print("Error: interval_seconds must be positive", file=sys.stderr)
                sys.exit(1)
        except ValueError:
            print("Error: interval_seconds must be a number", file=sys.stderr)
            sys.exit(1)

        output_dir = sys.argv[3]

        # Extract frames at intervals
        frame_paths = extract_frames(video_path, interval_seconds, output_dir)

        if not frame_paths:
            sys.exit(1)

        # Output JSON
        print()
        print("JSON output:")
        print(json.dumps({
            "mode": "interval",
            "frame_count": len(frame_paths),
            "interval_seconds": interval_seconds,
            "frames": frame_paths
        }, indent=2))


if __name__ == "__main__":
    main()
