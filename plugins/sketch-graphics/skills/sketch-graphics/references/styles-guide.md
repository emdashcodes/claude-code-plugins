# Style Presets Guide

Style presets allow you to apply consistent aesthetics across graphics with a single line of config. Instead of manually specifying colors, roughness, and fonts for every shape, reference a named style that defines your visual theme.

## Available Styles

The skill includes three built-in style presets with full color spectrums:

**default** - Clean, balanced hand-drawn style
- **Core palette:** Blue primary (#0288D1), cyan secondary, green accent, orange tertiary
- **Extended colors:** Full spectrum with semantic info/success/warning/error colors
- **Roughness:** 0.5 (subtle sketch)
- **Font:** Indie Flower
- **Fill style:** Solid
- **Best for:** General diagrams, documentation, professional presentations

**witchy** - Mystical, botanical aesthetic
- **Core palette:** Black primary, antique gold secondary/accent, brown tertiary
- **Extended colors:** Muted earth tones - browns, olive greens, dusty purples and pinks
- **Roughness:** 0.4-0.7 (organic sketch with hachure fills)
- **Font:** Indie Flower
- **Fill style:** Hachure (angled lines, gap: 30, weight: 1)
- **Fill colors:** Uses stroke color (not generated fill color) for colored texture
- **Best for:** Creative projects, mystical themes, botanical designs, vintage aesthetics
- **Tip:** For colored backgrounds, set `fill` to the same color as `stroke` (e.g., `"fill": "purple"`) to get subtle colored hachure texture

## Viewing Style Details

List all available styles:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/list-styles.js
```

View detailed info for a specific style:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/list-styles.js techy
```

## Using Styles in Configs

Add `"style": "style-name"` to your config to apply a preset:

```json
{
  "style": "techy",
  "width": 900,
  "height": 200,
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 70,
      "width": 200,
      "height": 100
    }
  ]
}
```

The style preset automatically applies:
- Background color
- Default roughness and strokeWidth
- Fill styles (solid, cross-hatch, etc.)
- Type-specific defaults (rectangles vs circles)

## Overriding Style Properties

You can override any style property per-shape by specifying it in the command's `options`:

```json
{
  "style": "techy",
  "width": 900,
  "height": 200,
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 70,
      "width": 200,
      "height": 100,
      "options": {
        "stroke": "#FF0000",
        "roughness": 3.0
      }
    }
  ]
}
```

Properties specified in `options` take precedence over style defaults.

## Creating Custom Styles

To create your own style preset:

1. Create a new JSON file in `scripts/styles/` (e.g., `mystyle.json`)
2. Follow the format of existing presets:

```json
{
  "name": "mystyle",
  "description": "My custom aesthetic",
  "defaults": {
    "background": "#FFFFFF"
  },
  "colors": {
    "primary": {
      "stroke": "#000000",
      "fill": "#FFFFFF"
    }
  },
  "fonts": {
    "title": "bold 24px 'Indie Flower'",
    "body": "16px Arial"
  },
  "shapeDefaults": {
    "roughness": 1.5,
    "strokeWidth": 2,
    "fillStyle": "cross-hatch"
  },
  "typeDefaults": {
    "rectangle": {
      "roughness": 2.0
    }
  }
}
```

3. Reference it in configs: `"style": "mystyle"`

## Theme Color System

Each style preset uses a two-tier color system for maximum flexibility and consistency:

### Core Color Palette

The `colorPalette` defines the 4 foundational colors of your theme:

```json
"colorPalette": {
  "primary": "#0288D1",    // Main brand/theme color
  "secondary": "#00BCD4",  // Supporting color
  "accent": "#4CAF50",     // Highlight/emphasis color
  "tertiary": "#FFA726"    // Additional accent
}
```

These automatically generate stroke/fill pairs for shapes. Fill colors are auto-generated at 85% lighter than stroke colors for optimal contrast.

### Extended Color Catalog

The `extendedColors` provide a full color spectrum for variety and semantic meaning:

```json
"extendedColors": {
  "info": "#2196F3",      // Information callouts
  "success": "#4CAF50",   // Success states, tips
  "warning": "#FF9800",   // Warning callouts
  "error": "#F44336",     // Error states
  "red": "#E53935",       // Full color spectrum
  "orange": "#FB8C00",
  "yellow": "#FDD835",
  "green": "#43A047",
  "cyan": "#00ACC1",
  "blue": "#1E88E5",
  "purple": "#8E24AA",
  "pink": "#D81B60",
  "gray": "#757575",
  "muted": "#9E9E9E"     // Neutral/muted elements
}
```

**Each extended color automatically gets:**
- A stroke color (the defined hex value)
- A fill color (auto-generated 85% lighter)

This gives you 18 colors (14 extended + 4 core) with stroke/fill pairs for maximum variety.

### Using Color Names in Configs

Reference colors by name instead of hex values for theme consistency:

```json
{
  "style": "default",
  "commands": [
    {
      "type": "box",
      "x": 50,
      "y": 50,
      "width": 200,
      "height": 100,
      "text": "Primary Box",
      "options": {
        "stroke": "primary",    // Uses theme's primary color
        "fill": "primary"       // Uses auto-generated light fill
      }
    },
    {
      "type": "box",
      "x": 300,
      "y": 50,
      "width": 200,
      "height": 100,
      "text": "Purple Box",
      "options": {
        "stroke": "purple",     // Uses extended purple color
        "fill": "purple"
      }
    },
    {
      "type": "highlight",
      "x": 50,
      "y": 200,
      "width": 150,
      "height": 22,
      "options": {
        "fill": "pink"          // Highlight in theme pink
      }
    }
  ]
}
```

**Benefits:**
- Change the entire color scheme by switching styles
- Colors adapt automatically to each theme
- No hard-coded hex values scattered throughout configs

### Semantic Callout Colors

Callouts automatically use extended colors for semantic meaning:

- **info** → `extendedColors.info` (or `primary` if not defined)
- **warning** → `extendedColors.warning` (or `secondary` if not defined)
- **tip** → `extendedColors.success` (or `accent` if not defined)
- **quote** → `extendedColors.muted` (or neutral gray)

This ensures callouts are colorful and semantically appropriate for each theme:

```json
{
  "type": "callout",
  "x": 50,
  "y": 50,
  "width": 600,
  "text": "This is important information!",
  "options": {
    "type": "info"    // Automatically uses theme's info color
  }
}
```

**Default theme:** Blue info, orange warning, green tip
**Witchy theme:** Brown info, gold warning, olive tip

### Available Color Names

You can reference these color names anywhere you use `stroke` or `fill`:

**Core Palette (4 colors):**
- `primary`, `secondary`, `accent`, `tertiary`

**Extended Catalog (14 colors):**
- `info`, `success`, `warning`, `error`
- `red`, `orange`, `yellow`, `green`
- `cyan`, `blue`, `purple`, `pink`
- `gray`, `muted`

Each name resolves to the appropriate stroke or fill based on context and theme.

## Pattern: Colored Hachure Sections

A common pattern with the witchy style is to create color-coded sections with matching hachure fills. Set both `stroke` and `fill` to the same color name for subtle colored texture:

```json
{
  "style": "witchy",
  "width": 1000,
  "height": 400,
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 900,
      "height": 150,
      "options": {
        "stroke": "purple",
        "strokeWidth": 3,
        "fill": "purple"
      }
    },
    {
      "type": "text",
      "text": "Section Title",
      "x": 80,
      "y": 80,
      "font": "24px 'Permanent Marker'",
      "color": "text"
    },
    {
      "type": "checkbox-list",
      "x": 80,
      "y": 110,
      "items": [
        {"text": "Item 1", "checked": true},
        {"text": "Item 2", "checked": false}
      ],
      "options": {
        "font": "16px 'Indie Flower'",
        "color": "text"
      }
    }
  ]
}
```

**Result:** Purple border with subtle purple diagonal lines inside. Text stays black for readability.

**Key points:**
- Set `fill` to color name (not `"purple-fill"`) to get colored hachure
- Keep text `color: "text"` for black text that's easy to read
- Default hachure settings (gap: 30, weight: 1) provide good balance
