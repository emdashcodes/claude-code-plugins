/**
 * Decorative elements library for hand-drawn graphics
 * Provides helper functions for arrows, symbols, and ornaments
 */

/**
 * Draw an arrow between two points
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {object} options - Rough.js options plus arrow-specific options
 */
export function drawArrow(rc, x1, y1, x2, y2, options = {}) {
  const {
    arrowSize = 10,
    doubleHeaded = false,
    curved = false,
    ...roughOptions
  } = options;

  let endAngle, startAngle;

  if (curved) {
    // Calculate control point for curved arrow
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const offset = Math.sqrt(dx * dx + dy * dy) * 0.2;
    const cx = midX - dy * offset / Math.sqrt(dx * dx + dy * dy);
    const cy = midY + dx * offset / Math.sqrt(dx * dx + dy * dy);

    // Draw curved line using path
    const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    rc.path(path, roughOptions);

    // For curved arrows, calculate angle from control point to endpoints
    endAngle = Math.atan2(y2 - cy, x2 - cx);
    startAngle = Math.atan2(y1 - cy, x1 - cx);
  } else {
    // Draw straight line
    rc.line(x1, y1, x2, y2, roughOptions);

    // Calculate arrow head angle for straight line
    endAngle = Math.atan2(y2 - y1, x2 - x1);
    startAngle = endAngle + Math.PI;
  }

  // Draw arrowhead at end
  drawArrowHead(rc, x2, y2, endAngle, arrowSize, roughOptions);

  // Draw arrowhead at start if double-headed
  if (doubleHeaded) {
    drawArrowHead(rc, x1, y1, startAngle, arrowSize, roughOptions);
  }
}

/**
 * Draw an arrow head
 */
function drawArrowHead(rc, x, y, angle, size, options) {
  const arrowAngle = Math.PI / 6; // 30 degrees
  const x1 = x - size * Math.cos(angle - arrowAngle);
  const y1 = y - size * Math.sin(angle - arrowAngle);
  const x2 = x - size * Math.cos(angle + arrowAngle);
  const y2 = y - size * Math.sin(angle + arrowAngle);

  rc.line(x, y, x1, y1, options);
  rc.line(x, y, x2, y2, options);
}





/**
 * Draw decorative underline
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x1 - Start X
 * @param {number} y - Y position
 * @param {number} x2 - End X
 * @param {string} style - Style: 'straight', 'wavy', 'double'
 * @param {object} options - Rough.js options
 */
export function drawUnderline(rc, x1, y, x2, style = 'straight', options = {}) {
  if (style === 'wavy') {
    const waveLength = 10;
    const waveHeight = 3;
    const waves = Math.floor((x2 - x1) / waveLength);

    let path = `M ${x1} ${y}`;
    for (let i = 0; i < waves; i++) {
      const x = x1 + i * waveLength;
      path += ` Q ${x + waveLength / 2} ${y + waveHeight}, ${x + waveLength} ${y}`;
    }

    rc.path(path, options);
  } else if (style === 'double') {
    rc.line(x1, y, x2, y, options);
    rc.line(x1, y + 3, x2, y + 3, options);
  } else {
    rc.line(x1, y, x2, y, options);
  }
}

/**
 * Draw corner flourish ornaments
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Corner X
 * @param {number} y - Corner Y
 * @param {number} size - Flourish size
 * @param {string} corner - Corner position: 'tl', 'tr', 'bl', 'br'
 * @param {object} options - Rough.js options
 * @param {string} matchStroke - If provided, use this stroke color (for auto-matching box colors)
 */
export function drawCornerFlourish(rc, x, y, size, corner = 'tl', options = {}, matchStroke = null) {
  const directions = {
    tl: { xDir: 1, yDir: 1 },   // top-left
    tr: { xDir: -1, yDir: 1 },  // top-right
    bl: { xDir: 1, yDir: -1 },  // bottom-left
    br: { xDir: -1, yDir: -1 }  // bottom-right
  };

  const { xDir, yDir } = directions[corner];

  // Use matchStroke if provided and stroke not explicitly set
  const flourishOptions = matchStroke && !options.stroke
    ? { ...options, stroke: matchStroke }
    : options;

  // Simple L-shaped flourish
  rc.line(x, y, x + size * xDir, y, flourishOptions);
  rc.line(x, y, x, y + size * yDir, flourishOptions);

  // Add small diagonal accent
  rc.line(
    x + size * 0.3 * xDir,
    y,
    x,
    y + size * 0.3 * yDir,
    flourishOptions
  );
}

