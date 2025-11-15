# Connectors & Brackets

## Curly Braces

For grouping multiple items:

```json
{
  "type": "curly-brace",
  "x": 200,
  "y1": 100,
  "y2": 250,
  "direction": "right",
  "options": {
    "stroke": "#000000",
    "strokeWidth": 2
  }
}
```

**Direction:** `"right"` or `"left"`

## Brackets

Square, round, or angle brackets:

**Square bracket:**
```json
{
  "type": "bracket",
  "x": 100,
  "y1": 100,
  "y2": 200,
  "bracketType": "square",
  "direction": "left",
  "options": {
    "stroke": "#000000"
  }
}
```

**Round bracket:**
```json
{
  "type": "bracket",
  "x": 100,
  "y1": 100,
  "y2": 200,
  "bracketType": "round",
  "direction": "left"
}
```

**Angle bracket:**
```json
{
  "type": "bracket",
  "x": 100,
  "y1": 100,
  "y2": 200,
  "bracketType": "angle",
  "direction": "right"
}
```

**Types:** `"square"`, `"round"`, `"angle"`
**Direction:** `"left"` or `"right"`

## Speech & Thought Bubbles

**Speech bubble:**
```json
{
  "type": "bubble",
  "x": 100,
  "y": 100,
  "width": 180,
  "height": 80,
  "options": {
    "type": "speech",
    "tailX": 130,
    "tailY": 200,
    "stroke": "#000000",
    "fill": "#F5F1E8"
  }
}
```

**Thought bubble:**
```json
{
  "type": "bubble",
  "x": 100,
  "y": 100,
  "width": 180,
  "height": 80,
  "options": {
    "type": "thought",
    "stroke": "#000000",
    "fill": "#F5F1E8"
  }
}
```

## Converting Custom Icons (PNG to SVG)

**Note:** For the complete custom iconography workflow with step-by-step examples, see `references/iconography-workflow.md`.

This section provides technical details on the PNG → SVG conversion process used by the skill.

**Quick Reference:**

```bash
# 1. Generate PNG icon (200x200px, black on white)
python3 /path/to/image-editor/scripts/generate_image.py icon.png "your prompt"

# 2. Convert to SVG
magick icon.png icon.pbm
potrace icon.pbm -s --tight -o icon.svg

# 3. Use in config with svg-icon command
```

**Why This Conversion Process:**

- **Potrace**: Industry-standard bitmap → vector converter
- **--tight option**: Removes whitespace/background automatically
- **Result**: Clean SVG with `fill="#000000"` paths ready for dynamic theming
- **Scalable**: Vector format = crisp rendering at any size

**Technical Details:**

The potrace conversion creates SVG files with these characteristics:

1. **Filled paths** (not strokes): `<path fill="#000000" />`
2. **Transparent background**: `--tight` removes whitespace
3. **Variable dimensions**: Each icon preserves its natural aspect ratio
4. **Dynamic theming ready**: Simple text replacement changes colors

**Icon Requirements for Best Results:**

- 200x200px PNG recommended
- Black or dark foreground on white/transparent background
- Simple, clean designs (line art, silhouettes)
- Avoid complex gradients or photo-realistic details

**How Dynamic Theming Works:**

The `svg-icon` command automatically replaces black colors:

```javascript
// Done automatically by svg-icon command
coloredSVG = svgContent
  .replace(/fill="#000000"/g, `fill="${yourThemeColor}"`)
  .replace(/stroke="#000000"/g, `stroke="${yourThemeColor}"`)
```

**Alternative Tools Evaluated:**

- **VTracer**: Too complex (150k+ line SVG files)
- **maptrace**: Designed for map regions, not line art
- **autotrace --centerline**: Failed due to pstoedit version issues
- **Rough.js hachure**: Too sketchy vs clean AI-generated icons
