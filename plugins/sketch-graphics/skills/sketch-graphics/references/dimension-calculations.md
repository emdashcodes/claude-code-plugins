# Calculating Box Dimensions

One of the most common issues when creating graphics is boxes being too short for their content, causing text to get cut off. Use these strategies to calculate appropriate dimensions.

## Dimension Calculator Utility

Use the included calculator script for quick dimension calculations:

```bash
# Calculate box height for content with icon
node ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/calculate-dimensions.js box \
  --lines 3 --icon-height 100 --padding 70

# Get suggested dimensions for common layouts
node ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/calculate-dimensions.js layout icon-title-text \
  --text-lines 3 --padding 70

# Calculate text width
node ${CLAUDE_PLUGIN_ROOT}/skills/sketch-graphics/scripts/calculate-dimensions.js text \
  "My text here" "24px 'Indie Flower'"
```

## Manual Calculation Formula

For box height with icon, title, and multiline text:

```
Box Height = paddingTop + iconHeight + spacer + titleHeight + spacer + (textLines × lineHeight) + paddingBottom
```

**Example calculation:**

- Padding top: 70px
- Icon: 100px
- Spacer: 10px
- Title (24px font): ~29px (font size × 1.2)
- Spacer: 10px
- Text (3 lines × 22px): 66px
- Padding bottom: 70px
- **Total: ~355px**

## Common Layout Patterns

**Pattern 1: Icon + Title + Description**

```json
{
  "type": "rectangle",
  "height": 310,  // 70 (pad) + 100 (icon) + 10 (space) + 24 (title) + 10 (space) + 66 (3×22 text) + 70 (pad) = 350px, rounded to 310 for tighter fit
}
```

**Pattern 2: Title + Description (no icon)**

```json
{
  "type": "rectangle",
  "height": 200,  // 40 (pad) + 29 (title) + 10 (space) + 66 (3×22 text) + 40 (pad) = ~185px
}
```

**Pattern 3: Centered content with equal padding**

```json
{
  "type": "rectangle",
  "height": 240,  // 70 (pad) + 100 (content) + 70 (pad)
}
```

## Vertical Positioning Tips

**Centering icons in boxes:**

```javascript
// For a 100px icon in a 310px box starting at y=120
iconY = boxY + (boxHeight - iconHeight) / 2
iconY = 120 + (310 - 100) / 2 = 225
```

**Positioning text below icons:**

```javascript
// Title 10px below icon bottom
titleY = iconY + iconHeight + 10

// Multiline text below title
textY = titleY + titleHeight + 10
```

## Text Line Height Guidelines

Use these line heights for readability:

- **Small text (12-14px)**: `lineHeight: 18-20`
- **Regular text (16px)**: `lineHeight: 22-24`
- **Large text (18-20px)**: `lineHeight: 26-28`
- **Title text (24px+)**: `lineHeight: fontSize × 1.2`

## Common Pitfalls to Avoid

1. **Forgetting to account for icon height** - Always add icon height + spacer to calculations
2. **Using font size as line height** - Line height is typically 1.2-1.5× font size
3. **Not adding padding below** - Content needs breathing room on all sides
4. **Inconsistent spacing** - Use the same spacer value (10-15px) throughout
5. **Tight calculations** - Add 10-20px buffer for hand-drawn line variations

## Best Practices

1. **Start with equal padding** - Use 70px top/bottom for balanced designs
2. **Calculate before coding** - Use the calculator script to validate dimensions
3. **Test with longest text** - Size boxes for the longest line to avoid overflow
4. **Round up** - Better to have extra space than cut-off text
5. **Maintain consistent spacing** - Use same padding values across similar boxes
