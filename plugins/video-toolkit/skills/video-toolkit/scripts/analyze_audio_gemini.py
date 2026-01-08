#!/usr/bin/env python3
"""
analyze_audio_gemini.py
Analyze audio using Google Gemini Audio API

Usage:
    python analyze_audio_gemini.py <audio_path> [output_markdown_path]

Returns:
    Markdown file with audio analysis including:
    - Overall audio description
    - Music detection (yes/no)
    - Non-speech sound events
    - Timestamps for key audio moments
"""

import sys
import json
from pathlib import Path
from google import genai
from google.genai import types


def load_config():
    """Load API keys from config file."""
    # Config file is in the emdashcodes directory (5 levels up from this script)
    config_path = Path(__file__).parent.parent.parent.parent / ".video-toolkit-config.json"

    if not config_path.exists():
        print("Error: Config file not found", file=sys.stderr)
        print(f"Expected at: {config_path}", file=sys.stderr)
        print("\nPlease run setup first:", file=sys.stderr)
        print("  python setup_api_keys.py gemini YOUR_API_KEY", file=sys.stderr)
        sys.exit(1)

    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except json.JSONDecodeError:
        print("Error: Could not parse config file", file=sys.stderr)
        sys.exit(1)

    if 'gemini' not in config or 'apiKey' not in config['gemini']:
        print("Error: Gemini API key not configured", file=sys.stderr)
        print("\nPlease run setup first:", file=sys.stderr)
        print("  python setup_api_keys.py gemini YOUR_API_KEY", file=sys.stderr)
        sys.exit(1)

    return config['gemini']['apiKey']


def analyze_audio(audio_path: str, api_key: str) -> dict:
    """
    Analyze audio file using Gemini Audio API

    Returns dict with:
    - has_music: bool
    - audio_description: str
    - music_description: str (if has_music)
    - sound_events: list
    - timestamps: dict
    """

    # Initialize Gemini client with API key
    client = genai.Client(api_key=api_key)

    print(f"Uploading audio file: {audio_path}...", file=sys.stderr)

    # Upload audio file
    try:
        audio_file = client.files.upload(file=audio_path)
        print(f"✓ Audio uploaded (file ID: {audio_file.name})", file=sys.stderr)
    except Exception as e:
        print(f"Error uploading audio: {e}", file=sys.stderr)
        sys.exit(1)

    # Check if transcript is available to detect language
    transcript_path = Path(audio_path).parent / "transcript.md"
    detected_language = None
    transcript_text = None

    if transcript_path.exists():
        try:
            with open(transcript_path, 'r') as f:
                content = f.read()
                # Extract language from frontmatter
                import re
                lang_match = re.search(r'language:\s*(\w+)', content)
                if lang_match:
                    detected_language = lang_match.group(1)
                # Extract full transcript
                transcript_match = re.search(r'## Full Transcript\s*\n\n(.+?)\n\n##', content, re.DOTALL)
                if transcript_match:
                    transcript_text = transcript_match.group(1).strip()
        except Exception as e:
            print(f"Warning: Could not read transcript: {e}", file=sys.stderr)

    # Prepare analysis prompt with optional translation request
    translation_section = ""
    if detected_language and detected_language != 'en' and transcript_text:
        translation_section = f"""

6. **Speech Translation**: The speech was detected as {detected_language}. Please provide:
   - **Original ({detected_language})**: {transcript_text}
   - **English Translation**: [Translate the speech to English, preserving meaning and context]
"""

    prompt = f"""Analyze this audio file comprehensively. Provide:

1. **Overall Audio Description**: Describe what you hear in 2-3 sentences.

2. **Music Detection**: Does this audio contain music? Answer YES or NO.
   - If YES, provide PRECISE TIMESTAMPS for each music segment in this format:
     MUSIC SEGMENTS:
     - 00:00 to 02:30 - [brief description of this music: genre, mood, tempo]
     - 02:45 to 04:15 - [description of second song if different]
   - Be as precise as possible with start and end times (MM:SS format)
   - If multiple songs or music segments, list each one separately
   - If NO music, skip this section.

3. **Speech vs Non-Speech**: Identify what portions contain:
   - Speech/dialogue (with timestamps)
   - Music (already covered above)
   - Ambient sounds (nature, traffic, etc.)
   - Sound effects (doors, applause, footsteps, etc.)
   - Silence

4. **Sound Events with Timestamps**: List specific notable sounds with timestamps (MM:SS format).
   Examples: "00:15 - door slam", "01:30 - applause", "02:45 - car horn"

5. **Audio Quality**: Comment on audio quality (clear, muffled, noisy, etc.){translation_section}

IMPORTANT: At the end of your response, include a JSON code block with structured data:

```json
{{
  "has_music": true or false,
  "music_segments": [
    {{
      "start": "MM:SS",
      "end": "MM:SS",
      "description": "brief description"
    }}
  ]
}}
```

This JSON will be used to programmatically extract and identify the music."""

    print("Analyzing audio with Gemini...", file=sys.stderr)

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, audio_file]
        )

        analysis_text = response.text
        print("✓ Audio analysis complete", file=sys.stderr)

    except Exception as e:
        print(f"Error analyzing audio: {e}", file=sys.stderr)
        sys.exit(1)

    # Extract JSON code block from Gemini's response
    import re

    # Look for JSON code block: ```json ... ```
    json_match = re.search(r'```json\s*\n(.*?)\n```', analysis_text, re.DOTALL)

    if json_match:
        json_str = json_match.group(1)
        try:
            structured_data = json.loads(json_str)
            has_music = structured_data.get('has_music', False)
            music_segments = structured_data.get('music_segments', [])
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse JSON from Gemini response: {e}", file=sys.stderr)
            # Fallback: detect music from text
            has_music = 'YES' in analysis_text.upper() and 'MUSIC DETECTION' in analysis_text.upper()
            music_segments = []
    else:
        print("Warning: No JSON code block found in Gemini response", file=sys.stderr)
        # Fallback: detect music from text
        has_music = 'YES' in analysis_text.upper() and 'MUSIC DETECTION' in analysis_text.upper()
        music_segments = []

    return {
        'has_music': has_music,
        'music_segments': music_segments,
        'full_analysis': analysis_text
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_audio_gemini.py <audio_path> [output_markdown_path]", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    if not Path(audio_path).exists():
        print(f"Error: Audio file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)

    # Load API key
    api_key = load_config()

    # Analyze audio
    result = analyze_audio(audio_path, api_key)

    # Generate markdown output
    markdown = f"""---
audio_analysis: true
has_music: {str(result['has_music']).lower()}
analyzer: gemini-audio
---

# Audio Analysis (Gemini)

{result['full_analysis']}

---
*Analyzed with Gemini 2.5 Flash*
"""

    # Prepare JSON data
    json_data = {
        'has_music': result['has_music'],
        'music_segments': result['music_segments']
    }

    # Output results
    if output_path:
        # Save markdown
        with open(output_path, 'w') as f:
            f.write(markdown)
        print(f"✓ Analysis saved to: {output_path}", file=sys.stderr)

        # Save JSON to separate file (same directory, with .json extension)
        json_path = Path(output_path).parent / "gemini_audio.json"
        with open(json_path, 'w') as f:
            json.dump(json_data, f, indent=2)
        print(f"✓ JSON data saved to: {json_path}", file=sys.stderr)
    else:
        # Print to stdout if no output path
        print(markdown)

    # Also output JSON for parsing by analyze_video.sh
    print("\nJSON OUTPUT:", file=sys.stderr)
    print(json.dumps(json_data, indent=2), file=sys.stderr)


if __name__ == "__main__":
    main()
