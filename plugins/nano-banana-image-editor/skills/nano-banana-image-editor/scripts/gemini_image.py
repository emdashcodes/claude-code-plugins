#!/usr/bin/env python3.12
"""
Shared Gemini image generation utilities
"""

import sys
import json
from google import genai
from google.genai import types
from pathlib import Path


def get_api_key():
    """Get the Gemini API key from config file."""
    config_path = Path(__file__).parent.parent.parent.parent / ".nano-banana-config.json"

    if not config_path.exists():
        print("Error: No Gemini API key configured", file=sys.stderr)
        print("\nTo set up your API key:", file=sys.stderr)
        print(f"  python3 {Path(__file__).parent}/setup-gemini-token.py <your-api-key>", file=sys.stderr)
        print("\nGet your API key from: https://aistudio.google.com/app/apikey", file=sys.stderr)
        sys.exit(1)

    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            api_key = config.get('gemini', {}).get('apiKey')
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error: Could not read config file: {e}", file=sys.stderr)
        print(f"Config file location: {config_path}", file=sys.stderr)
        sys.exit(1)

    if not api_key:
        print("Error: No API key found in config file", file=sys.stderr)
        print(f"Config file location: {config_path}", file=sys.stderr)
        print("\nTo set up your API key:", file=sys.stderr)
        print(f"  python3 {Path(__file__).parent}/setup-gemini-token.py <your-api-key>", file=sys.stderr)
        sys.exit(1)

    return api_key


def generate_image(
    prompt: str,
    output_path: str,
    input_image_path: str = None,
    reference_images: list = None,
    resolution: str = "1K",
    aspect_ratio: str = "1:1",
    enable_search: bool = False
):
    """
    Generate or edit an image using Gemini 3 Pro Image model.

    Args:
        prompt: Natural language instruction
        output_path: Path to save the generated image
        input_image_path: Optional path to input image for editing (None for creation)
        reference_images: Optional list of reference image paths (up to 14 total images)
        resolution: Image resolution - "1K", "2K", or "4K" (default: "1K")
        aspect_ratio: Image aspect ratio like "1:1", "16:9", "3:2", etc. (default: "1:1")
        enable_search: Enable Google Search grounding for real-time information (default: False)
    """
    # Configure API client
    api_key = get_api_key()
    client = genai.Client(api_key=api_key)

    # Log if Google Search grounding is enabled
    if enable_search:
        print("Google Search grounding enabled")

    # Build the content list with images and prompt
    from PIL import Image
    content_parts = []

    # Add input image if editing
    if input_image_path:
        input_file = Path(input_image_path)
        if not input_file.exists():
            print(f"Error: Input file not found: {input_image_path}", file=sys.stderr)
            sys.exit(1)

        print(f"Loading input image: {input_image_path}")
        image = Image.open(input_image_path)
        content_parts.append(image)

    # Add reference images
    if reference_images:
        for ref_path in reference_images:
            ref_file = Path(ref_path)
            if not ref_file.exists():
                print(f"Error: Reference image not found: {ref_path}", file=sys.stderr)
                sys.exit(1)

            print(f"Loading reference image: {ref_path}")
            ref_image = Image.open(ref_path)
            content_parts.append(ref_image)

    # Add the prompt
    content_parts.append(prompt)

    # Determine the mode for logging
    total_images = len(content_parts) - 1  # Subtract prompt
    if input_image_path and reference_images:
        print(f"Editing image with {len(reference_images)} reference image(s)")
    elif input_image_path:
        print(f"Editing image with prompt: {prompt}")
    elif reference_images:
        print(f"Creating new image with {len(reference_images)} reference image(s)")
    else:
        print(f"Creating new image with prompt: {prompt}")

    # Check image count limit (max 14 images)
    if total_images > 14:
        print(f"Error: Too many images ({total_images}). Maximum is 14 images.", file=sys.stderr)
        sys.exit(1)

    # Build image config with aspect ratio and resolution
    # Requires google-genai >= 1.48.0 (Python 3.10+)
    image_config = types.ImageConfig(
        aspect_ratio=aspect_ratio,
        image_size=resolution
    )

    # Build generation config with image settings
    config_params = {
        'response_modalities': ['TEXT', 'IMAGE'],
        'image_config': image_config,
    }

    # Add Google Search grounding if enabled
    if enable_search:
        config_params['tools'] = [{"google_search": {}}]

    config = types.GenerateContentConfig(**config_params)

    # Show API call info
    print(f"Making API call to gemini-3-pro-image-preview")
    print(f"Resolution: {resolution}, Aspect ratio: {aspect_ratio}")
    print(f"Search grounding: {enable_search}")

    import time
    start_time = time.time()

    try:
        response = client.models.generate_content(
            model='gemini-3-pro-image-preview',
            contents=content_parts,
            config=config
        )
        elapsed = time.time() - start_time
        print(f"API call completed in {elapsed:.2f} seconds")
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"API call failed after {elapsed:.2f} seconds")
        print(f"Error: Error generating content: {e}", file=sys.stderr)
        sys.exit(1)

    # Save the image
    if hasattr(response, 'parts') and response.parts is not None:
        for i, part in enumerate(response.parts):
            # New API: check for as_image() method
            if hasattr(part, 'as_image'):
                try:
                    image = part.as_image()
                    output_file = Path(output_path)
                    output_file.parent.mkdir(parents=True, exist_ok=True)
                    image.save(output_path)
                    print(f"✅ Image saved to: {output_path}")
                    return
                except Exception as e:
                    pass  # Try next part
            # Fall back to inline_data for compatibility
            elif hasattr(part, 'inline_data') and part.inline_data and hasattr(part.inline_data, 'data'):
                output_file = Path(output_path)
                output_file.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, 'wb') as f:
                    f.write(part.inline_data.data)
                print(f"✅ Image saved to: {output_path}")
                print(f"   File size: {len(part.inline_data.data)} bytes")
                return
            elif hasattr(part, 'text') and part.text:
                pass  # Skip text parts

    # If no image in response, print the text response
    print("Error: No image data found in response", file=sys.stderr)
    if hasattr(response, 'text'):
        print(f"Response text: {response.text}", file=sys.stderr)
    print("\nNote: Image generation may have been blocked by safety filters or failed.", file=sys.stderr)
    print("Try a different prompt or check API limits.", file=sys.stderr)

    # Create empty file to signal failure
    Path(output_path).touch()
