#!/usr/bin/env python3.12
"""
Gemini 3 Pro Image Creator

Creates new images from scratch using Google's Gemini 3 Pro Image model
(nicknamed "Nano Banana Pro") with natural language prompts.

Supports up to 14 reference images for character consistency, style transfer,
and composition blending.
"""

import argparse
from gemini_image import generate_image


def main():
    parser = argparse.ArgumentParser(
        description="Create images using Gemini 3 Pro Image (Nano Banana Pro)",
        epilog="""
Examples:
  # Basic creation
  %(prog)s output.png "A nano banana in a fancy restaurant"

  # High resolution
  %(prog)s output.png "A nano banana" --resolution 4K --aspect-ratio 16:9

  # With reference images for style
  %(prog)s output.png "A landscape in this style" --reference style.png

  # Character consistency (up to 5 people)
  %(prog)s group.png "Office photo of these people" --reference person1.png --reference person2.png

  # With Google Search grounding
  %(prog)s weather.png "An infographic about today's weather in San Francisco" --search
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("output", help="Output image path")
    parser.add_argument("prompt", help="Natural language creation instruction")
    parser.add_argument(
        "--reference",
        action="append",
        dest="references",
        help="Reference image path (can be repeated up to 14 times for multi-image composition)"
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
        input_image_path=None,
        reference_images=args.references,
        resolution=args.resolution,
        aspect_ratio=args.aspect_ratio,
        enable_search=args.search
    )


if __name__ == "__main__":
    main()
