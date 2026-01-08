#!/usr/bin/env python3
"""
identify_music.py
Identify music in audio segments using Shazam API

Usage:
    python identify_music.py <audio_path> <gemini_json_path> [output_markdown_path]

Workflow:
    1. Read music segments from Gemini analysis JSON
    2. Extract each segment using FFmpeg
    3. Identify each segment with Shazam
    4. Return results with song info + timestamps
"""

import sys
import json
import asyncio
import subprocess
import shutil
from pathlib import Path
from shazamio import Shazam

# Minimum segment duration for Shazam identification (in seconds)
MIN_SEGMENT_DURATION = 3


def parse_timestamp(timestamp: str) -> int:
    """
    Convert MM:SS timestamp to seconds

    Args:
        timestamp: Time in MM:SS format

    Returns:
        Total seconds as integer
    """
    parts = timestamp.split(':')
    if len(parts) == 2:
        minutes, seconds = parts
        return int(minutes) * 60 + int(seconds)
    return 0


def calculate_segment_duration(start: str, end: str) -> int:
    """
    Calculate duration of a segment in seconds

    Args:
        start: Start time in MM:SS format
        end: End time in MM:SS format

    Returns:
        Duration in seconds
    """
    start_seconds = parse_timestamp(start)
    end_seconds = parse_timestamp(end)
    return end_seconds - start_seconds


def load_config():
    """Load API keys from config file."""
    # Config file is in the emdashcodes directory (5 levels up from this script)
    config_path = Path(__file__).parent.parent.parent.parent / ".video-toolkit-config.json"

    if not config_path.exists():
        print("Warning: Config file not found - Shazam API key not required for shazamio", file=sys.stderr)
        print(f"Expected at: {config_path}", file=sys.stderr)
        # Note: shazamio doesn't require API key, it uses Shazam's public endpoint
        return None

    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except json.JSONDecodeError:
        print("Warning: Could not parse config file", file=sys.stderr)
        return None

    # Shazam API key is optional for shazamio (uses public endpoint)
    return config.get('shazam', {}).get('apiKey', None)


