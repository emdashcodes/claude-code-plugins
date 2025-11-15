---
name: sketch-graphics
description: This skill should be used when creating hand-drawn style diagrams, flowcharts, or technical illustrations. Ideal for whiteboard-style visuals requiring perfect text accuracy, consistent theming via style presets, and for decorative elements (arrows/symbols/callouts). Use when requests mention "sketchy," "hand-drawn," "rough," or "whiteboard" aesthetics, or for presentation graphics. Do not use for normal image or illustration generation. Outputs PNG graphics from declarative JSON configs.
---

# Sketch Graphics Generator

Create professional hand-drawn style graphics through declarative JSON configs. This skill uses Rough.js and Canvas API to generate PNG images with sketchy aesthetics. Ideal for repeatable workflows, technical diagrams, presentation graphics, and any visual that needs the warmth of hand-drawn style without sacrificing readability or consistency.

**What you can create:** Flowcharts, process diagrams, architecture illustrations, step-by-step workflows, callout graphics, list visualizations, technical documentation graphics, presentation slides, and any diagram requiring hand-drawn aesthetics with professional accuracy.

### Named Color Theming System

Use **semantic color names** instead of hex codes—colors automatically adapt when you switch style presets. Reference colors like `"primary"`, `"purple"`, `"info"`, `"warning"` in your configs, and they'll resolve to theme-appropriate values. Each preset (default/witchy) includes 18 colors (4 core + 14 extended) with auto-generated fills. Create multiple graphics that stay visually cohesive—just change `"style": "witchy"` and all colors update automatically. See `references/styles-guide.md` for the complete color system.

**CRITICAL: ALWAYS use a theme and it's pre-set colors instead of passing your own hex colors**

### Custom Iconography Workflow

**AI-generated custom icons** seamlessly integrated into the graphics. Generate unique icons with `scripts/generate-icon.py`, convert PNG→SVG via potrace, and embed them directly in your graphics with dynamic theming and perfect scaling. No manual icon hunting, theme-consistent icons on-demand (crystals, lightning bolts, tarot cards, tech symbols, anything). See `references/iconography-workflow.md` for the complete workflow.

**Important**: Use these instead of emoji! Do NOT use emojis as they do not look good.

## When to Use

Use this skill when:

- Creating diagrams or illustrations needing a hand-drawn, sketchy aesthetic
- Building graphics with boxes, circles, arrows, and text that look whiteboard-drawn
- Requiring text accuracy while maintaining artistic style
- Generating flowcharts, architecture diagrams, or visual lists with a sketch feel
- The user requests "hand-drawn," "sketchy," "whiteboard-style," or "rough" graphics

## Requirements

This skill requires the following tools to be installed:

**Core Requirements (for basic graphics):**

- **Node.js** - Runtime environment for the generator
- **npm** - Package manager (comes with Node.js)
- **roughjs** and **canvas** packages - Installed via `npm install` in scripts directory
- **Hand-drawn fonts** - Indie Flower, Permanent Marker, etc. (auto-installed via `setup-fonts.sh`)

**Additional Requirements (for custom SVG icons):**

- **ImageMagick** (`magick` command) - For PNG → PBM conversion
- **potrace** - For bitmap → SVG conversion with `--tight` option
- **image-editor skill** (optional) - For AI-powered icon generation via Gemini

**Installation:**

```bash
# Install Node.js packages (required)
cd ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/
npm install

# Install hand-drawn fonts (required)
./setup-fonts.sh

# ImageMagick (for custom icons)
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: Download from imagemagick.org

# potrace (for custom icons)
# macOS: brew install potrace
# Ubuntu: sudo apt-get install potrace
# Windows: Download from potrace.sourceforge.net
```

## Workflow

### Step 1: Install Dependencies (First Time Only)