/**
 * Draw a decorative divider
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Start X (center)
 * @param {number} y - Y position
 * @param {number} width - Total width
 * @param {object} options - Rough.js options
 */
export function drawDivider(rc, x, y, width, options = {}) {
  const halfWidth = width / 2;

  // Center ornament (diamond)
  rc.polygon([
    [x, y - 5],
    [x + 5, y],
    [x, y + 5],
    [x - 5, y]
  ], options);

  // Lines on either side
  rc.line(x - halfWidth, y, x - 10, y, options);
  rc.line(x + 10, y, x + halfWidth, y, options);
}

/**
 * Draw a highlight effect behind text (like a marker)
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Text start X
 * @param {number} y - Text baseline Y
 * @param {number} width - Highlight width
 * @param {number} height - Highlight height
 * @param {object} options - Rough.js options
 */
export function drawHighlight(rc, x, y, width, height, options = {}) {
  const defaultOptions = {
    fill: '#FFEB3B',
    fillStyle: 'solid',
    roughness: 1.2,
    strokeWidth: 0,
    stroke: 'transparent'
  };

  rc.rectangle(
    x - 2,
    y - height + 3,
    width + 4,
    height,
    { ...defaultOptions, ...options }
  );
}

/**
 * Draw hand-drawn style callout icons using Rough.js with hatch fills
 */
function drawCalloutIcon(rc, x, y, size, type, color) {
  const iconOptions = {
    stroke: color,
    strokeWidth: 2.5,
    roughness: 1.2,
    bowing: 1.5,
    fill: color,
    fillStyle: 'hachure',
    fillWeight: 1.5,
    hachureGap: 4,
    hachureAngle: 60
  };

  switch (type) {
    case 'info':
      // Info icon: circle with 'i' - filled with hatch
      rc.circle(x + size/2, y + size/2, size, iconOptions);
      // Create 'i' by drawing a lighter circle (dot) and line
      const iOptions = { stroke: '#FFFFFF', strokeWidth: 3, fill: '#FFFFFF', fillStyle: 'solid', roughness: 0.5 };
      rc.circle(x + size/2, y + size*0.32, size*0.15, iOptions);
      rc.rectangle(x + size*0.42, y + size*0.48, size*0.16, size*0.35, iOptions);
      break;

    case 'warning':
      // Warning icon: triangle with '!' - filled with hatch
      const trianglePoints = [
        [x + size/2, y + size*0.1],
        [x + size*0.1, y + size*0.9],
        [x + size*0.9, y + size*0.9]
      ];
      const path = `M ${trianglePoints[0][0]} ${trianglePoints[0][1]} L ${trianglePoints[1][0]} ${trianglePoints[1][1]} L ${trianglePoints[2][0]} ${trianglePoints[2][1]} Z`;
      rc.path(path, iconOptions);
      // Create '!' with white
      const exOptions = { stroke: '#FFFFFF', strokeWidth: 3, fill: '#FFFFFF', fillStyle: 'solid', roughness: 0.5 };
      rc.rectangle(x + size*0.45, y + size*0.3, size*0.1, size*0.35, exOptions);
      rc.circle(x + size/2, y + size*0.73, size*0.08, exOptions);
      break;

    case 'tip':
      // Tip icon: lightbulb - filled with hatch
      // Bulb (circle)
      rc.circle(x + size/2, y + size*0.35, size*0.5, iconOptions);
      // Base/socket (small rect at bottom)
      rc.rectangle(x + size*0.38, y + size*0.6, size*0.24, size*0.25, iconOptions);
      // Filament lines in white
      const filamentOptions = { stroke: '#FFFFFF', strokeWidth: 2, roughness: 0.8 };
      rc.line(x + size*0.35, y + size*0.25, x + size*0.45, y + size*0.45, filamentOptions);
      rc.line(x + size*0.55, y + size*0.45, x + size*0.65, y + size*0.25, filamentOptions);
      break;

    case 'quote':
      // Quote icon: large quotation marks - filled with hatch
      // Left quote
      const quote1Path = `M ${x + size*0.15} ${y + size*0.25} L ${x + size*0.3} ${y + size*0.25} L ${x + size*0.3} ${y + size*0.55} L ${x + size*0.2} ${y + size*0.65} Z`;
      rc.path(quote1Path, iconOptions);
      // Right quote
      const quote2Path = `M ${x + size*0.45} ${y + size*0.25} L ${x + size*0.6} ${y + size*0.25} L ${x + size*0.6} ${y + size*0.55} L ${x + size*0.5} ${y + size*0.65} Z`;
      rc.path(quote2Path, iconOptions);
      break;
  }
}

