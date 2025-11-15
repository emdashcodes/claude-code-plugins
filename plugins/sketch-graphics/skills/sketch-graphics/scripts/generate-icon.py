#!/usr/bin/env python3
"""
Generate whiteboard-style sketch icons for use in sketch-graphics.

This is a dedicated icon generator that produces consistent whiteboard-style
icons that match the rough.js aesthetic. Icons are generated as PNGs and can
be converted to SVG using ImageMagick + potrace.

Usage:
    python3 generate-icon.py output.png "rocket ship"
    python3 generate-icon.py output.png "speech bubble" --size 512
"""

import os
import sys
import argparse
import google.generativeai as genai
from pathlib import Path


def setup_api():
    """Configure the Gemini API with the API key from environment."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
        print("Get your API key from: https://ai.google.dev/gemini-api/docs/api-key", file=sys.stderr)
        sys.exit(1)

    genai.configure(api_key=api_key)


def generate_icon(output_path: str, subject: str, size: int = 256):
    """
    Generate a whiteboard-style sketch icon.

    Args:
        output_path: Path to save the PNG icon
        subject: The icon subject (e.g., "rocket ship", "chat bubble")
        size: Output size in pixels (default: 256)
    """
    # Configure the model
    model = genai.GenerativeModel('gemini-2.5-flash-image')

    # Construct the standardized prompt
    # This prompt formula is optimized for consistency and rough.js aesthetic
    prompt = (
        f"Simple hand-drawn sketch of a {subject} icon with slightly rough imperfect lines, "
        f"casual sketch style with a bit of texture and wobble but still clean and readable, "
        f"black marker on white background. "
        f"IMPORTANT: Icon only, absolutely NO text, NO labels, NO words of any kind."
    )

    print(f"Generating icon: {subject}")
    print(f"Size: {size}x{size}px")

    # Generate the icon
    generation_config = {
        "temperature": 0.4,
        "max_output_tokens": 32768,
    }

    try:
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
    except Exception as e:
        print(f"❌ Error generating icon: {e}", file=sys.stderr)
        sys.exit(1)

    # Extract and save the image data
    if hasattr(response, 'parts'):
        for part in response.parts:
            if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                # Save binary image data
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)

                with open(output_path, 'wb') as f:
                    f.write(part.inline_data.data)

                file_size = len(part.inline_data.data)
                print(f"✅ Icon saved: {output_path}")
                print(f"   File size: {file_size:,} bytes ({file_size / 1024:.1f} KB)")
                return

    # If no image in response, handle the error
    print("❌ No image data found in response", file=sys.stderr)
    if hasattr(response, 'text'):
        print(f"Response: {response.text[:200]}...", file=sys.stderr)
    print("\nIcon generation may have been blocked by safety filters.", file=sys.stderr)
    print("Try a different subject description.", file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate whiteboard-style sketch icons for sketch-graphics",
        epilog="""
Examples:
  %(prog)s icon-rocket.png "rocket ship"
  %(prog)s icon-chat.png "speech bubble" --size 512
  %(prog)s icon-code.png "curly braces"
        """
    )
    parser.add_argument("output", help="Output PNG file path")
    parser.add_argument("subject", help="Icon subject (e.g., 'rocket ship', 'chat bubble')")
    parser.add_argument("--size", type=int, default=256, help="Icon size in pixels (default: 256)")

    args = parser.parse_args()

    setup_api()
    generate_icon(args.output, args.subject, args.size)


if __name__ == "__main__":
    main()
