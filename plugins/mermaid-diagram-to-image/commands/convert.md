---
description: Convert Mermaid diagrams to images (PNG, SVG, PDF) using mermaid-cli
---

# Mermaid to Image Converter

Convert Mermaid diagrams to various image formats using the mermaid-cli tool.

## Instructions

Invoke the `mermaid-diagram-to-image` skill to handle the conversion workflow. The skill provides comprehensive instructions for converting Mermaid diagrams to images.

Pass the user's requirements to the skill context:

```
Use the mermaid-diagram-to-image skill to convert the diagram with these requirements:
$ARGUMENTS
```

The skill handles:

- Parsing input (file paths, inline content, or context from discussion)
- Creating temporary files when needed
- Constructing mmdc commands with appropriate flags
- Executing conversion with high-resolution defaults (1600x1200, scale 2)
- Cleaning up temporary files
- Reporting results

## Additional User Context

$ARGUMENTS