/**
 * Draw a callout/info box with icon and text
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Left X
 * @param {number} y - Top Y
 * @param {number} width - Box width
 * @param {string} text - Callout text
 * @param {object} options - Options including type, font, textColor, and Rough.js options
 */
export async function drawCallout(ctx, rc, x, y, width, text, options = {}) {
  const {
    type = 'info', // 'info', 'warning', 'tip', 'quote'
    font = '16px sans-serif',
    textColor = '#000000',
    padding = 15,
    colorConfig = null, // Optional color configuration from preset
    iconSVG = null, // SVG data for dynamic coloring
    ...roughOptions
  } = options;

  // Default callout type configurations (fallback if no colorConfig provided)
  const defaultTypes = {
    info: {
      borderColor: '#2196F3',
      backgroundColor: '#E3F2FD'
    },
    warning: {
      borderColor: '#FF9800',
      backgroundColor: '#FFF3E0'
    },
    tip: {
      borderColor: '#4CAF50',
      backgroundColor: '#E8F5E9'
    },
    quote: {
      borderColor: '#9E9E9E',
      backgroundColor: '#F5F5F5'
    }
  };

  // Use colorConfig from preset if provided, otherwise use defaults
  let config;
  if (colorConfig) {
    // Prefer extended colors for callouts (more colorful and semantic)
    // Fall back to core palette if extended colors don't exist
    const extended = colorConfig.extended || {};

    const typeColorMap = {
      info: {
        borderColor: extended.info?.stroke || colorConfig.primary?.stroke || '#2196F3',
        backgroundColor: extended.info?.fill || colorConfig.primary?.fill || '#E3F2FD'
      },
      warning: {
        borderColor: extended.warning?.stroke || colorConfig.secondary?.stroke || '#FF9800',
        backgroundColor: extended.warning?.fill || colorConfig.secondary?.fill || '#FFF3E0'
      },
      tip: {
        borderColor: extended.success?.stroke || colorConfig.accent?.stroke || '#4CAF50',
        backgroundColor: extended.success?.fill || colorConfig.accent?.fill || '#E8F5E9'
      },
      quote: {
        borderColor: extended.muted?.stroke || '#9E9E9E',
        backgroundColor: extended.muted?.fill || '#F5F5F5'
      }
    };
    config = typeColorMap[type] || typeColorMap.info;
  } else {
    config = defaultTypes[type] || defaultTypes.info;
  }

  // Measure text for height calculation
  ctx.font = font;
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  const maxWidth = width - padding * 2 - 45; // Account for icon space

  // Wrap text
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 22;
  const textHeight = lines.length * lineHeight;
  const boxHeight = Math.max(60, textHeight + padding * 2);

  // Draw box
  const defaultRoughOptions = {
    fill: config.backgroundColor,
    stroke: config.borderColor,
    strokeWidth: 2,
    fillStyle: 'solid'
  };

  rc.rectangle(x, y, width, boxHeight, { ...defaultRoughOptions, ...roughOptions });

  // Draw SVG icon with dynamic color
  let iconWidth = 0;
  if (iconSVG) {
    const maxIconHeight = 32;
    const iconX = x + 12;
    const iconY = y + padding;

    // Replace black fill and stroke with theme color in SVG
    const coloredSVG = iconSVG
      .replace(/fill="#000000"/g, `fill="${config.borderColor}"`)
      .replace(/stroke="#000000"/g, `stroke="${config.borderColor}"`);

    // Convert SVG to data URL and load as image
    const svgDataURL = `data:image/svg+xml;base64,${Buffer.from(coloredSVG).toString('base64')}`;

    try {
      // Import loadImage dynamically
      const { loadImage } = await import('canvas');
      const iconImage = await loadImage(svgDataURL);

      // Calculate aspect ratio and dimensions to preserve icon proportions
      const aspectRatio = iconImage.width / iconImage.height;
      const iconHeight = maxIconHeight;
      iconWidth = iconHeight * aspectRatio;

      ctx.drawImage(iconImage, iconX, iconY, iconWidth, iconHeight);
    } catch (err) {
      console.warn('Could not load SVG icon:', err.message);
    }
  }

  // Draw text - position based on actual icon width
  ctx.font = font;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Calculate text X position: left padding (12) + icon width + spacing (8)
  const textX = x + 12 + iconWidth + 8;

  lines.forEach((line, i) => {
    ctx.fillText(line, textX, y + padding + (i * lineHeight));
  });

  // Add corner flourishes automatically
  const flourishSize = 15;
  const flourishOptions = {
    stroke: config.borderColor,
    strokeWidth: 2
  };

  drawCornerFlourish(rc, x, y, flourishSize, 'tl', flourishOptions);
  drawCornerFlourish(rc, x + width, y, flourishSize, 'tr', flourishOptions);
  drawCornerFlourish(rc, x, y + boxHeight, flourishSize, 'bl', flourishOptions);
  drawCornerFlourish(rc, x + width, y + boxHeight, flourishSize, 'br', flourishOptions);

  return boxHeight; // Return height for spacing calculations
}

