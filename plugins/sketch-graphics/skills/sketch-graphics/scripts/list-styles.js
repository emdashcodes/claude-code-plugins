#!/usr/bin/env node

/**
 * List available style presets and their properties
 *
 * Usage: node list-styles.js [style-name]
 *
 * Without arguments: Lists all available styles
 * With style name: Shows detailed info for that style
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const stylesDir = join(__dirname, 'styles');

function listAllStyles() {
  console.log('\n🎨 Available Style Presets\n');

  const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No style presets found.');
    return;
  }

  files.forEach(file => {
    const stylePath = join(stylesDir, file);
    const style = JSON.parse(fs.readFileSync(stylePath, 'utf8'));
    const name = file.replace('.json', '');

    console.log(`  ${name}`);
    console.log(`    ${style.description}`);
    console.log('');
  });

  console.log(`\nUsage: node list-styles.js <style-name> for details\n`);
}

function showStyleDetails(styleName) {
  const stylePath = join(stylesDir, `${styleName}.json`);

  if (!fs.existsSync(stylePath)) {
    console.error(`❌ Style '${styleName}' not found.`);
    console.log('\nAvailable styles:');
    const files = fs.readdirSync(stylesDir).filter(f => f.endsWith('.json'));
    files.forEach(f => console.log(`  - ${f.replace('.json', '')}`));
    return;
  }

  const style = JSON.parse(fs.readFileSync(stylePath, 'utf8'));

  console.log(`\n🎨 Style: ${style.name}`);
  console.log(`📝 ${style.description}\n`);

  // Background
  if (style.defaults?.background) {
    console.log(`🖼️  Background: ${style.defaults.background}`);
  }

  // Colors
  if (style.colors) {
    console.log('\n🎨 Color Palette:');
    Object.entries(style.colors).forEach(([key, value]) => {
      if (typeof value === 'object' && 'stroke' in value) {
        console.log(`  ${key}:`);
        console.log(`    stroke: ${value.stroke}`);
        console.log(`    fill:   ${value.fill}`);
      } else if (typeof value === 'object') {
        console.log(`  ${key}:`);
        Object.entries(value).forEach(([subkey, subvalue]) => {
          console.log(`    ${subkey}: ${subvalue}`);
        });
      }
    });
  }

  // Fonts
  if (style.fonts) {
    console.log('\n✍️  Fonts:');
    Object.entries(style.fonts).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  // Shape defaults
  if (style.shapeDefaults) {
    console.log('\n📐 Shape Defaults:');
    Object.entries(style.shapeDefaults).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  // Type defaults
  if (style.typeDefaults) {
    console.log('\n🔧 Type-Specific Defaults:');
    Object.entries(style.typeDefaults).forEach(([type, options]) => {
      console.log(`  ${type}:`);
      Object.entries(options).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    });
  }

  console.log('\n💡 Usage in config:');
  console.log(`  { "style": "${styleName}", ... }\n`);
}

// Main
const [,, styleName] = process.argv;

if (styleName) {
  showStyleDetails(styleName);
} else {
  listAllStyles();
}
