#!/usr/bin/env python3.12
"""
Quick image cropping using PIL/Pillow

Deterministic cropping for simple tasks.
"""

import argparse
from PIL import Image
from pathlib import Path


def crop_image(input_path: str, output_path: str, left: int = 0, top: int = 0,
               right: int = None, bottom: int = None,
               remove_right: int = 0, remove_bottom: int = 0):
    """
    Crop an image using exact pixel dimensions.

    Args:
        input_path: Input image path
        output_path: Output image path
        left: Left edge of crop (default: 0)
        top: Top edge of crop (default: 0)
        right: Right edge of crop (default: image width)
        bottom: Bottom edge of crop (default: image height)
        remove_right: Remove N pixels from right edge
        remove_bottom: Remove N pixels from bottom edge
    """
    img = Image.open(input_path)
    width, height = img.size

    print(f"Original size: {width}x{height}")

    # Use defaults if not specified
    if right is None:
        right = width
    if bottom is None:
        bottom = height

    # Apply remove options
    if remove_right > 0:
        right = width - remove_right
    if remove_bottom > 0:
        bottom = height - remove_bottom

    # Crop
    cropped = img.crop((left, top, right, bottom))
    new_width, new_height = cropped.size

    print(f"Cropped size: {new_width}x{new_height}")
    print(f"Crop box: ({left}, {top}, {right}, {bottom})")

    # Save
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output_path)

    print(f"Saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Quick image cropping using PIL (no AI)",
        epilog="Examples:\n"
               "  Remove 100px from right:  %(prog)s input.png output.png --remove-right 100\n"
               "  Exact crop:               %(prog)s input.png output.png --left 0 --top 0 --right 1200 --bottom 800\n"
               "  Remove from bottom:       %(prog)s input.png output.png --remove-bottom 50",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("input", help="Input image path")
    parser.add_argument("output", help="Output image path")
    parser.add_argument("--left", type=int, default=0, help="Left edge (default: 0)")
    parser.add_argument("--top", type=int, default=0, help="Top edge (default: 0)")
    parser.add_argument("--right", type=int, help="Right edge (default: image width)")
    parser.add_argument("--bottom", type=int, help="Bottom edge (default: image height)")
    parser.add_argument("--remove-right", type=int, default=0, help="Remove N pixels from right")
    parser.add_argument("--remove-bottom", type=int, default=0, help="Remove N pixels from bottom")

    args = parser.parse_args()

    crop_image(
        args.input,
        args.output,
        args.left,
        args.top,
        args.right,
        args.bottom,
        args.remove_right,
        args.remove_bottom
    )


if __name__ == "__main__":
    main()