/**
 * Draw a curly brace
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Center X
 * @param {number} y1 - Start Y
 * @param {number} y2 - End Y
 * @param {string} direction - 'left' or 'right'
 * @param {object} options - Rough.js options
 */
export function drawCurlyBrace(rc, x, y1, y2, direction = 'right', options = {}) {
  const height = y2 - y1;
  const curveSize = Math.min(15, height / 6);
  const midY = (y1 + y2) / 2;
  const dir = direction === 'right' ? 1 : -1;

  const path = `
    M ${x} ${y1}
    Q ${x + dir * curveSize} ${y1} ${x + dir * curveSize} ${y1 + curveSize}
    L ${x + dir * curveSize} ${midY - curveSize}
    Q ${x + dir * curveSize} ${midY} ${x + dir * curveSize * 2} ${midY}
    Q ${x + dir * curveSize} ${midY} ${x + dir * curveSize} ${midY + curveSize}
    L ${x + dir * curveSize} ${y2 - curveSize}
    Q ${x + dir * curveSize} ${y2} ${x} ${y2}
  `;

  rc.path(path, options);
}

/**
 * Draw a bracket
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Left/Right X
 * @param {number} y1 - Start Y
 * @param {number} y2 - End Y
 * @param {string} type - 'square', 'round', 'angle'
 * @param {string} direction - 'left' or 'right'
 * @param {object} options - Rough.js options
 */
export function drawBracket(rc, x, y1, y2, type = 'square', direction = 'right', options = {}) {
  const size = 10;
  const dir = direction === 'right' ? 1 : -1;

  if (type === 'square') {
    rc.line(x, y1, x + dir * size, y1, options);
    rc.line(x, y1, x, y2, options);
    rc.line(x, y2, x + dir * size, y2, options);
  } else if (type === 'round') {
    const midY = (y1 + y2) / 2;
    const radius = (y2 - y1) / 2;
    const path = `
      M ${x} ${y1}
      Q ${x + dir * radius * 0.5} ${y1} ${x + dir * radius * 0.5} ${midY}
      Q ${x + dir * radius * 0.5} ${y2} ${x} ${y2}
    `;
    rc.path(path, options);
  } else if (type === 'angle') {
    const midY = (y1 + y2) / 2;
    rc.line(x, y1, x + dir * size, midY, options);
    rc.line(x + dir * size, midY, x, y2, options);
  }
}

/**
 * Draw a thought/speech bubble
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Left X
 * @param {number} y - Top Y
 * @param {number} width - Bubble width
 * @param {number} height - Bubble height
 * @param {object} options - Options including type and Rough.js options
 */
export function drawBubble(rc, x, y, width, height, options = {}) {
  const {
    type = 'speech', // 'speech' or 'thought'
    tailX = x + 20,
    tailY = y + height + 15,
    ...roughOptions
  } = options;

  // Draw main bubble (rounded rectangle)
  const radius = 10;
  const path = `
    M ${x + radius} ${y}
    L ${x + width - radius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + radius}
    L ${x + width} ${y + height - radius}
    Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
    L ${x + radius} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - radius}
    L ${x} ${y + radius}
    Q ${x} ${y} ${x + radius} ${y}
    Z
  `;

  rc.path(path, roughOptions);

  // Draw tail
  if (type === 'speech') {
    // Use curved tail for more hand-drawn look
    const tailPath = `
      M ${x + 30} ${y + height}
      Q ${x + 25} ${y + height + 5} ${tailX} ${tailY}
      Q ${x + 45} ${y + height + 5} ${x + 50} ${y + height}
    `;
    rc.path(tailPath, roughOptions);
  } else if (type === 'thought') {
    // Small circles for thought bubble
    rc.circle(x + 30, y + height + 8, 8, roughOptions);
    rc.circle(x + 20, y + height + 18, 5, roughOptions);
  }
}

