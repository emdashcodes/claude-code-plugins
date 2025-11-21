#!/usr/bin/env python3.12
"""
Gemini 3 Pro Image Editor

Edits existing images using Google's Gemini 3 Pro Image model (nicknamed "Nano Banana Pro")
with natural language prompts.

Supports up to 13 additional reference images (14 total including the input image) for
advanced editing with style transfer, character consistency, and composition blending.
"""

import argparse
from gemini_image import generate_image


def main():
    parser = argparse.ArgumentParser(
        description="Edit images using Gemini 3 Pro Image (Nano Banana Pro)",
        epilog="""
Examples:
  # Basic editing
  %(prog)s input.png output.png "Remove the watermark in the top right corner"

  # High resolution output
  %(prog)s input.png output.png "Change to nighttime" --resolution 4K --aspect-ratio 16:9

  # Style transfer with reference
  %(prog)s photo.png artistic.png "Apply this artistic style" --reference style.png

  # Advanced composition with multiple references
  %(prog)s bg.png result.png "Add these people to the scene" --reference person1.png --reference person2.png

  # Content-aware editing with search grounding
  %(prog)s chart.png updated.png "Update with today's stock prices" --search
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("input", help="Input image path to edit")
    parser.add_argument("output", help="Output image path")
    parser.add_argument("prompt", help="Natural language editing instruction")
    parser.add_argument(
        "--reference",
        action="append",
        dest="references",
        help="Additional reference image path (can be repeated up to 13 times, 14 total with input)"
    )
    parser.add_argument(
        "--resolution",
        choices=["1K", "2K", "4K"],
        default="1K",
        help="Image resolution (default: 1K). Higher resolutions increase quality and cost."
    )
    parser.add_argument(
        "--aspect-ratio",
        default="1:1",
        help="Aspect ratio like 1:1, 16:9, 3:2, 4:3, 9:16, etc. (default: 1:1)"
    )
    parser.add_argument(
        "--search",
        action="store_true",
        help="Enable Google Search grounding for real-time information (weather, sports, facts)"
    )

    args = parser.parse_args()

    generate_image(
        prompt=args.prompt,
        output_path=args.output,
        input_image_path=args.input,
        reference_images=args.references,
        resolution=args.resolution,
        aspect_ratio=args.aspect_ratio,
        enable_search=args.search
    )


if __name__ == "__main__":
    main()