Before first use, install Node.js dependencies and fonts:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/
npm install
./setup-fonts.sh
```

This installs:

- `roughjs` and `canvas` packages (npm install)
- Indie Flower font from Google Fonts (setup-fonts.sh)

**Note:** The font setup script will automatically download Indie Flower and other fonts if they are not already installed. If you see font-related errors when generating graphics, run `./setup-fonts.sh` manually.

### Step 2: Plan the Graphic

Determine the layout requirements:

1. Canvas dimensions (width x height in pixels)
2. Element positions and sizes
3. Text content and positioning
4. Colors and styling

### Step 3: Create Config JSON

Write a JSON configuration file describing the graphic. The config contains:

- `width` and `height`: Canvas dimensions (logical pixels)
- `scale` (optional): Rendering scale for high-DPI displays (default: 2 for retina, set to 1 for standard)
- `background`: Background color (hex or CSS color name)
- `commands`: Array of drawing instructions

Example minimal config:

```json
{
  "width": 800,
  "height": 400,
  "style": "witchy",
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 200,
      "height": 100,
      "options": {
        "stroke": "#4A90E2",
        "strokeWidth": 2
      }
    },
    {
      "type": "text",
      "text": "Hello World",
      "x": 150,
      "y": 110,
      "font": "18px Arial",
      "color": "#333"
    }
  ]
}
```

**By default, all images are generated at 2x resolution** (retina) for crisp display on high-DPI screens. The example above will generate a 1600x800px image. To generate standard resolution, set `"scale": 1`.

### Step 4: Generate the PNG

Run the generator script:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/generate.js <config.json> <output.png>
```

### Step 5: Validate and Generate

Before generating, **always** validate the config to catch common mistakes:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/validate_config.py <config.json>
```

The validator checks for:

- Correct command types (`svg-icon` not `svg`)
- Proper parameter names (`svgPath` not `svg_path`)
- SVG file existence and validity
- Empty file detection
- Common configuration errors

### Step 6: Review and Iterate

View the generated PNG. If adjustments are needed, modify the JSON config and regenerate. Think about how the graphic looks in terms of a "handmade" feel. If icons, text, or backgrounds don't look right iterate with the user.

## Available Features

This skill includes extensive capabilities for creating professional hand-drawn graphics. Load reference documentation as needed:

### Style Presets

Apply consistent aesthetics with style presets. Available styles:

**default** - Clean, balanced hand-drawn style
- Core palette: Blue primary (#0288D1), cyan secondary, green accent
- Fill style: Solid
- Best for: General diagrams, professional presentations

**witchy** - Mystical, botanical aesthetic
- Core palette: Black primary, antique gold secondary/accent, brown tertiary
- Extended colors: Muted earth tones (browns, olive greens, dusty purples, pinks)
- Fill style: Hachure (angled lines, gap: 30, weight: 1)
- **Important**: For colored backgrounds, set `fill` to same color as `stroke` (e.g., `"fill": "purple"`) to get subtle colored hachure texture
- Best for: Creative projects, mystical themes, botanical designs

**Using styles:**
```json
{
  "style": "witchy",
  "commands": [...]
}
```

**Color names available (18 total):**
- Core: `primary`, `secondary`, `accent`, `tertiary`, `text`
- Extended: `info`, `success`, `warning`, `error`, `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `gray`, `muted`

See **`references/styles-guide.md`** for detailed documentation and the "Colored Hachure Sections" pattern.

### Hand-Drawn Fonts

Multiple hand-drawn fonts available (Indie Flower, Permanent Marker, Amatic SC, Kalam). See **`references/fonts-guide.md`** for font details and usage.

### Drawing Commands

Basic shapes (rectangles, circles, lines, text, SVG icons) and advanced elements. See **`references/roughjs-api.md`** for comprehensive API documentation.

### Decorative Elements

Arrows, underlines, corner flourishes, and dividers. See **`references/decorative-elements.md`** for complete examples.

**Note:** For custom decorative symbols (stars, sparkles, hearts, etc.), use the svg-icon workflow with AI-generated icons instead of built-in decorative elements.

### Text Enhancements

Highlights, badges, and callout boxes (info, warning, tip, quote). See **`references/text-enhancements.md`** for styling options.

### Connectors & Brackets

Curly braces, brackets (square, round, angle), speech bubbles, and PNG→SVG icon conversion. See **`references/connectors-brackets.md`** for examples.

### List Helpers

Automatically formatted lists with consistent spacing:

**Checkbox Lists** (recommended for task items):
```json
{
  "type": "checkbox-list",
  "x": 50,
  "y": 100,
  "items": [
    {"text": "Completed task", "checked": true},
    {"text": "Pending task", "checked": false}
  ],
  "options": {
    "font": "16px 'Indie Flower'",
    "color": "text",
    "lineHeight": 28
  }
}
```

**Bullet Lists:**
```json
{
  "type": "bullet-list",
  "x": 50,
  "y": 100,
  "items": ["First", "Second", "Third"],
  "options": {
    "bulletStyle": "dot"  // "dot", "dash", "arrow", "star"
  }
}
```

**Numbered Lists:**
```json
{
  "type": "numbered-list",
  "x": 50,
  "y": 100,
  "items": ["Step 1", "Step 2", "Step 3"]
}
```

See **`references/list-helpers.md`** for more options.

### Dimension Calculations

Calculator utility and formulas for sizing boxes correctly. See **`references/dimension-calculations.md`** for:

- Dimension calculator utility
- Manual calculation formulas
- Common layout patterns
- Vertical positioning tips
- Text line height guidelines

### Custom Iconography

SVG-based workflow for custom icons with AI generation and potrace conversion. See **`references/iconography-workflow.md`** for:

- Complete 4-step workflow (AI generation → PNG→SVG → integration → render)
- Icon generation tips and prompt templates
- SVG icon parameters (`svg-icon` command)

**Important:** Always use `"type": "svg-icon"` (not `svg`) and `"svgPath"` (camelCase) in configs. Run the validator to catch mistakes before generating.

## Common Patterns for Reproducible Graphics

### Pattern: Colored Hachure Sections (Witchy Style)

Create color-coded sections with matching hachure fills:

```json
{
  "style": "witchy",
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 100,
      "width": 900,
      "height": 200,
      "options": {
        "stroke": "purple",
        "strokeWidth": 3,
        "fill": "purple",        // Same as stroke for colored hachure
        "roughness": 2
      }
    },
    {
      "type": "text",
      "text": "Section Title",
      "x": 80,
      "y": 130,
      "font": "24px 'Permanent Marker'",
      "color": "text"            // Black text for readability
    },
    {
      "type": "checkbox-list",
      "x": 80,
      "y": 160,
      "items": [
        {"text": "Task 1", "checked": true},
        {"text": "Task 2", "checked": false}
      ],
      "options": {
        "font": "16px 'Indie Flower'",
        "color": "text",
        "lineHeight": 28
      }
    }
  ]
}
```

**Key points:**
- Set `fill` to color name (e.g., `"purple"`) not `"purple-fill"` for colored hachure
- Keep text `color: "text"` for black text
- Default hachure (gap: 30, weight: 1) provides good balance
- Draw rectangles first, then text on top for proper layering

## Tips for Best Results

1. **Start simple**: Begin with basic shapes and add complexity
2. **Roughness**: Use 1-2 for subtle hand-drawn effect; higher for sketchier look
3. **Fill styles**: Available: `solid`, `hachure`, `cross-hatch`, `dots`, `zigzag`, `dashed`
4. **Text positioning**: Canvas uses baseline positioning—adjust Y coordinates accordingly
5. **Iterate on config**: Edit JSON and regenerate rather than starting over
6. **Layer order**: Draw backgrounds/rectangles first, then arrows, then text on top
7. **Color consistency**: Use theme color names for cohesion
8. **Custom fonts**: Use 'Indie Flower' for body text, 'Permanent Marker' for titles
9. **Checkbox patterns**: Always use `checkbox-list` type instead of `[x]` in text—the validator enforces this for consistency

## Resources

### scripts/generate.js

Main script that processes JSON configs and generates PNG outputs using Rough.js and Canvas API.

### references/

Comprehensive documentation organized by topic:

- `roughjs-api.md` - Complete drawing command reference
- `styles-guide.md` - Style presets and theming
- `fonts-guide.md` - Hand-drawn font catalog
- `decorative-elements.md` - Arrows, symbols, flourishes
- `text-enhancements.md` - Highlights, badges, callouts
- `connectors-brackets.md` - Braces, brackets, bubbles, icon conversion
- `list-helpers.md` - Formatted lists
- `dimension-calculations.md` - Box sizing and positioning
- `iconography-workflow.md` - Custom SVG icon workflow