/**
 * Draw a bulleted list
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Left X
 * @param {number} y - Top Y
 * @param {string[]} items - List items
 * @param {object} options - Options including font, color, lineHeight, bulletStyle
 */
export function drawBulletList(ctx, rc, x, y, items, options = {}) {
  const {
    font = '16px sans-serif',
    color = '#000000',
    lineHeight = 25,
    bulletStyle = 'dot', // 'dot', 'dash', 'arrow', 'star'
    bulletColor = '#000000',
    ...roughOptions
  } = options;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  items.forEach((item, i) => {
    const itemY = y + (i * lineHeight);

    // Draw bullet
    if (bulletStyle === 'dot') {
      // Simple filled dot using canvas (not rough)
      ctx.fillStyle = bulletColor;
      ctx.beginPath();
      ctx.arc(x + 5, itemY + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      // Reset fill style back to text color
      ctx.fillStyle = color;
    } else if (bulletStyle === 'dash') {
      rc.line(x, itemY + 8, x + 10, itemY + 8, { stroke: bulletColor, ...roughOptions });
    } else if (bulletStyle === 'arrow') {
      rc.line(x, itemY + 8, x + 10, itemY + 8, { stroke: bulletColor, ...roughOptions });
      rc.line(x + 10, itemY + 8, x + 7, itemY + 5, { stroke: bulletColor, ...roughOptions });
      rc.line(x + 10, itemY + 8, x + 7, itemY + 11, { stroke: bulletColor, ...roughOptions });
    } else if (bulletStyle === 'star') {
      drawStar(rc, x + 6, itemY + 8, 4, { stroke: bulletColor, fill: bulletColor, ...roughOptions });
    }

    // Draw text
    ctx.fillText(item, x + 20, itemY);
  });

  return items.length * lineHeight; // Return total height
}

/**
 * Draw a numbered list
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Left X
 * @param {number} y - Top Y
 * @param {string[]} items - List items
 * @param {object} options - Options including font, color, lineHeight, startNumber
 */
export function drawNumberedList(ctx, x, y, items, options = {}) {
  const {
    font = '16px sans-serif',
    color = '#000000',
    lineHeight = 25,
    startNumber = 1
  } = options;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  items.forEach((item, i) => {
    const itemY = y + (i * lineHeight);
    const number = startNumber + i;

    // Draw number
    ctx.fillText(`${number}.`, x, itemY);

    // Draw text
    ctx.fillText(item, x + 25, itemY);
  });

  return items.length * lineHeight; // Return total height
}

/**
 * Draw a checkmark symbol
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Left X
 * @param {number} y - Top Y (center)
 * @param {number} size - Size of checkmark
 * @param {object} options - Rough.js options
 */
function drawCheckmark(rc, x, y, size, options = {}) {
  // Draw checkmark as two lines forming a check shape
  const opts = {
    strokeWidth: 2,
    roughness: 1,
    ...options
  };

  // Short vertical line (left part of check)
  rc.line(x, y, x + size * 0.4, y + size * 0.5, opts);

  // Longer diagonal line (right part of check)
  rc.line(x + size * 0.4, y + size * 0.5, x + size, y - size * 0.3, opts);
}

/**
 * Draw a checkbox list
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {RoughCanvas} rc - Rough canvas instance
 * @param {number} x - Left X
 * @param {number} y - Top Y
 * @param {Array} items - List items with {text, checked} properties
 * @param {object} options - Options including font, color, lineHeight
 */
export function drawCheckboxList(ctx, rc, x, y, items, options = {}) {
  const {
    font = '16px sans-serif',
    color = '#000000',
    lineHeight = 25,
    ...roughOptions
  } = options;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  items.forEach((item, i) => {
    const itemY = y + (i * lineHeight);

    // Draw checkbox
    rc.rectangle(x, itemY + 2, 16, 16, { stroke: '#000000', ...roughOptions });

    // Draw checkmark if checked
    if (item.checked) {
      drawCheckmark(rc, x + 3, itemY + 10, 10, { stroke: '#4CAF50', strokeWidth: 2 });
    }

    // Draw text
    ctx.fillText(item.text, x + 25, itemY);
  });

  return items.length * lineHeight; // Return total height
}
