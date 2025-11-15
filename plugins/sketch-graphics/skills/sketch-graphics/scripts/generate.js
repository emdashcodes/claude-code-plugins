#!/usr/bin/env node

/**
 * Generate hand-drawn style graphics using Rough.js
 *
 * Usage: node generate.js <config.json> <output.png>
 *
 * Config format: JSON file specifying canvas size, background, and drawing instructions
 */

import { createCanvas, registerFont, loadImage } from 'canvas';
import rough from 'roughjs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as decorative from './decorative-elements.js';

// Get current directory for font loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register hand-drawn fonts
registerFont(join(__dirname, 'IndieFlower-Regular.ttf'), { family: 'Indie Flower' });
registerFont(join(__dirname, 'PermanentMarker-Regular.ttf'), { family: 'Permanent Marker' });
registerFont(join(__dirname, 'AmaticSC-Regular.ttf'), { family: 'Amatic SC' });
registerFont(join(__dirname, 'AmaticSC-Bold.ttf'), { family: 'Amatic SC', weight: 'bold' });
registerFont(join(__dirname, 'Kalam-Regular.ttf'), { family: 'Kalam' });
registerFont(join(__dirname, 'Kalam-Bold.ttf'), { family: 'Kalam', weight: 'bold' });

/**
 * Helper: Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Helper: Convert RGB to hex
 */
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Helper: Generate a lighter fill color from a stroke color
 * Makes the color much lighter (90% lightness) for better contrast
 */
function generateFillColor(strokeColor) {
  const rgb = hexToRgb(strokeColor);
  if (!rgb) return '#FFFFFF';

  // Blend with white at 85% to create a very light fill
  const r = Math.round(rgb.r + (255 - rgb.r) * 0.85);
  const g = Math.round(rgb.g + (255 - rgb.g) * 0.85);
  const b = Math.round(rgb.b + (255 - rgb.b) * 0.85);

  return rgbToHex(r, g, b);
}

/**
 * Helper: Resolve color reference to actual color value
 * If value is a color name like "primary", "secondary", "accent", or extended color name, resolve it from preset
 * Otherwise return the value as-is
 */
function resolveColor(value, preset, type = 'stroke') {
  if (!preset?.colors || typeof value !== 'string') {
    return value;
  }

  // Check if it's a core palette color name
  const colorNames = ['primary', 'secondary', 'accent'];
  if (colorNames.includes(value)) {
    return preset.colors[value]?.[type] || value;
  }

  // Check if it's an extended color name
  if (preset.colors.extended?.[value]) {
    return preset.colors.extended[value]?.[type] || value;
  }

  return value;
}

/**
 * Helper: Resolve all color properties in options
 */
function resolveOptionsColors(options, preset) {
  if (!options || !preset) {
    return options;
  }

  const resolved = { ...options };

  // Resolve stroke and fill if they're color names
  if (resolved.stroke) {
    resolved.stroke = resolveColor(resolved.stroke, preset, 'stroke');
  }
  if (resolved.fill) {
    resolved.fill = resolveColor(resolved.fill, preset, 'fill');
  }

  return resolved;
}

/**
 * Helper: Apply colorPalette to preset, auto-generating colors and elementColors
 */
function applyColorPalette(preset) {
  if (!preset.colorPalette) {
    return preset;
  }

  const palette = preset.colorPalette;

  // Auto-generate colors section if not present
  if (!preset.colors) {
    preset.colors = {};
  }

  // Generate primary, secondary, accent colors with auto-fills
  if (!preset.colors.primary && palette.primary) {
    preset.colors.primary = {
      stroke: palette.primary,
      fill: generateFillColor(palette.primary)
    };
  }

  if (!preset.colors.secondary && palette.secondary) {
    preset.colors.secondary = {
      stroke: palette.secondary,
      fill: generateFillColor(palette.secondary)
    };
  }

  if (!preset.colors.accent && palette.accent) {
    preset.colors.accent = {
      stroke: palette.accent,
      fill: generateFillColor(palette.accent)
    };
  }

  // Ensure text colors exist (use theme's textColor setting)
  if (!preset.colors.text) {
    preset.colors.text = {
      default: preset.defaults?.textColor || '#000000',
      muted: '#666666'  // Always neutral gray for muted text
    };
  }

  // Auto-generate extended colors with stroke/fill pairs
  if (preset.extendedColors) {
    preset.colors.extended = {};
    for (const [name, color] of Object.entries(preset.extendedColors)) {
      preset.colors.extended[name] = {
        stroke: color,
        fill: generateFillColor(color)
      };
    }
  }

  // Auto-generate elementColors section if not present
  if (!preset.elementColors) {
    preset.elementColors = {
      arrow: palette.primary || '#000000',
      symbol: palette.accent || '#000000',
      bracket: palette.secondary || '#000000',
      divider: palette.primary || '#000000'
    };
  }

  return preset;
}

