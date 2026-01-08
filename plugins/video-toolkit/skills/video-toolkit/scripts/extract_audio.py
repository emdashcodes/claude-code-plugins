#!/usr/bin/env python3

"""
extract_audio.py
Extract audio track from video and convert to WAV format for Whisper

Usage:
    python extract_audio.py <video_path> <output_wav_path>

Example:
    python extract_audio.py video.mp4 audio.wav
"""

import sys
import os
import subprocess
import json
from pathlib import Path


def get_audio_info(video_path):
    """Get audio stream information using ffprobe"""
    try:
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a:0',
            '-show_entries', 'stream=codec_name,sample_rate,channels',
            '-of', 'json',
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        if 'streams' in data and len(data['streams']) > 0:
            return data['streams'][0]
        return None
    except Exception as e:
        print(f"Error getting audio info: {e}", file=sys.stderr)
        return None


def extract_audio(video_path, output_wav_path):
    """
    Extract audio track from video and convert to WAV format

    Args:
        video_path: Path to input video file
        output_wav_path: Path to output WAV file

    Returns:
        True if successful, False if error, None if no audio stream
    """

    # Validate inputs
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}", file=sys.stderr)
        return False

    # Create output directory if needed
    output_path = Path(output_wav_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Get audio info
    audio_info = get_audio_info(video_path)
    if audio_info:
        print(f"Source audio codec: {audio_info.get('codec_name', 'unknown')}")
        print(f"Sample rate: {audio_info.get('sample_rate', 'unknown')} Hz")
        print(f"Channels: {audio_info.get('channels', 'unknown')}")
    else:
        print("ℹ️  No audio stream detected in video (silent video)", file=sys.stderr)
        print("Skipping audio extraction...", file=sys.stderr)
        return None

    # FFmpeg command to extract audio
    # Convert to 16kHz mono WAV (optimal for Whisper)
    cmd = [
        'ffmpeg',
        '-i', video_path,
        '-vn',  # No video
        '-acodec', 'pcm_s16le',  # PCM 16-bit little-endian
        '-ar', '16000',  # 16kHz sample rate (Whisper's native)
        '-ac', '1',  # Mono (1 channel)
        output_wav_path,
        '-y'  # Overwrite existing file
    ]

    print(f"Extracting audio to WAV format...")
    print(f"Output file: {output_wav_path}")

    try:
        # Run FFmpeg
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )

        # Verify output file exists
        if not os.path.exists(output_wav_path):
            print("Error: Output file was not created", file=sys.stderr)
            return False

        # Get file size
        file_size = os.path.getsize(output_wav_path)
        file_size_mb = file_size / (1024 * 1024)

        print(f"✓ Audio extracted successfully")
        print(f"  File size: {file_size_mb:.2f} MB")
        print(f"  Format: 16-bit PCM WAV, 16kHz, mono")

        return True

    except subprocess.CalledProcessError as e:
        print(f"Error running FFmpeg:", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        return False
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return False


def main():
    if len(sys.argv) != 3:
        print("Usage: python extract_audio.py <video_path> <output_wav_path>")
        print()
        print("Arguments:")
        print("  video_path      - Path to input video file")
        print("  output_wav_path - Path to output WAV file")
        print()
        print("Example:")
        print("  python extract_audio.py video.mp4 audio.wav")
        print()
        print("Output format:")
        print("  - 16-bit PCM WAV")
        print("  - 16kHz sample rate (Whisper's native)")
        print("  - Mono (1 channel)")
        sys.exit(1)

    video_path = sys.argv[1]
    output_wav_path = sys.argv[2]

    # Extract audio
    result = extract_audio(video_path, output_wav_path)

    if result is None:
        # No audio stream - not an error, just informational
        print()
        print("JSON output:")
        print(json.dumps({
            "success": True,
            "has_audio": False,
            "message": "No audio stream in video"
        }, indent=2))
        sys.exit(0)

    if not result:
        # Extraction failed
        sys.exit(1)

    # Output JSON for easy parsing
    print()
    print("JSON output:")
    print(json.dumps({
        "success": True,
        "has_audio": True,
        "output_path": output_wav_path,
        "file_size": os.path.getsize(output_wav_path)
    }, indent=2))


if __name__ == "__main__":
    main()
