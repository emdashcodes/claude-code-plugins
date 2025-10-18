---
name: mermaid-diagram-to-image
description: Convert Mermaid diagrams to images (PNG, SVG, PDF) using mermaid-cli. This skill should be used when Claude generates Mermaid diagram syntax and wants to create a visual representation for the user, or when converting existing Mermaid diagrams to image formats.
---

# Mermaid Diagram to Image

Convert Mermaid diagrams to high-quality images in PNG, SVG, or PDF formats using the mermaid-cli tool.

## When to Use This Skill

Activate this skill when:

- Generating Mermaid diagram syntax and wanting to provide a visual representation to the user
- Converting existing Mermaid diagrams (from files or discussion context) to image formats
- User requests diagram visualization in a specific format (PNG for embedding, SVG for web, PDF for print)

## Quick Start

To convert a Mermaid diagram to an image:

1. **Identify the source** - Determine if working with diagram content, a file path, or inline Mermaid syntax
2. **Create temporary file if needed** - Use `mktemp -t mermaid-XXXXXX.mmd` for inline content
3. **Run conversion** - Execute mmdc with appropriate flags (input, output, dimensions, theme)
4. **Clean up** - Use `rm -f /path/to/temp.mmd` to remove temporary file
5. **Report results** - Confirm successful conversion with output filename

## Conversion Workflow

### Step 1: Parse Input

Determine the source of the Mermaid diagram:

- **Diagram content in context** - Mermaid syntax recently generated or discussed
- **File path** - User provides a path to a `.mmd` or `.md` file
- **Inline Mermaid content** - Raw Mermaid syntax provided by user
- **Format preferences** - User specifies output format (PNG, SVG, PDF) and options

### Step 2: Set Up Variables

Establish conversion parameters with sensible defaults:

**Output Format**

- Default: `png`
- Options: `png`, `svg`, `pdf`

**Output Filename**

- Default pattern: `mermaid-diagram-{SHORT_DESCRIPTIVE_NAME}`
- Example: `mermaid-diagram-flowchart.png`, `mermaid-diagram-sequence.svg`
- Base name on diagram type or content context

**Default Image Settings (High Resolution)**

- Width: `1600` pixels
- Height: `1200` pixels
- Scale: `2` (for crisp rendering)

**Optional Parameters**

- Theme: `default`, `forest`, `dark`, `neutral`
- Background color: hex code or named color (e.g., `transparent`, `white`, `#f0f0f0`)
- PDF fit: `-f` flag for PDF output

### Step 3: Handle Input

**If file path provided:**

- Verify file exists using Read or Glob tools
- Confirm file extension is `.mmd` or `.md`
- Use file path directly in mmdc command

**If Mermaid content provided:**

- Create temporary file: `TEMP_FILE=$(mktemp -t mermaid-XXXXXX.mmd)`
- Write diagram content to file using heredoc or echo
- Store temp file path for cleanup after conversion

Example:

```bash
TEMP_FILE=$(mktemp -t mermaid-XXXXXX.mmd)
cat > "$TEMP_FILE" << 'EOF'
graph TD
    A[Start] --> B[Process]
    B --> C[End]
EOF
```

### Step 4: Construct mmdc Command

Build the mermaid-cli command with appropriate flags:

**Required Flags**

- `-i <input-file>` - Input file (temp file or user-provided file)
- `-o <output-file>` - Output file with appropriate extension

**High Resolution Flags**

- `-w 1600` - Width in pixels (default for quality output)
- `-H 1200` - Height in pixels (default for quality output)
- `-s 2` - Scale factor (2x for high resolution)

**Optional Flags**

- `-t <theme>` - Theme selection (`default`, `forest`, `dark`, `neutral`)
- `-b <color>` - Background color (hex or named)
- `-f` - Fit to page (PDF output only)

**Example Commands**

PNG conversion (default):

```bash
mmdc -i diagram.mmd -o output.png -w 1600 -H 1200 -s 2
```

SVG with dark theme:

```bash
mmdc -i diagram.mmd -o output.svg -t dark -b transparent
```

PDF with fit:

```bash
mmdc -i diagram.mmd -o output.pdf -f -w 1600 -H 1200
```

