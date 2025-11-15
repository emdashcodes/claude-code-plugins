#!/usr/bin/env node

/**
 * Utility to calculate appropriate box dimensions for Rough.js graphics
 * Based on content (text, icons, padding requirements)
 *
 * Usage:
 *   node calculate-dimensions.js --help
 *   node calculate-dimensions.js text "My text" "18px Arial"
 *   node calculate-dimensions.js box --lines 3 --line-height 22 --padding 70 --icon-height 100
 */

import { createCanvas, registerFont } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register custom fonts
try {
  registerFont(__dirname + '/IndieFlower-Regular.ttf', { family: 'Indie Flower' });
} catch (e) {
  console.warn('Could not load Indie Flower font');
}

/**
 * Calculate text dimensions
 */
function calculateTextDimensions(text, font = '16px Arial') {
  const canvas = createCanvas(1000, 1000);
  const ctx = canvas.getContext('2d');
  ctx.font = font;

  const metrics = ctx.measureText(text);
  const width = metrics.width;

  // Estimate height based on font size
  const fontSizeMatch = font.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 16;
  const height = fontSize * 1.2; // Approximate line height

  return { width, height, fontSize };
}

/**
 * Calculate box height for multiline text with optional icon
 */
function calculateBoxHeight(options = {}) {
  const {
    lines = 1,              // Number of text lines
    lineHeight = 22,        // Line height in pixels
    fontSize = 16,          // Font size in pixels
    titleHeight = 0,        // Height of title (0 if no title)
    iconHeight = 0,         // Height of icon (0 if no icon)
    paddingTop = 70,        // Padding above content
    paddingBottom = 70,     // Padding below content
    spaceBetweenElements = 10, // Space between icon, title, and text
  } = options;

  let totalHeight = paddingTop + paddingBottom;

  // Add icon height if present
  if (iconHeight > 0) {
    totalHeight += iconHeight + spaceBetweenElements;
  }

  // Add title height if present
  if (titleHeight > 0) {
    totalHeight += titleHeight + spaceBetweenElements;
  }

  // Add multiline text height
  totalHeight += (lines * lineHeight);

  return Math.ceil(totalHeight);
}

/**
 * Calculate centered Y position for an element
 */
function calculateCenteredY(boxY, boxHeight, elementHeight) {
  return boxY + (boxHeight - elementHeight) / 2;
}

/**
 * Suggest box dimensions for common layouts
 */
function suggestBoxLayout(layoutType, options = {}) {
  const layouts = {
    'icon-title-text': {
      description: 'Icon at top, title, then description text',
      calculate: (opts) => {
        const iconHeight = opts.iconHeight || 100;
        const titleFontSize = opts.titleFontSize || 24;
        const textLines = opts.textLines || 3;
        const textLineHeight = opts.textLineHeight || 22;
        const padding = opts.padding || 70;

        return calculateBoxHeight({
          iconHeight,
          titleHeight: titleFontSize * 1.2,
          lines: textLines,
          lineHeight: textLineHeight,
          paddingTop: padding,
          paddingBottom: padding,
          spaceBetweenElements: 10,
        });
      }
    },
    'title-text': {
      description: 'Title with description text below',
      calculate: (opts) => {
        const titleFontSize = opts.titleFontSize || 24;
        const textLines = opts.textLines || 3;
        const textLineHeight = opts.textLineHeight || 22;
        const padding = opts.padding || 40;

        return calculateBoxHeight({
          titleHeight: titleFontSize * 1.2,
          lines: textLines,
          lineHeight: textLineHeight,
          paddingTop: padding,
          paddingBottom: padding,
          spaceBetweenElements: 10,
        });
      }
    },
    'centered-content': {
      description: 'Content with equal padding on all sides',
      calculate: (opts) => {
        const contentHeight = opts.contentHeight || 100;
        const padding = opts.padding || 70;

        return contentHeight + (padding * 2);
      }
    }
  };

  const layout = layouts[layoutType];
  if (!layout) {
    console.error(`Unknown layout type: ${layoutType}`);
    console.log('Available layouts:', Object.keys(layouts).join(', '));
    process.exit(1);
  }

  return {
    ...layout,
    height: layout.calculate(options)
  };
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Rough.js Dimension Calculator

Usage:
  node calculate-dimensions.js text <text> <font>
    Calculate dimensions for a text string

  node calculate-dimensions.js box [options]
    Calculate box height for content
    Options:
      --lines <n>           Number of text lines (default: 1)
      --line-height <px>    Line height in pixels (default: 22)
      --icon-height <px>    Icon height in pixels (default: 0)
      --title-height <px>   Title height in pixels (default: 0)
      --padding <px>        Padding top/bottom (default: 70)
      --padding-top <px>    Custom top padding
      --padding-bottom <px> Custom bottom padding

  node calculate-dimensions.js layout <type> [options]
    Get suggested dimensions for common layouts
    Types:
      icon-title-text - Icon at top, title, description
      title-text      - Title with description
      centered-content - Content with equal padding
    Options:
      --icon-height <px>    Icon height (default: 100)
      --title-font-size <px> Title font size (default: 24)
      --text-lines <n>      Number of text lines (default: 3)
      --text-line-height <px> Text line height (default: 22)
      --padding <px>        Padding (default: 70)

Examples:
  # Calculate text width
  node calculate-dimensions.js text "Hello World" "24px 'Indie Flower'"

  # Calculate box for 3 lines of text with 100px icon
  node calculate-dimensions.js box --lines 3 --icon-height 100 --padding 70

  # Get layout suggestion
  node calculate-dimensions.js layout icon-title-text --text-lines 3
    `);
    process.exit(0);
  }

  const command = args[0];

  if (command === 'text') {
    const text = args[1] || 'Sample Text';
    const font = args[2] || '16px Arial';
    const dims = calculateTextDimensions(text, font);
    console.log(JSON.stringify(dims, null, 2));
  }
  else if (command === 'box') {
    const options = {};
    for (let i = 1; i < args.length; i += 2) {
      const key = args[i].replace('--', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const value = parseInt(args[i + 1]);
      options[key] = value;
    }
    const height = calculateBoxHeight(options);
    console.log(`Box height: ${height}px`);
    console.log(`Configuration:`, JSON.stringify(options, null, 2));
  }
  else if (command === 'layout') {
    const layoutType = args[1];
    const options = {};
    for (let i = 2; i < args.length; i += 2) {
      const key = args[i].replace('--', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const value = parseInt(args[i + 1]);
      options[key] = value;
    }
    const result = suggestBoxLayout(layoutType, options);
    console.log(`Layout: ${layoutType}`);
    console.log(`Description: ${result.description}`);
    console.log(`Suggested height: ${result.height}px`);
  }
  else {
    console.error(`Unknown command: ${command}`);
    console.log('Run with --help for usage information');
    process.exit(1);
  }
}

export {
  calculateTextDimensions,
  calculateBoxHeight,
  calculateCenteredY,
  suggestBoxLayout,
};
