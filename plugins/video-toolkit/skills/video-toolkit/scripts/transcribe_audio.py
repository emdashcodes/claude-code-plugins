#!/usr/bin/env python3

"""
transcribe_audio.py
Transcribe audio using OpenAI Whisper

Usage:
    python transcribe_audio.py <wav_path> [model_name]

Example:
    python transcribe_audio.py audio.wav base
"""

import sys
import os
import json
from pathlib import Path

# Activate virtual environment if it exists
script_dir = Path(__file__).parent
venv_dir = script_dir.parent / ".venv"
if venv_dir.exists():
    # Note: This won't actually activate the venv in the current process
    # The script should be run with the venv's python interpreter
    pass

try:
    import whisper
except ImportError:
    print("Error: OpenAI Whisper not found", file=sys.stderr)
    print("Please run: bash scripts/install_dependencies.sh", file=sys.stderr)
    sys.exit(1)


def format_timestamp(seconds):
    """Format seconds as HH:MM:SS.mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def generate_markdown(result, model_name):
    """Generate markdown formatted transcript with frontmatter"""
    lines = []

    # YAML frontmatter
    lines.append("---")
    lines.append(f"language: {result['language']}")
    lines.append(f"whisper_model: {model_name}")
    lines.append(f"segments: {len(result['segments'])}")
    lines.append("---")
    lines.append("")

    lines.append("# Audio Transcript")
    lines.append("")

    lines.append("## Full Transcript")
    lines.append("")
    lines.append(result["text"])
    lines.append("")

    if result["segments"]:
        lines.append("## Timestamped Segments")
        lines.append("")
        for segment in result["segments"]:
            lines.append(f"### [{segment['start_time']} → {segment['end_time']}]")
            lines.append("")
            lines.append(segment['text'].strip())
            lines.append("")

    return "\n".join(lines)


def transcribe_audio(wav_path, model_name="base"):
    """
    Transcribe audio file using Whisper

    Args:
        wav_path: Path to input WAV file
        model_name: Whisper model to use (tiny.en, base, small, medium, large)

    Returns:
        Dictionary with transcript data
    """

    # Validate inputs
    if not os.path.exists(wav_path):
        print(f"Error: Audio file not found: {wav_path}", file=sys.stderr)
        return None

    # Valid model names
    valid_models = ["tiny.en", "tiny", "base.en", "base", "small.en", "small",
                    "medium.en", "medium", "large-v1", "large-v2", "large"]
    if model_name not in valid_models:
        print(f"Warning: Unknown model '{model_name}', using 'base'", file=sys.stderr)
        model_name = "base"

    print(f"Loading Whisper model: {model_name}")
    print("(First run will download the model, subsequent runs use cache)")

    try:
        # Load model
        model = whisper.load_model(model_name)
        print(f"✓ Model loaded")

        # Get file size
        file_size = os.path.getsize(wav_path)
        file_size_mb = file_size / (1024 * 1024)
        print(f"Audio file size: {file_size_mb:.2f} MB")

        # Transcribe
        print("Transcribing audio...")
        print("(This may take a few minutes depending on audio length and model size)")

        result = whisper.transcribe(
            model,
            wav_path,
            fp16=False,  # Use FP32 for better compatibility
            verbose=False
        )

        print(f"✓ Transcription complete")

        # Format output
        transcript_data = {
            "text": result["text"].strip(),
            "language": result.get("language", "unknown"),
            "segments": []
        }

        # Add segment information with timestamps
        if "segments" in result:
            for segment in result["segments"]:
                transcript_data["segments"].append({
                    "id": segment["id"],
                    "start": segment["start"],
                    "end": segment["end"],
                    "start_time": format_timestamp(segment["start"]),
                    "end_time": format_timestamp(segment["end"]),
                    "text": segment["text"].strip()
                })

        return transcript_data

    except Exception as e:
        print(f"Error during transcription: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return None


def main():
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python transcribe_audio.py <wav_path> [model_name]")
        print()
        print("Arguments:")
        print("  wav_path    - Path to input WAV file")
        print("  model_name  - Whisper model (optional, default: base)")
        print()
        print("Available models:")
        print("  tiny.en  - Fastest, English only (~40MB)")
        print("  base     - Good balance (default, ~140MB)")
        print("  small    - Better accuracy (~470MB)")
        print("  medium   - High accuracy (~1.5GB)")
        print("  large    - Best accuracy (~3GB)")
        print()
        print("Example:")
        print("  python transcribe_audio.py audio.wav base")
        sys.exit(1)

    wav_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) == 3 else "base"

    # Transcribe
    result = transcribe_audio(wav_path, model_name)

    if not result:
        sys.exit(1)

    # Print formatted output
    print()
    print("=" * 80)
    print("TRANSCRIPT")
    print("=" * 80)
    print()
    print(result["text"])
    print()
    print("=" * 80)
    print(f"Language: {result['language']}")
    print(f"Segments: {len(result['segments'])}")
    print("=" * 80)
    print()

    # Print timestamped segments
    if result["segments"]:
        print("TIMESTAMPED SEGMENTS:")
        print("-" * 80)
        for segment in result["segments"]:
            print(f"[{segment['start_time']} → {segment['end_time']}]")
            print(f"  {segment['text']}")
            print()

    # Generate and output markdown
    markdown = generate_markdown(result, model_name)
    print()
    print("MARKDOWN OUTPUT:")
    print(markdown)


if __name__ == "__main__":
    main()
