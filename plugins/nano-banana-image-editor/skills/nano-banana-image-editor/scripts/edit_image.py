#!/usr/bin/env python3
"""
Gemini 2.5 Flash Image Editor

Uses Google's Gemini 2.5 Flash Image model (nicknamed "Nano Banana") to edit images
using natural language prompts.
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


def edit_image(input_path: str, output_path: str, prompt: str, width: int = 1024, height: int = 768):
    """
    Edit an existing image or create a new image using Gemini 2.5 Flash Image model.

    Args:
        input_path: Path to input image (or None to create new image)
        output_path: Path to save edited/created image
        prompt: Natural language editing/creation instruction
        width: Output image width (default: 1024)
        height: Output image height (default: 768)
    """
    # Configure the model
    model = genai.GenerativeModel('gemini-2.5-flash-image')

    enhanced_prompt = prompt

    # Build the prompt based on whether we have an input image
    if input_path and input_path != "None":
        # Editing mode: Upload and edit existing image
        input_file = Path(input_path)
        if not input_file.exists():
            print(f"Error: Input file not found: {input_path}", file=sys.stderr)
            sys.exit(1)

        print(f"Uploading image: {input_path}")
        image_file = genai.upload_file(input_path)

        print(f"Editing with prompt: {enhanced_prompt}")
        full_prompt = [
            image_file,
            enhanced_prompt
        ]
    else:
        # Creation mode: Generate new image from scratch
        print(f"Creating new image with prompt: {enhanced_prompt}")
        full_prompt = enhanced_prompt

    # Generate the edited image
    generation_config = {
        "temperature": 0.4,
        "max_output_tokens": 32768,
    }

    try:
        response = model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
    except Exception as e:
        print(f"❌ Error generating content: {e}", file=sys.stderr)
        sys.exit(1)

    # Debug: Print response structure
    print(f"DEBUG: Response type: {type(response)}", file=sys.stderr)
    print(f"DEBUG: Has parts: {hasattr(response, 'parts')}", file=sys.stderr)

    if hasattr(response, 'parts'):
        print(f"DEBUG: Number of parts: {len(response.parts)}", file=sys.stderr)
        for i, part in enumerate(response.parts):
            print(f"DEBUG: Part {i} type: {type(part)}", file=sys.stderr)
            print(f"DEBUG: Part {i} has inline_data: {hasattr(part, 'inline_data')}", file=sys.stderr)
            if hasattr(part, 'inline_data') and part.inline_data:
                print(f"DEBUG: Part {i} inline_data is not None", file=sys.stderr)
                print(f"DEBUG: Part {i} data size: {len(part.inline_data.data)} bytes", file=sys.stderr)
            if hasattr(part, 'text'):
                print(f"DEBUG: Part {i} has text: {part.text[:200] if part.text else 'None'}...", file=sys.stderr)

    # Save the edited image
    # Note: The API returns text with image data or a URL
    # We need to extract and save the image bytes
    if hasattr(response, 'parts'):
        for part in response.parts:
            if hasattr(part, 'inline_data') and part.inline_data and part.inline_data.data:
                # Save binary image data
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)

                with open(output_path, 'wb') as f:
                    f.write(part.inline_data.data)

                print(f"✅ Edited image saved to: {output_path}")
                print(f"   File size: {len(part.inline_data.data)} bytes")
                return

    # If no image in response, print the text response
    print("❌ No image data found in response", file=sys.stderr)
    if hasattr(response, 'text'):
        print(f"Response text: {response.text}", file=sys.stderr)
    print("\nNote: Image generation may have been blocked by safety filters or failed.", file=sys.stderr)
    print("Try a different prompt or check API limits.", file=sys.stderr)

    # Create empty file to signal failure
    Path(output_path).touch()


def main():
    parser = argparse.ArgumentParser(
        description="Edit or create images using Gemini 2.5 Flash Image (Nano Banana)"
    )
    parser.add_argument("input", nargs='?', default=None, help="Input image path (optional - omit to create new image)")
    parser.add_argument("output", help="Output image path")
    parser.add_argument("prompt", help="Natural language editing/creation instruction")
    parser.add_argument("--width", type=int, default=256, help="Output width (default: 256 for icons)")
    parser.add_argument("--height", type=int, default=256, help="Output height (default: 256 for icons)")

    args = parser.parse_args()

    setup_api()
    edit_image(args.input, args.output, args.prompt, args.width, args.height)


if __name__ == "__main__":
    main()
