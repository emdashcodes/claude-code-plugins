# Text Enhancements

## Highlights

Add marker-style highlights behind text (perfect for emphasis):

```json
{
  "type": "highlight",
  "x": 50,
  "y": 100,
  "width": 150,
  "height": 25,
  "options": {
    "fill": "#FFEB3B",
    "fillStyle": "solid"
  }
}
```

**Draw text on top:**
```json
{
  "type": "highlight",
  "x": 50,
  "y": 100,
  "width": 150,
  "height": 25
},
{
  "type": "text",
  "text": "Important text",
  "x": 50,
  "y": 100,
  "font": "20px 'Indie Flower'",
  "color": "#000000"
}
```

Colors: Yellow (`#FFEB3B`), Pink (`#FF69B4`), Green (`#4CAF50`), or any custom color.

## Badges

Pill-shaped labels for tags, status, versions:

```json
{
  "type": "badge",
  "x": 200,
  "y": 100,
  "text": "NEW",
  "options": {
    "font": "bold 14px 'Indie Flower'",
    "textColor": "#FFFFFF",
    "fill": "#4CAF50",
    "stroke": "#2E7D32",
    "padding": { "x": 12, "y": 6 }
  }
}
```

Common badge styles:
- **Success**: fill `#4CAF50`, stroke `#2E7D32`
- **Warning**: fill `#FF9800`, stroke `#F57C00`
- **Info**: fill `#2196F3`, stroke `#1976D2`
- **Premium**: fill `#D4AF78`, stroke `#B8996B`, textColor `#000000`

## Callout Boxes

Information boxes with icons for notes, warnings, tips, and quotes:

### Info Box
```json
{
  "type": "callout",
  "x": 50,
  "y": 100,
  "width": 300,
  "text": "This is helpful information for your users.",
  "options": {
    "type": "info",
    "font": "16px 'Indie Flower'",
    "textColor": "#000000"
  }
}
```

### Warning Box
```json
{
  "type": "callout",
  "x": 50,
  "y": 100,
  "width": 300,
  "text": "Be careful! Important warning here.",
  "options": {
    "type": "warning",
    "font": "16px 'Indie Flower'"
  }
}
```

### Tip Box
```json
{
  "type": "callout",
  "x": 50,
  "y": 100,
  "width": 300,
  "text": "Pro tip: Use callouts to highlight key information.",
  "options": {
    "type": "tip",
    "font": "16px 'Indie Flower'"
  }
}
```

### Quote Box
```json
{
  "type": "callout",
  "x": 50,
  "y": 100,
  "width": 300,
  "text": "The best way to predict the future is to invent it. - Alan Kay",
  "options": {
    "type": "quote",
    "font": "italic 16px 'Indie Flower'"
  }
}
```

**Types:** `"info"`, `"warning"`, `"tip"`, `"quote"`