### Step 5: Execute and Clean Up

**Execution**

1. Run the constructed mmdc command using Bash tool
2. Capture output and error messages
3. Check exit code for success

**Cleanup** (if temporary file created)

1. Remove temporary file: `rm -f "$TEMP_FILE"`
2. Verify file is in temp directory (e.g., `/tmp/` or `/var/folders/`) before deletion
3. Use `-f` flag to avoid errors if file doesn't exist

**Verification**

1. Confirm output file was created
2. Report success with output filename and location
3. If applicable, note image specifications (format, dimensions)

### Step 6: Report Results

Provide clear feedback to user:

**Success Message Template**

```
Successfully converted Mermaid diagram to {format}.
Output: {filename}
Dimensions: {width}x{height}
Theme: {theme}
```

**Error Handling**

- If mmdc fails, report error message from stderr
- Common issues: invalid Mermaid syntax, missing dependencies, file permissions
- Suggest fixes: validate syntax, check mmdc installation, verify write permissions

## Default Settings

Apply these defaults for high-quality output:

- **Format:** PNG
- **Width:** 1600 pixels
- **Height:** 1200 pixels
- **Scale:** 2 (for crisp rendering)
- **Theme:** default
- **Filename pattern:** `mermaid-diagram-{descriptive-name}`

Override defaults based on user requirements or diagram characteristics.

## Common Scenarios

**Scenario 1: Generate and visualize**

1. Generate Mermaid diagram syntax based on user request
2. Create temporary file using `mktemp -t mermaid-XXXXXX.mmd`
3. Write diagram content to temporary file
4. Convert to PNG with default high-resolution settings
5. Present image to user
6. Clean up temporary file with `rm -f`

**Scenario 2: Convert existing file**

1. User provides file path to `.mmd` or `.md` file
2. Verify file exists and read content
3. Convert directly using file path
4. Output image file in same directory or user-specified location

**Scenario 3: Custom format and styling**

1. User requests SVG with dark theme and transparent background
2. Parse requirements
3. Construct mmdc command with theme and background flags
4. Execute conversion
5. Confirm output meets specifications

## Theme Options

Available themes for customization:

- `default` - Standard blue/gray Mermaid theme
- `forest` - Green-themed palette
- `dark` - Dark background with light text
- `neutral` - Neutral gray tones

Apply theme with `-t` flag: `mmdc -i input.mmd -o output.png -t dark`

## Mermaid Syntax Recognition

Recognize Mermaid diagrams by these starting keywords:

- `graph` or `flowchart` - Flowchart diagrams
- `sequenceDiagram` - Sequence diagrams
- `classDiagram` - Class diagrams
- `stateDiagram` - State diagrams
- `erDiagram` - Entity relationship diagrams
- `gantt` - Gantt charts
- `pie` - Pie charts
- `journey` - User journey diagrams
- `gitGraph` - Git graphs
- `mindmap` - Mind maps
- `timeline` - Timeline diagrams

## Troubleshooting

**mmdc command not found:**

- Verify mermaid-cli is installed: `npm list -g @mermaid-js/mermaid-cli`
- Install if missing: `npm install -g @mermaid-js/mermaid-cli`

**Syntax errors in diagram:**

- Validate Mermaid syntax at <https://mermaid.live>
- Check for missing spaces, invalid keywords, or malformed connections
- Review Mermaid documentation for diagram-specific syntax

**Output file not created:**

- Verify write permissions in output directory
- Check disk space availability
- Ensure output path is valid

**Image quality issues:**

- Increase width/height for larger diagrams
- Adjust scale factor (try 3 for extra high resolution)
- Use SVG format for lossless scaling

## Best Practices

1. **Proactive conversion** - When generating Mermaid diagrams, automatically convert to images for better user experience
2. **Format selection** - Choose PNG for general use, SVG for web/scaling needs, PDF for documents
3. **High resolution** - Use default high-resolution settings (1600x1200, scale 2) for quality output
4. **Descriptive naming** - Name output files based on diagram type or content for easy identification
5. **Cleanup** - Always clean up temporary files after successful conversion
6. **Error reporting** - Provide clear error messages with actionable troubleshooting steps