def extract_audio_segment(audio_path: str, start_time: str, end_time: str, output_path: str):
    """
    Extract audio segment using FFmpeg

    Args:
        audio_path: Path to full audio file
        start_time: Start time in MM:SS format
        end_time: End time in MM:SS format
        output_path: Path to save extracted segment
    """

    cmd = [
        'ffmpeg',
        '-i', audio_path,
        '-ss', start_time,
        '-to', end_time,
        '-acodec', 'copy',
        '-y',  # Overwrite
        output_path
    ]

    try:
        subprocess.run(cmd, capture_output=True, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error extracting segment {start_time}-{end_time}: {e.stderr.decode()}", file=sys.stderr)
        return False


async def identify_segment(segment_path: str) -> dict:
    """
    Identify music in audio segment using Shazam

    Returns:
        dict with song info or None if not identified
    """

    shazam = Shazam()

    try:
        # Recognize song from audio file
        result = await shazam.recognize(segment_path)

        if not result or 'track' not in result:
            return None

        track = result['track']

        # Extract relevant information
        song_info = {
            'title': track.get('title', 'Unknown'),
            'artist': track.get('subtitle', 'Unknown Artist'),
            'album': track.get('sections', [{}])[0].get('metadata', [{}])[0].get('text', 'Unknown Album') if track.get('sections') else 'Unknown Album',
            'genre': track.get('genres', {}).get('primary', 'Unknown'),
            'year': None,
            'shazam_url': track.get('url', ''),
            'confidence': 'high' if track.get('title') else 'low'
        }

        # Try to extract year from metadata
        if track.get('sections'):
            for section in track['sections']:
                if section.get('type') == 'SONG' and section.get('metadata'):
                    for meta in section['metadata']:
                        if 'Released' in meta.get('title', ''):
                            song_info['year'] = meta.get('text', '')

        return song_info

    except Exception as e:
        print(f"Error identifying segment: {e}", file=sys.stderr)
        return None


async def identify_all_segments(audio_path: str, music_segments: list, temp_dir: Path) -> list:
    """
    Extract and identify all music segments

    Returns:
        list of dicts with segment info + song identification
    """

    results = []

    for i, segment in enumerate(music_segments, 1):
        start = segment['start']
        end = segment['end']
        description = segment['description']

        print(f"\nProcessing segment {i}/{len(music_segments)}: {start} to {end}", file=sys.stderr)
        print(f"Description: {description}", file=sys.stderr)

        # Check segment duration
        duration = calculate_segment_duration(start, end)
        if duration < MIN_SEGMENT_DURATION:
            print(f"⚠ Skipping: Segment too short ({duration}s, minimum {MIN_SEGMENT_DURATION}s required)", file=sys.stderr)
            results.append({
                'segment_number': i,
                'start': start,
                'end': end,
                'description': description,
                'identified': False,
                'error': f'Segment too short ({duration}s, minimum {MIN_SEGMENT_DURATION}s required for reliable identification)'
            })
            continue

        # Extract segment
        segment_path = temp_dir / f"segment_{i}.wav"
        if not extract_audio_segment(audio_path, start, end, str(segment_path)):
            results.append({
                'segment_number': i,
                'start': start,
                'end': end,
                'description': description,
                'identified': False,
                'error': 'Failed to extract segment'
            })
            continue

        print(f"Identifying with Shazam...", file=sys.stderr)

        # Identify with Shazam
        song_info = await identify_segment(str(segment_path))

        if song_info:
            print(f"✓ Identified: {song_info['title']} by {song_info['artist']}", file=sys.stderr)
            results.append({
                'segment_number': i,
                'start': start,
                'end': end,
                'description': description,
                'identified': True,
                'song': song_info
            })
        else:
            print(f"✗ Could not identify music in this segment", file=sys.stderr)
            results.append({
                'segment_number': i,
                'start': start,
                'end': end,
                'description': description,
                'identified': False,
                'error': 'No match found'
            })

        # Clean up segment file
        segment_path.unlink()

    return results


def main():
    if len(sys.argv) < 3:
        print("Usage: python identify_music.py <audio_path> <gemini_json_path> [output_markdown_path]", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    gemini_json_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else None

    if not Path(audio_path).exists():
        print(f"Error: Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)

    if not Path(gemini_json_path).exists():
        print(f"Error: Gemini JSON file not found: {gemini_json_path}", file=sys.stderr)
        sys.exit(1)

    # Load Gemini analysis
    with open(gemini_json_path, 'r') as f:
        gemini_data = json.load(f)

    if not gemini_data.get('has_music'):
        print("No music detected in Gemini analysis", file=sys.stderr)
        sys.exit(0)

    music_segments = gemini_data.get('music_segments', [])

    if not music_segments:
        print("No music segments found in Gemini analysis", file=sys.stderr)
        sys.exit(0)

    print(f"Found {len(music_segments)} music segment(s) to identify", file=sys.stderr)

    # Create temp directory for segments
    temp_dir = Path(audio_path).parent / "music_segments_temp"
    temp_dir.mkdir(exist_ok=True)

    # Load API key (optional for shazamio)
    api_key = load_config()

    # Identify all segments
    results = asyncio.run(identify_all_segments(audio_path, music_segments, temp_dir))

    # Clean up temp directory and all extracted segments
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    # Generate markdown output
    markdown_lines = [
        "---",
        "music_identification: true",
        f"segments_identified: {sum(1 for r in results if r['identified'])}",
        f"total_segments: {len(results)}",
        "---",
        "",
        "# Music Identification (Shazam)",
        ""
    ]

    for result in results:
        markdown_lines.append(f"## Segment {result['segment_number']}: {result['start']} - {result['end']}")
        markdown_lines.append(f"**Gemini Description:** {result['description']}")
        markdown_lines.append("")

        if result['identified']:
            song = result['song']
            markdown_lines.append(f"**✓ Identified:**")
            markdown_lines.append(f"- **Title:** {song['title']}")
            markdown_lines.append(f"- **Artist:** {song['artist']}")
            markdown_lines.append(f"- **Album:** {song['album']}")
            if song['year']:
                markdown_lines.append(f"- **Year:** {song['year']}")
            markdown_lines.append(f"- **Genre:** {song['genre']}")
            if song['shazam_url']:
                markdown_lines.append(f"- **Shazam:** {song['shazam_url']}")
        else:
            markdown_lines.append(f"**✗ Not Identified:** {result.get('error', 'Unknown error')}")

        markdown_lines.append("")

    markdown_lines.append("---")
    markdown_lines.append("*Identified with Shazam*")

    markdown = "\n".join(markdown_lines)

    # Output results
    if output_path:
        with open(output_path, 'w') as f:
            f.write(markdown)
        print(f"\n✓ Music identification saved to: {output_path}", file=sys.stderr)
    else:
        print(markdown)

    # Output JSON for parsing
    print("\nJSON OUTPUT:", file=sys.stderr)
    print(json.dumps({'results': results}, indent=2), file=sys.stderr)


if __name__ == "__main__":
    main()
