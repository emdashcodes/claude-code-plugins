# List Helpers

Automatically formatted lists with consistent spacing:

## Bullet Lists

```json
{
  "type": "bullet-list",
  "x": 50,
  "y": 100,
  "items": ["First item", "Second item", "Third item"],
  "options": {
    "font": "16px 'Indie Flower'",
    "color": "#000000",
    "lineHeight": 25,
    "bulletStyle": "dot",
    "bulletColor": "#000000"
  }
}
```

**Bullet styles:** `"dot"`, `"dash"`, `"arrow"`, `"star"`

**Arrow bullets (for action items):**
```json
{
  "type": "bullet-list",
  "x": 50,
  "y": 100,
  "items": ["Do this", "Then this", "Finally this"],
  "options": {
    "bulletStyle": "arrow"
  }
}
```

**Star bullets (for highlights):**
```json
{
  "type": "bullet-list",
  "x": 50,
  "y": 100,
  "items": ["Special feature", "New capability", "Key benefit"],
  "options": {
    "bulletStyle": "star",
    "bulletColor": "#D4AF78"
  }
}
```

## Numbered Lists

```json
{
  "type": "numbered-list",
  "x": 50,
  "y": 100,
  "items": ["First step", "Second step", "Third step"],
  "options": {
    "font": "16px 'Indie Flower'",
    "color": "#000000",
    "lineHeight": 25,
    "startNumber": 1
  }
}
```

## Checkbox Lists

```json
{
  "type": "checkbox-list",
  "x": 50,
  "y": 100,
  "items": [
    {"text": "Completed task", "checked": true},
    {"text": "In progress", "checked": false},
    {"text": "Not started", "checked": false}
  ],
  "options": {
    "font": "16px 'Indie Flower'",
    "color": "#000000",
    "lineHeight": 25
  }
}
```