/**
 * Load and merge a style preset with the user config
 * User config properties override style preset properties
 * Returns both the merged config and the preset for reference
 */
function loadStylePreset(config) {
  if (!config.style) {
    return { config, preset: null };
  }

  const stylePath = join(__dirname, 'styles', `${config.style}.json`);

  if (!fs.existsSync(stylePath)) {
    console.warn(`Warning: Style preset '${config.style}' not found at ${stylePath}`);
    return { config, preset: null };
  }

  let preset = JSON.parse(fs.readFileSync(stylePath, 'utf8'));

  // Apply colorPalette to auto-generate colors and elementColors
  preset = applyColorPalette(preset);

  // Merge background from preset defaults
  const mergedConfig = {
    ...config,
    background: config.background || preset.defaults?.background || '#F5F5F5'
  };

  // Merge options into each command
  mergedConfig.commands = config.commands.map(cmd => {
    // If command already has complete options, use them as-is
    if (cmd.options && Object.keys(cmd.options).length > 0) {
      // Still apply shape defaults for properties not specified
      const presetOptions = preset.shapeDefaults || {};
      const typeDefaults = preset.typeDefaults?.[cmd.type] || {};

      return {
        ...cmd,
        options: {
          ...presetOptions,
          ...typeDefaults,
          ...cmd.options
        }
      };
    }

    // If no options, apply full preset defaults
    const presetOptions = preset.shapeDefaults || {};
    const typeDefaults = preset.typeDefaults?.[cmd.type] || {};

    return {
      ...cmd,
      options: {
        ...presetOptions,
        ...typeDefaults
      }
    };
  });

  return { config: mergedConfig, preset };
}

