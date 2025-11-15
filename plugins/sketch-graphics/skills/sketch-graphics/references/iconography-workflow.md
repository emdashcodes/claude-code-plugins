# Custom Iconography Workflow

For graphics needing custom icons (brand assets, themed iconography, unique symbols), use the SVG-based workflow. This is the recommended approach for all custom icons as it provides scalability, dynamic theming, and seamless integration.

## The SVG Icon Workflow

**Overview:** Generate PNG icons with AI, convert to scalable SVG using potrace, and draw them directly with the `svg-icon` command. No external compositing tools needed—everything happens in Node.js/Canvas.

## Complete Workflow

### Step 1: Generate PNG Icon with AI

**RECOMMENDED:** Use the dedicated `generate-icon.py` script for consistent whiteboard-style icons:

```bash
# Generate icon using the dedicated script (RECOMMENDED)
python3 scripts/generate-icon.py /tmp/icon-rocket.png "rocket ship"
python3 scripts/generate-icon.py /tmp/icon-chat.png "speech bubble" --size 512
python3 scripts/generate-icon.py /tmp/icon-code.png "curly braces"
```

This script uses a standardized prompt formula optimized for consistency:
- **Whiteboard-style aesthetic** matching rough.js
- **Technical illustration style** with slightly wobbly lines
- **NO TEXT** - Icons only, absolutely no labels or words
- **Clean enough** for SVG conversion but sketchy enough to match rough.js

**Alternative:** Use the general `image-editor` skill if you need more control:

```bash
python3 /path/to/image-editor/scripts/edit_image.py \
  /tmp/custom-icon.png \
  "Clean whiteboard-style hand-drawn crystal icon, technical illustration style with slightly wobbly lines, black marker on white background. IMPORTANT: Icon only, absolutely NO text, NO labels, NO words of any kind." \
  --width 256 --height 256
```

**CRITICAL: Prompt Template for Sketch Icons**

When using the general image-editor script, always use this structure:
```
"Clean whiteboard-style hand-drawn [SUBJECT] icon, technical illustration style with slightly wobbly lines, black marker on white background. IMPORTANT: Icon only, absolutely NO text, NO labels, NO words of any kind."
```

**Example subjects:**
- "rocket ship" → rocket icon
- "speech bubble" → chat bubble icon
- "curly braces" → code brackets icon
- "star burst with radiating lines" → sparkle icon
- "crystal ball" → mystical crystal icon

**Icon generation tips:**
- **NEVER include text** - Icons should be purely visual, no labels or words
- Use the dedicated `generate-icon.py` script for consistency
- Use 256x256px for standard icons, 512x512px for larger graphics
- Keep designs simple and clean (works best as outlines/silhouettes)
- Avoid complex gradients or photo-realistic details
- The whiteboard-style aesthetic matches rough.js perfectly

### Step 2: Convert PNG to SVG

```bash
# Convert to PBM intermediate format
magick /tmp/crystal-icon.png /tmp/crystal-icon.pbm

# Convert to SVG with potrace (--tight removes background)
potrace /tmp/crystal-icon.pbm -s --tight -o /tmp/crystal-icon.svg
```

**Critical potrace options:**
- `-s`: Output SVG format
- `--tight`: Remove whitespace/background (creates transparent SVG with just the icon shapes)

The result is a clean SVG with `fill="#000000"` paths ready for dynamic theming.

### Step 3: Use SVG Icon in Your Graphic

Add the `svg-icon` command to your JSON config:

```json
{
  "style": "witchy",
  "width": 600,
  "height": 400,
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 500,
      "height": 300
    },
    {
      "type": "svg-icon",
      "svgPath": "/tmp/crystal-icon.svg",
      "x": 450,
      "y": 70,
      "height": 100,
      "color": "#B8996B"
    },
    {
      "type": "text",
      "text": "Mystical Crystal",
      "x": 300,
      "y": 200,
      "font": "bold 32px 'Indie Flower'",
      "align": "center"
    }
  ]
}
```

**svg-icon parameters:**
- `svgPath` (required): Absolute path to the SVG file
- `x`, `y` (required): Position to draw the icon
- `height` (optional): Icon height in pixels (default: 32). Width calculated automatically
- `color` (optional): Color for dynamic theming (default: theme primary color)

### Step 4: Generate the Graphic

```bash
node generate.js config.json output.png
```

The SVG icon is:
- Loaded directly from the file (no PNG conversion)
- Colored dynamically (replaces `#000000` with your theme color)
- Scaled while preserving aspect ratio
- Drawn with crisp vector quality

## Why This Workflow

**Benefits over PNG icons:**
- **Scalable**: Vector format scales to any size without quality loss
- **Themeable**: Dynamic color replacement matches your style presets
- **Integrated**: No external compositing tools (PIL, ImageMagick) needed
- **Efficient**: Everything in the same Node.js/Canvas environment

**Benefits over manual SVG creation:**
- **AI-powered**: Generate unique icons quickly with Gemini
- **Consistent**: Same workflow for all custom iconography
- **Simple**: Just 3 steps from idea to integrated icon

