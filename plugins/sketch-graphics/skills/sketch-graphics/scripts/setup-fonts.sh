#!/bin/bash

# Setup script for Rough.js Graphics - Downloads hand-drawn fonts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🎨 Rough.js Graphics Font Setup"
echo "================================"
echo ""

# Define fonts to download (format: "filename|url")
# Only including fonts with verified working URLs
FONTS=(
    "IndieFlower-Regular.ttf|https://github.com/google/fonts/raw/main/ofl/indieflower/IndieFlower-Regular.ttf"
    "PermanentMarker-Regular.ttf|https://github.com/google/fonts/raw/main/apache/permanentmarker/PermanentMarker-Regular.ttf"
    "AmaticSC-Regular.ttf|https://github.com/google/fonts/raw/main/ofl/amaticsc/AmaticSC-Regular.ttf"
    "AmaticSC-Bold.ttf|https://github.com/google/fonts/raw/main/ofl/amaticsc/AmaticSC-Bold.ttf"
    "Kalam-Regular.ttf|https://github.com/google/fonts/raw/main/ofl/kalam/Kalam-Regular.ttf"
    "Kalam-Bold.ttf|https://github.com/google/fonts/raw/main/ofl/kalam/Kalam-Bold.ttf"
)

DOWNLOADED=0
SKIPPED=0
FAILED=0

# Download each font
for FONT_ENTRY in "${FONTS[@]}"; do
    IFS='|' read -r FONT_FILE FONT_URL <<< "$FONT_ENTRY"
    FONT_PATH="$SCRIPT_DIR/$FONT_FILE"

    # Check if font already exists
    if [ -f "$FONT_PATH" ]; then
        echo "✅ $FONT_FILE (already installed)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    echo "📥 Downloading $FONT_FILE..."

    # Download from Google Fonts
    if curl -L "$FONT_URL" \
        -o "$FONT_PATH" \
        --silent \
        --show-error \
        --fail; then
        echo "   ✅ Installed"
        DOWNLOADED=$((DOWNLOADED + 1))
    else
        echo "   ❌ Failed to download"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "================================"
echo "📊 Summary:"
echo "   Downloaded: $DOWNLOADED"
echo "   Skipped: $SKIPPED"
echo "   Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "⚠️  Some fonts failed to download"
    echo "   You can manually download them from: https://fonts.google.com"
    exit 1
fi

echo "✨ Font setup complete!"