// Main async function to support image loading
async function generateGraphic() {
  // Parse command line arguments
  const [,, configPath, outputPath] = process.argv;

  if (!configPath || !outputPath) {
    console.error('Usage: node generate.js <config.json> <output.png>');
    process.exit(1);
  }

  // Read config
  let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Load and merge style preset if specified
  const { config: mergedConfig, preset } = loadStylePreset(config);
  config = mergedConfig;

  // Support retina/2x rendering with scale parameter (defaults to 2x for retina displays)
  const scale = config.scale !== undefined ? config.scale : 2;
  const width = config.width;
  const height = config.height;

  // Create canvas at scaled dimensions
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext('2d');

  // Scale the context so all drawing operations are automatically scaled
  ctx.scale(scale, scale);

  const rc = rough.canvas(canvas);

  // Preload callout SVG icons (vector icons that can be dynamically colored)
  const calloutIconSVGs = {};
  const iconPath = join(__dirname, 'icons');
  try {
    // Read potrace-converted SVG files with tight cropping (no background)
    calloutIconSVGs.info = fs.readFileSync(join(iconPath, 'info-tight.svg'), 'utf8');
    calloutIconSVGs.warning = fs.readFileSync(join(iconPath, 'warning-tight.svg'), 'utf8');
    calloutIconSVGs.tip = fs.readFileSync(join(iconPath, 'tip-tight.svg'), 'utf8');
    calloutIconSVGs.quote = fs.readFileSync(join(iconPath, 'quote-tight.svg'), 'utf8');
  } catch (err) {
    console.warn('Warning: Could not load callout SVG icons:', err.message);
  }

  // Fill background
  ctx.fillStyle = config.background || '#F5F5F5';
  ctx.fillRect(0, 0, width, height);

  // Track last rectangle stroke for auto-matching flourishes
  let lastRectangleStroke = null;

  // Process drawing commands (async to support image loading)
  for (const command of config.commands) {
  const options = command.options || {};

  switch (command.type) {
    case 'image':
      // Load and draw an image
      const image = await loadImage(command.path);
      const imgWidth = command.width || image.width;
      const imgHeight = command.height || image.height;
      ctx.drawImage(image, command.x, command.y, imgWidth, imgHeight);
      break;
    case 'rectangle':
      const rectOptions = resolveOptionsColors(options, preset);
      rc.rectangle(command.x, command.y, command.width, command.height, rectOptions);
      // Track stroke color for auto-matching flourishes
      lastRectangleStroke = rectOptions.stroke || null;
      break;

    case 'circle':
      rc.circle(command.x, command.y, command.diameter, options);
      break;

    case 'ellipse':
      rc.ellipse(command.x, command.y, command.width, command.height, options);
      break;

    case 'line':
      rc.line(command.x1, command.y1, command.x2, command.y2, options);
      break;

    case 'polygon':
      rc.polygon(command.points, options);
      break;

    case 'path':
      rc.path(command.d, options);
      break;

    case 'text':
      // Text is rendered with Canvas API (Rough.js doesn't handle text)
      // Use style preset fonts if available
      const defaultFont = preset?.fonts?.body || '16px sans-serif';
      const defaultColor = preset?.colors?.text?.default || '#000000';

      ctx.font = options.font || command.font || defaultFont;
      ctx.fillStyle = resolveColor(options.color || command.color, preset, 'stroke') || defaultColor;
      ctx.textAlign = options.align || command.align || 'left';
      ctx.textBaseline = command.baseline || 'alphabetic';
      ctx.fillText(command.text, command.x, command.y);
      break;

    case 'multiline-text':
      // Multiline text support
      ctx.font = command.font || '16px sans-serif';
      ctx.fillStyle = resolveColor(command.color, preset, 'stroke') || '#000000';
      ctx.textAlign = command.align || 'left';
      ctx.textBaseline = command.baseline || 'alphabetic';
      const lines = command.lines || [command.text];
      const lineHeight = command.lineHeight || 20;
      lines.forEach((line, i) => {
        ctx.fillText(line, command.x, command.y + (i * lineHeight));
      });
      break;

    // Decorative elements
    case 'arrow':
      // Map arrowType to drawArrow options
      const arrowType = options.arrowType || 'straight';
      const arrowOptions = {
        stroke: preset?.elementColors?.arrow,
        curved: arrowType === 'curved',
        doubleHeaded: arrowType === 'double',
        ...options
      };
      decorative.drawArrow(rc, command.x1, command.y1, command.x2, command.y2, arrowOptions);
      break;

    case 'underline':
      // Support both {x1, y, x2} and {x, y, width} formats for better DX
      const x1 = command.x1 !== undefined ? command.x1 : command.x;
      const x2 = command.x2 !== undefined ? command.x2 : (command.x + command.width);
      decorative.drawUnderline(
        rc,
        x1,
        command.y,
        x2,
        command.style || 'straight',
        options
      );
      break;

    case 'corner-flourish':
      // Auto-match parent rectangle stroke by default (unless explicitly disabled)
      const matchStroke = command.matchParentStroke !== false ? lastRectangleStroke : null;
      decorative.drawCornerFlourish(
        rc,
        command.x,
        command.y,
        command.size || 20,
        command.corner || 'tl',
        options,
        matchStroke
      );
      break;

    case 'divider':
      const dividerOptions = {
        stroke: preset?.elementColors?.divider,
        ...options
      };
      decorative.drawDivider(
        rc,
        command.x,
        command.y,
        command.width || 100,
        dividerOptions
      );
      break;

    case 'highlight':
      // Highlights should always be solid (marker-style) regardless of theme
      // Resolve color names first, then apply highlight-specific overrides
      const resolvedHighlightOptions = resolveOptionsColors(options, preset);
      const highlightOptions = {
        ...resolvedHighlightOptions,
        fillStyle: 'solid',
        strokeWidth: 0,
        stroke: 'transparent'
      };
      decorative.drawHighlight(
        rc,
        command.x,
        command.y,
        command.width,
        command.height,
        highlightOptions
      );
      break;

    case 'callout':
      // Add preset font, color, and SVG icon data to options
      const calloutType = options.type || 'info';
      const calloutOptions = {
        font: preset?.fonts?.body || '16px sans-serif',
        textColor: resolveColor(options.textColor, preset, 'stroke') || preset?.colors?.text?.default || '#000000',
        colorConfig: preset?.colors, // Pass color config for themed callouts
        iconSVG: calloutIconSVGs[calloutType], // Pass SVG data for dynamic coloring
        ...options
      };
      await decorative.drawCallout(
        ctx,
        rc,
        command.x,
        command.y,
        command.width,
        command.text,
        calloutOptions
      );
      break;

    case 'curly-brace':
      const braceOptions = {
        stroke: preset?.elementColors?.bracket,
        ...options
      };
      decorative.drawCurlyBrace(
        rc,
        command.x,
        command.y1,
        command.y2,
        command.direction || 'right',
        braceOptions
      );
      break;

    case 'bracket':
      // Extract bracketType from options if present, otherwise use command property
      const bracketType = options.bracketType || command.bracketType || 'square';
      const bracketOptions = {
        stroke: preset?.elementColors?.bracket,
        ...options
      };
      // Remove bracketType from options since it's a positional parameter
      delete bracketOptions.bracketType;

      decorative.drawBracket(
        rc,
        command.x,
        command.y1,
        command.y2,
        bracketType,
        command.direction || 'right',
        bracketOptions
      );
      break;

    case 'bubble':
      decorative.drawBubble(
        rc,
        command.x,
        command.y,
        command.width,
        command.height,
        options
      );
      break;

    case 'bullet-list':
      const bulletListOptions = {
        font: preset?.fonts?.body || '16px sans-serif',
        color: resolveColor(options.color, preset, 'stroke') || preset?.colors?.text?.default || '#000000',
        bulletColor: resolveColor(options.bulletColor, preset, 'stroke') || preset?.elementColors?.symbol || preset?.colors?.text?.default || '#000000',
        ...options
      };
      decorative.drawBulletList(
        ctx,
        rc,
        command.x,
        command.y,
        command.items,
        bulletListOptions
      );
      break;

    case 'numbered-list':
      const numberedListOptions = {
        font: preset?.fonts?.body || '16px sans-serif',
        color: resolveColor(options.color, preset, 'stroke') || preset?.colors?.text?.default || '#000000',
        ...options
      };
      decorative.drawNumberedList(
        ctx,
        command.x,
        command.y,
        command.items,
        numberedListOptions
      );
      break;

    case 'checkbox-list':
      const checkboxListOptions = {
        font: preset?.fonts?.body || '16px sans-serif',
        color: resolveColor(options.color, preset, 'stroke') || preset?.colors?.text?.default || '#000000',
        ...options
      };
      decorative.drawCheckboxList(
        ctx,
        rc,
        command.x,
        command.y,
        command.items,
        checkboxListOptions
      );
      break;


    case 'box':
      // Rectangle with optional text
      // Resolve color names (primary, secondary, accent) to actual colors
      const boxOptions = resolveOptionsColors(options, preset);
      rc.rectangle(command.x, command.y, command.width, command.height, boxOptions);
      lastRectangleStroke = boxOptions.stroke || null;

      if (command.text) {
        const boxFont = preset?.fonts?.body || '16px sans-serif';
        const boxColor = preset?.colors?.text?.default || '#000000';

        ctx.font = options.font || boxFont;
        ctx.fillStyle = resolveColor(options.textColor, preset, 'stroke') || boxColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          command.text,
          command.x + command.width / 2,
          command.y + command.height / 2
        );
      }
      break;

    case 'svg-icon':
      // Load and draw an SVG icon with dynamic color theming
      const svgPath = command.svgPath;
      const iconHeight = command.height || 32;
      const iconColor = resolveColor(command.color, preset, 'stroke') || preset?.colors?.primary?.stroke || '#000000';

      try {
        // Read SVG file
        const svgContent = fs.readFileSync(svgPath, 'utf8');

        // Replace black fill/stroke with desired color
        const coloredSVG = svgContent
          .replace(/fill="#000000"/g, `fill="${iconColor}"`)
          .replace(/stroke="#000000"/g, `stroke="${iconColor}"`);

        // Convert to data URL
        const svgDataURL = `data:image/svg+xml;base64,${Buffer.from(coloredSVG).toString('base64')}`;

        // Load and draw the icon
        const { loadImage } = await import('canvas');
        const iconImage = await loadImage(svgDataURL);

        // Calculate width based on aspect ratio
        const aspectRatio = iconImage.width / iconImage.height;
        const iconWidth = iconHeight * aspectRatio;

        // Draw at specified position
        ctx.drawImage(iconImage, command.x, command.y, iconWidth, iconHeight);
      } catch (err) {
        console.warn(`Could not load SVG icon from ${svgPath}:`, err.message);
      }
      break;

    default:
      console.warn(`Unknown command type: ${command.type}`);
  }
}

  // Save output
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Generated: ${outputPath}`);
}

// Run the async function
generateGraphic().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