## Common Pitfalls and Solutions

### Empty PNG Files

**Problem:** AI icon generation sometimes produces empty PNG files (0 bytes)

**Symptoms:**
```bash
$ file icon.png
icon.png: empty
```

**Solution:**
1. Check the PNG file size before conversion: `ls -lh icon.png`
2. If empty (0 bytes), regenerate with a different prompt
3. Try more specific prompts with explicit style instructions
4. Use the recommended prompt template (see Step 1 above)

**Example fix:**
```bash
# Bad prompt (may produce empty files)
python3 edit_image.py icon.png "chat bubble icon" --width 256 --height 256

# Good prompt (specific and detailed)
python3 edit_image.py icon.png "A simple chat bubble with sparkles. Sketch, hand-drawn, rough style with clean black lines. Black line art on white background. No emojis. Simple, iconic illustration." --width 512 --height 512
```

### Empty SVG Files After Conversion

**Problem:** PNG→SVG conversion produces empty SVG files

**Symptoms:**
```bash
$ file icon.svg
icon.svg: ASCII text  # But 0 bytes or no content
```

**Causes:**
1. **Empty PNG input** - The source PNG was empty (see above)
2. **All-white PNG** - No black pixels to trace
3. **Potrace failed silently** - Conversion error not caught

**Solution:**
1. Always check PNG file before conversion: `ls -lh icon.png`
2. View PNG to confirm it has visible content
3. Re-run potrace with error checking:
```bash
magick icon.png -threshold 50% icon.pbm
if [ -s icon.pbm ]; then
  potrace --tight -s -o icon.svg icon.pbm && echo "✓ SVG created"
else
  echo "✗ PBM conversion failed - PNG may be empty"
fi
```

### svg-icon Command Not Rendering

**Problem:** Config uses `svg-icon` but icons don't appear in output

**Common mistakes:**

1. **Wrong type name:** Used `"type": "svg"` instead of `"type": "svg-icon"`
   ```json
   // ❌ Wrong
   {"type": "svg", "svgPath": "/tmp/icon.svg"}

   // ✅ Correct
   {"type": "svg-icon", "svgPath": "/tmp/icon.svg"}
   ```

2. **Wrong parameter name:** Used `svg_path` or `path` instead of `svgPath`
   ```json
   // ❌ Wrong
   {"type": "svg-icon", "svg_path": "/tmp/icon.svg"}

   // ✅ Correct
   {"type": "svg-icon", "svgPath": "/tmp/icon.svg"}
   ```

3. **Missing file:** SVG file doesn't exist at specified path
   ```bash
   # Check before running generator
   ls -lh /tmp/icon.svg
   ```

**Validation:** Use the validator to catch these issues before generating:
```bash
python3 scripts/validate_config.py config.json
```

### Icon Generation Produces Wrong Style

**Problem:** Generated icons don't match sketch-graphics aesthetic

**Common issues:**
- Too photorealistic or detailed
- Contains emojis instead of line art
- Has gradients or complex shading
- White or colored background instead of transparent

**Solution:** Always use the recommended prompt template:
```
"[Your icon description]. Sketch, hand-drawn, rough style with clean black lines. Black line art on white background. No emojis. Simple, iconic illustration."
```

**Good examples:**
- "A mystical crystal ball. Sketch, hand-drawn, rough style with clean black lines. Black line art on white background. No emojis. Simple, iconic illustration."
- "Gears with magical runes. Sketch, hand-drawn, rough style with clean black lines. Black line art on white background. No emojis. Simple, iconic illustration."

### Potrace Conversion Quality Issues

**Problem:** SVG looks jagged or has too many nodes

**Solution:**
1. Use `--tight` flag to remove background automatically
2. Increase PNG resolution to 512x512px for better detail
3. Ensure PNG has clean black lines on white background
4. Use `-a 1.5` to adjust corner threshold if needed:
```bash
potrace --tight -a 1.5 -s -o icon.svg icon.pbm
```

### Debug Checklist

When icons aren't working, check in this order:

1. ✓ PNG file exists and has content (`ls -lh icon.png`)
2. ✓ PNG contains visible black/dark shapes (view file)
3. ✓ PBM conversion succeeded (`ls -lh icon.pbm`)
4. ✓ SVG file exists and has content (`ls -lh icon.svg`)
5. ✓ SVG contains path elements (`head -20 icon.svg`)
6. ✓ Config uses `"type": "svg-icon"` (not `svg`)
7. ✓ Config uses `"svgPath"` parameter (camelCase)
8. ✓ SVG path in config is absolute and correct
9. ✓ Validator passes (`python3 scripts/validate_config.py config.json`)
10. ✓ Generator runs without warnings

### Automated Debug Tool

Use the debug script to automatically check the entire PNG→SVG conversion pipeline:

```bash
./scripts/debug_icons.sh /tmp/icon-chat
```

This checks:
- PNG file existence and size
- PBM conversion success
- SVG file validity and content
- Presence of SVG path elements

The script provides specific solutions for each type of failure and suggests next steps when everything passes.
