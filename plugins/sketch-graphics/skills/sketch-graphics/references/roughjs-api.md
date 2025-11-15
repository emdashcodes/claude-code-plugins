# Rough.js API Reference

Rough.js creates graphics with a hand-drawn, sketchy appearance.

## Drawing Options

All drawing methods accept an optional `options` object:

```javascript
{
  roughness: 1,           // How rough the drawing is (0-10, default: 1)
  bowing: 1,              // How much lines bow/curve (0-10, default: 1)
  stroke: '#000000',      // Stroke color
  strokeWidth: 1,         // Stroke width in pixels
  fill: 'red',            // Fill color
  fillStyle: 'hachure',   // Fill style: hachure, solid, zigzag, cross-hatch, dots, dashed, zigzag-line
  fillWeight: 1,          // Thickness of fill lines
  hachureAngle: -41,      // Angle of hachure lines
  hachureGap: 4          // Gap between hachure lines
}
```

## Drawing Methods

### Rectangle
```javascript
{
  type: 'rectangle',
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  options: {
    stroke: '#4A90E2',
    strokeWidth: 2,
    fill: '#E8F4FF',
    fillStyle: 'hachure'
  }
}
```

### Circle
```javascript
{
  type: 'circle',
  x: 50,              // Center X
  y: 50,              // Center Y
  diameter: 80,
  options: {
    stroke: '#333',
    fill: 'lightblue'
  }
}
```

### Ellipse
```javascript
{
  type: 'ellipse',
  x: 100,             // Center X
  y: 100,             // Center Y
  width: 150,         // Horizontal diameter
  height: 80,         // Vertical diameter
  options: {}
}
```

### Line
```javascript
{
  type: 'line',
  x1: 10,
  y1: 10,
  x2: 100,
  y2: 100,
  options: {
    stroke: '#000',
    strokeWidth: 2
  }
}
```

### Polygon
```javascript
{
  type: 'polygon',
  points: [[10, 10], [100, 30], [90, 110], [20, 100]],
  options: {
    stroke: '#000',
    fill: 'yellow'
  }
}
```

### Path (SVG Path)
```javascript
{
  type: 'path',
  d: 'M 10 10 L 100 10 L 100 100 Z',  // SVG path data
  options: {
    stroke: '#000',
    strokeWidth: 2
  }
}
```

## Text Rendering

Rough.js doesn't handle text, so we use Canvas API for text:

### Single Line Text
```javascript
{
  type: 'text',
  text: 'Hello World',
  x: 50,
  y: 50,
  font: '20px Arial',
  color: '#333333'
}
```

### Multiline Text
```javascript
{
  type: 'multiline-text',
  lines: ['Line 1', 'Line 2', 'Line 3'],
  x: 50,
  y: 50,
  font: '16px Arial',
  color: '#333',
  lineHeight: 24
}
```

## Example Config

```json
{
  "width": 800,
  "height": 600,
  "background": "#F5F5F5",
  "commands": [
    {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 200,
      "height": 100,
      "options": {
        "stroke": "#4A90E2",
        "strokeWidth": 2,
        "fill": "#E8F4FF",
        "fillStyle": "cross-hatch",
        "roughness": 1.5
      }
    },
    {
      "type": "text",
      "text": "Hello, Rough.js!",
      "x": 150,
      "y": 110,
      "font": "20px Arial",
      "color": "#333"
    }
  ]
}
```

## Tips

1. **Roughness**: Values 1-2 look hand-drawn; higher values look sketchier
2. **Fill styles**: `hachure` (default) and `cross-hatch` look most hand-drawn
3. **Bowing**: Add slight curvature to lines for organic feel
4. **Combine shapes**: Build complex graphics from simple primitives
5. **Text positioning**: Remember Canvas text baseline is at Y coordinate
