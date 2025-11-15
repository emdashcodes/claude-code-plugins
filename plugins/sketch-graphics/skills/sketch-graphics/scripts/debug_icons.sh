#!/bin/bash
# Debug Icon Generation Workflow
# Checks PNG→SVG conversion pipeline for common issues

set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: ./debug_icons.sh <icon-base-name>"
    echo ""
    echo "Example: ./debug_icons.sh /tmp/icon-chat"
    echo "  Checks: /tmp/icon-chat.png → /tmp/icon-chat.pbm → /tmp/icon-chat.svg"
    echo ""
    echo "This script validates each step of the PNG→SVG conversion workflow."
    exit 1
fi

BASE="$1"
PNG="${BASE}.png"
PBM="${BASE}.pbm"
SVG="${BASE}.svg"

echo "🔍 Debugging Icon Conversion Pipeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check PNG
echo "Step 1: PNG File Check"
if [ ! -f "$PNG" ]; then
    echo "  ❌ PNG file not found: $PNG"
    echo ""
    echo "💡 Solution: Generate the PNG first with image-editor skill"
    exit 1
fi

PNG_SIZE=$(stat -f%z "$PNG" 2>/dev/null || stat -c%s "$PNG" 2>/dev/null)
if [ "$PNG_SIZE" -eq 0 ]; then
    echo "  ❌ PNG file is empty (0 bytes)"
    echo ""
    echo "💡 Solution: AI generation failed. Try:"
    echo "  1. Use more specific prompt with style instructions"
    echo "  2. Include: 'Sketch, hand-drawn, rough style with clean black lines'"
    echo "  3. Add: 'Black line art on white background. No emojis.'"
    echo "  4. Increase resolution to 512x512px"
    exit 1
fi

echo "  ✓ PNG exists: $PNG ($PNG_SIZE bytes)"

# Check if it's actually a PNG
file "$PNG" | grep -q "PNG" || {
    echo "  ⚠️  Warning: File doesn't appear to be PNG format"
}

echo ""

# Step 2: Check PBM conversion
echo "Step 2: PBM Conversion Check"
if [ ! -f "$PBM" ]; then
    echo "  ⚠️  PBM file not found: $PBM"
    echo "  Converting PNG to PBM..."
    magick "$PNG" -threshold 50% "$PBM" || {
        echo "  ❌ ImageMagick conversion failed"
        echo ""
        echo "💡 Solution: Check ImageMagick installation:"
        echo "  brew install imagemagick"
        exit 1
    }
fi

PBM_SIZE=$(stat -f%z "$PBM" 2>/dev/null || stat -c%s "$PBM" 2>/dev/null)
if [ "$PBM_SIZE" -eq 0 ]; then
    echo "  ❌ PBM file is empty (0 bytes)"
    echo ""
    echo "💡 Solution: PNG may be all-white or corrupted"
    exit 1
fi

echo "  ✓ PBM exists: $PBM ($PBM_SIZE bytes)"
echo ""

# Step 3: Check SVG conversion
echo "Step 3: SVG Conversion Check"
if [ ! -f "$SVG" ]; then
    echo "  ⚠️  SVG file not found: $SVG"
    echo "  Converting PBM to SVG..."
    potrace --tight -s -o "$SVG" "$PBM" || {
        echo "  ❌ Potrace conversion failed"
        echo ""
        echo "💡 Solution: Check potrace installation:"
        echo "  brew install potrace"
        exit 1
    }
fi

SVG_SIZE=$(stat -f%z "$SVG" 2>/dev/null || stat -c%s "$SVG" 2>/dev/null)
if [ "$SVG_SIZE" -eq 0 ]; then
    echo "  ❌ SVG file is empty (0 bytes)"
    echo ""
    echo "💡 Solution: Potrace conversion failed - check PBM content"
    exit 1
fi

echo "  ✓ SVG exists: $SVG ($SVG_SIZE bytes)"

# Check SVG content
if head -1 "$SVG" | grep -q "svg"; then
    echo "  ✓ SVG format validated"
else
    echo "  ⚠️  Warning: SVG header not found"
fi

# Check for path elements
PATH_COUNT=$(grep -c "<path" "$SVG" || echo "0")
if [ "$PATH_COUNT" -gt 0 ]; then
    echo "  ✓ Found $PATH_COUNT path element(s) in SVG"
else
    echo "  ⚠️  Warning: No path elements found - SVG may be empty"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Use in config: {\"type\": \"svg-icon\", \"svgPath\": \"$SVG\", \"x\": X, \"y\": Y, \"height\": 80}"
echo "  2. Validate config: python3 scripts/validate_config.py config.json"
echo "  3. Generate graphic: node scripts/generate.js config.json output.png"
