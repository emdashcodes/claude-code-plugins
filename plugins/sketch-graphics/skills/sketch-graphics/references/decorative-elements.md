# Decorative Elements

Add character and visual interest with built-in decorative elements perfect for presentations and hand-crafted technical graphics.

## Arrows

Create arrows with different styles for connecting ideas and showing flow:

**Straight arrow:**
```json
{
  "type": "arrow",
  "x1": 50,
  "y1": 100,
  "x2": 200,
  "y2": 100,
  "options": {
    "stroke": "#000000",
    "strokeWidth": 2
  }
}
```

**Double-headed arrow:**
```json
{
  "type": "arrow",
  "x1": 50,
  "y1": 100,
  "x2": 200,
  "y2": 100,
  "options": {
    "stroke": "#000000",
    "doubleHeaded": true
  }
}
```

**Curved arrow:**
```json
{
  "type": "arrow",
  "x1": 50,
  "y1": 100,
  "x2": 200,
  "y2": 150,
  "options": {
    "stroke": "#000000",
    "curved": true,
    "arrowSize": 15
  }
}
```

## Custom Symbols (svg-icon)

For custom decorative symbols like stars, sparkles, hearts, checkmarks, or any other icons, use the **svg-icon workflow** with AI-generated icons:

**Example: Star icon**
```json
{
  "type": "svg-icon",
  "svgPath": "/tmp/star-icon.svg",
  "x": 100,
  "y": 100,
  "height": 25,
  "color": "#FFD700"
}
```

**Example: Sparkle icon**
```json
{
  "type": "svg-icon",
  "svgPath": "/tmp/sparkle-icon.svg",
  "x": 100,
  "y": 100,
  "height": 15,
  "color": "#000000"
}
```

**See `references/iconography-workflow.md` for complete instructions on:**
- Generating custom icons with AI (image-editor skill)
- Converting PNG→SVG with potrace
- Using svg-icon commands in your configs
- Troubleshooting icon workflows

## Underlines

Hand-drawn underlines for emphasis:

**Straight underline:**
```json
{
  "type": "underline",
  "x1": 50,
  "y": 100,
  "x2": 200,
  "style": "straight",
  "options": {
    "stroke": "#000000"
  }
}
```

**Wavy underline:**
```json
{
  "type": "underline",
  "x1": 50,
  "y": 100,
  "x2": 200,
  "style": "wavy",
  "options": {
    "stroke": "#000000"
  }
}
```

**Double underline:**
```json
{
  "type": "underline",
  "x1": 50,
  "y": 100,
  "x2": 200,
  "style": "double",
  "options": {
    "stroke": "#000000"
  }
}
```

## Corner Flourishes

Decorative corner ornaments for framing content:

**Basic corner flourish:**
```json
{
  "type": "corner-flourish",
  "x": 100,
  "y": 100,
  "size": 30,
  "corner": "tl",
  "options": {
    "stroke": "#B8996B",
    "strokeWidth": 2
  }
}
```

**Auto-matching parent box color:**
When you want flourishes to automatically match the stroke color of the previous rectangle, use `matchParentStroke`:

```json
{
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150,
  "options": {
    "stroke": "#D4AF78",
    "fill": "#F5F1E8"
  }
},
{
  "type": "corner-flourish",
  "x": 100,
  "y": 100,
  "size": 25,
  "corner": "tl",
  "matchParentStroke": true
}
```

The flourish will automatically use `#D4AF78` to match the box. You can still override with explicit `stroke` in options.

**Corner positions:** `"tl"` (top-left), `"tr"` (top-right), `"bl"` (bottom-left), `"br"` (bottom-right)

## Dividers

Decorative section dividers:

```json
{
  "type": "divider",
  "x": 400,
  "y": 100,
  "width": 600,
  "options": {
    "stroke": "#000000"
  }
}
```
