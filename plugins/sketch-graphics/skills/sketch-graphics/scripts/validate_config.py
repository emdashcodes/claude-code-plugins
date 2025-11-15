#!/usr/bin/env python3
"""
Sketch Graphics Config Validator

Validates JSON configuration files for common mistakes:
- svg_icon vs svg-icon (underscore vs hyphen)
- svg_path vs svgPath (snake_case vs camelCase)
- size vs height for svg-icon commands
- SVG file existence and format
- PNG icon generation workflow issues
- Emoji usage in text commands
- Missing required parameters
"""

import sys
import json
import re
import os
from pathlib import Path


def has_emoji(text: str) -> bool:
    """Check if text contains emoji characters."""
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"  # dingbats
        "\U000024C2-\U0001F251"  # enclosed characters
        "]+",
        flags=re.UNICODE
    )
    return bool(emoji_pattern.search(text))


def has_checkbox_pattern(text: str) -> bool:
    """Check if text contains checkbox patterns like [x], [ ], ☑, ☐, etc."""
    # Check for markdown-style checkboxes
    if re.search(r'\[[ xX]\]', text):
        return True
    # Check for checkbox emoji/unicode characters
    checkbox_chars = ['☐', '☑', '☒', '✓', '✔', '✅', '❌']
    return any(char in text for char in checkbox_chars)


def validate_config(config_path: str) -> tuple[list[str], list[str]]:
    """
    Validate a sketch-graphics JSON config.

    Returns:
        (errors, warnings) - Lists of error and warning messages
    """
    errors = []
    warnings = []

    # Load config
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        return ([f"❌ ERROR: File not found: {config_path}"], [])
    except json.JSONDecodeError as e:
        return ([f"❌ ERROR: Invalid JSON: {e}"], [])

    # Check all commands
    commands = config.get('commands', [])
    if not commands:
        warnings.append("⚠️  WARNING: No commands found in config")

    for i, cmd in enumerate(commands):
        cmd_num = i + 1
        cmd_type = cmd.get('type', '')

        # Check for svg_icon (wrong) vs svg-icon (correct)
        if cmd_type == 'svg_icon':
            errors.append(
                f"❌ ERROR: Command #{cmd_num} uses 'svg_icon' (underscore). "
                f"Should be 'svg-icon' (hyphen)."
            )

        # Check svg-icon specific issues
        if cmd_type == 'svg-icon':
            # Check for svg_path (wrong) vs svgPath (correct)
            if 'svg_path' in cmd:
                errors.append(
                    f"❌ ERROR: Command #{cmd_num} uses 'svg_path' (snake_case). "
                    f"Should be 'svgPath' (camelCase)."
                )

            # Check for size (wrong) vs height (correct)
            if 'size' in cmd:
                errors.append(
                    f"❌ ERROR: Command #{cmd_num} uses 'size' parameter. "
                    f"Should use 'height' instead."
                )

            # Check for missing svgPath
            if 'svgPath' not in cmd and 'svg_path' not in cmd:
                errors.append(
                    f"❌ ERROR: Command #{cmd_num} missing required 'svgPath' parameter."
                )

            # Check for missing position
            if 'x' not in cmd or 'y' not in cmd:
                errors.append(
                    f"❌ ERROR: Command #{cmd_num} missing required 'x' and/or 'y' position."
                )

            # Check if SVG file exists
            svg_path = cmd.get('svgPath', cmd.get('svg_path'))
            if svg_path:
                if not os.path.exists(svg_path):
                    warnings.append(
                        f"⚠️  WARNING: Command #{cmd_num} references SVG file that doesn't exist: {svg_path}"
                    )
                elif os.path.getsize(svg_path) == 0:
                    errors.append(
                        f"❌ ERROR: Command #{cmd_num} references empty SVG file: {svg_path}. "
                        f"Check PNG→SVG conversion workflow."
                    )
                else:
                    # Check if it's actually an SVG file
                    try:
                        with open(svg_path, 'r', encoding='utf-8') as f:
                            content = f.read(100)
                            if not content.strip().startswith('<?xml') and not content.strip().startswith('<svg'):
                                warnings.append(
                                    f"⚠️  WARNING: Command #{cmd_num} file doesn't appear to be SVG format: {svg_path}"
                                )
                    except Exception:
                        pass  # Ignore read errors, file might be binary

        # Check for checkbox patterns in text commands
        if cmd_type == 'text' and 'text' in cmd:
            text_content = cmd['text']

            # Check for checkbox patterns - require using checkbox list helper for consistency
            if has_checkbox_pattern(text_content):
                errors.append(
                    f"❌ ERROR: Command #{cmd_num} contains checkbox pattern: '{text_content[:50]}...' "
                    f"Use 'checkbox-list' helper type instead for consistent styling! "
                    f"See references/list-helpers.md for examples."
                )

            # Check for emoji - these don't render well, recommend svg-icon
            elif has_emoji(text_content):
                errors.append(
                    f"❌ CRITICAL: Command #{cmd_num} contains emoji in text: '{text_content[:50]}...' "
                    f"Emojis don't render well. Use svg-icon command with custom icon generation instead! "
                    f"See references/iconography-workflow.md"
                )

    return (errors, warnings)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate_config.py <config.json>")
        print()
        print("Validates sketch-graphics JSON configs for common mistakes:")
        print("  - svg_icon vs svg-icon")
        print("  - svg_path vs svgPath")
        print("  - size vs height")
        print("  - Emoji usage")
        print("  - Missing parameters")
        sys.exit(1)

    config_path = sys.argv[1]

    if not Path(config_path).exists():
        print(f"❌ ERROR: File not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Validating: {config_path}")
    print()

    errors, warnings = validate_config(config_path)

    # Print results
    if not errors and not warnings:
        print("✅ No issues found! Config looks good.")
        sys.exit(0)

    if errors:
        print(f"Found {len(errors)} error(s):")
        print()
        for error in errors:
            print(f"  {error}")
        print()

    if warnings:
        print(f"Found {len(warnings)} warning(s):")
        print()
        for warning in warnings:
            print(f"  {warning}")
        print()

    # Exit with error code if there were errors
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
