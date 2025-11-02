#!/usr/bin/env python3
"""
Skill Validator - Comprehensive validation for Agent Skills

Based on skill-creator by Anthropic PBC
Copyright 2024 Anthropic PBC
Copyright 2025 Em Shreve (Claude Code enhancements - allowed-tools validation)
Licensed under the Apache License, Version 2.0

Usage:
    validate_skill.py <skill-directory>

Examples:
    validate_skill.py ./my-skill
    validate_skill.py /path/to/skills/my-skill
"""

import sys
import re
from pathlib import Path
from typing import Tuple, List

# Common Claude Code tools
KNOWN_TOOLS = {
    # File operations
    'Read', 'Write', 'Edit', 'Glob', 'Grep',
    # Execution
    'Bash', 'Task',
    # Web
    'WebFetch', 'WebSearch',
    # Claude Code
    'SlashCommand', 'AskUserQuestion',
    'TodoWrite', 'TodoRead',
    'NotebookEdit',
    # Other
    'BashOutput', 'KillBash'
}

def validate_frontmatter(content: str) -> Tuple[bool, List[str], dict]:
    """
    Validate YAML frontmatter in SKILL.md

    Returns:
        (is_valid, errors, frontmatter_dict)
    """
    errors = []
    frontmatter_dict = {}

    if not content.startswith('---'):
        errors.append("SKILL.md must start with YAML frontmatter (---)")
        return False, errors, {}

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        errors.append("Invalid frontmatter format. Must be enclosed in --- markers")
        return False, errors, {}

    frontmatter = match.group(1)

    # Check required fields
    if 'name:' not in frontmatter:
        errors.append("Missing required field: 'name'")

    if 'description:' not in frontmatter:
        errors.append("Missing required field: 'description'")

    # Extract and validate name
    name_match = re.search(r'name:\s*(.+)', frontmatter)
    if name_match:
        name = name_match.group(1).strip()
        frontmatter_dict['name'] = name

        # Validate naming convention
        if not re.match(r'^[a-z0-9-]+$', name):
            errors.append(f"Name '{name}' must use lowercase letters, digits, and hyphens only")

        if name.startswith('-') or name.endswith('-'):
            errors.append(f"Name '{name}' cannot start or end with a hyphen")

        if '--' in name:
            errors.append(f"Name '{name}' cannot contain consecutive hyphens")

        if len(name) > 64:
            errors.append(f"Name '{name}' exceeds maximum length of 64 characters")

        # Check for reserved keywords
        if name.lower() in ['skill', 'agent', 'command', 'hook']:
            errors.append(f"Name '{name}' is a reserved keyword")

    # Extract and validate description
    desc_match = re.search(r'description:\s*(.+?)(?=\n[a-z-]+:|$)', frontmatter, re.DOTALL)
    if desc_match:
        description = desc_match.group(1).strip()
        frontmatter_dict['description'] = description

        # Check for angle brackets (XML/HTML tags)
        if '<' in description or '>' in description:
            errors.append("Description cannot contain angle brackets (< or >)")

        # Check length
        if len(description) > 1024:
            errors.append(f"Description exceeds maximum length of 1024 characters ({len(description)} chars)")

        # Check if description is just a TODO
        if description.startswith('[TODO') or description == '':
            errors.append("Description must be completed (contains TODO or is empty)")

    # Extract and validate allowed-tools (Claude Code specific)
    allowed_tools_match = re.search(r'allowed-tools:\s*(.+?)(?=\n[a-z-]+:|$)', frontmatter, re.DOTALL)
    if allowed_tools_match:
        allowed_tools = allowed_tools_match.group(1).strip()
        frontmatter_dict['allowed-tools'] = allowed_tools

        # Parse tool list
        tools = [t.strip() for t in allowed_tools.split(',')]

        for tool in tools:
            # Check for Bash patterns like Bash(git:*)
            bash_pattern_match = re.match(r'Bash\((.+)\)', tool)
            if bash_pattern_match:
                pattern = bash_pattern_match.group(1)
                # Valid pattern should be like "git:*" or "npm:*"
                if not re.match(r'^[a-z0-9-]+:\*$', pattern):
                    errors.append(f"Invalid Bash pattern '{pattern}'. Should be like 'command:*'")
                continue

            # Check for MCP tools like mcp__server__tool
            if tool.startswith('mcp__'):
                # Valid MCP tool format
                if not re.match(r'^mcp__[a-z0-9-]+__[a-z0-9-_]+$', tool):
                    errors.append(f"Invalid MCP tool format '{tool}'. Should be 'mcp__server__tool'")
                continue

            # Check if it's a known tool
            if tool not in KNOWN_TOOLS:
                # Warning, not error (might be a valid tool we don't know about)
                print(f"⚠️  Warning: Unknown tool '{tool}' in allowed-tools. Verify this is a valid Claude Code tool.")

    return len(errors) == 0, errors, frontmatter_dict


def validate_structure(skill_path: Path) -> Tuple[bool, List[str]]:
    """
    Validate skill directory structure

    Returns:
        (is_valid, errors)
    """
    errors = []

    # Check if directory exists
    if not skill_path.exists():
        errors.append(f"Skill directory does not exist: {skill_path}")
        return False, errors

    if not skill_path.is_dir():
        errors.append(f"Path is not a directory: {skill_path}")
        return False, errors

    # Check for SKILL.md
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        errors.append("SKILL.md not found")
        return False, errors

    # Check resource directories if they exist
    scripts_dir = skill_path / 'scripts'
    if scripts_dir.exists() and not scripts_dir.is_dir():
        errors.append("scripts/ exists but is not a directory")

    references_dir = skill_path / 'references'
    if references_dir.exists() and not references_dir.is_dir():
        errors.append("references/ exists but is not a directory")

    assets_dir = skill_path / 'assets'
    if assets_dir.exists() and not assets_dir.is_dir():
        errors.append("assets/ exists but is not a directory")

    return len(errors) == 0, errors


def validate_references(skill_path: Path, content: str) -> Tuple[bool, List[str]]:
    """
    Validate that referenced files exist

    Returns:
        (is_valid, warnings)
    """
    warnings = []

    # Find markdown links like [text](file.md)
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)

    for link_text, link_path in links:
        # Skip external URLs
        if link_path.startswith('http://') or link_path.startswith('https://'):
            continue

        # Skip anchors
        if link_path.startswith('#'):
            continue

        # Check if referenced file exists
        full_path = skill_path / link_path
        if not full_path.exists():
            warnings.append(f"Referenced file not found: {link_path}")

    # This returns warnings, not errors, so always valid
    return True, warnings


def validate_skill(skill_path: str) -> Tuple[bool, dict]:
    """
    Comprehensive validation of a skill

    Returns:
        (is_valid, validation_results)
    """
    skill_path = Path(skill_path).resolve()

    results = {
        'path': str(skill_path),
        'errors': [],
        'warnings': []
    }

    # Validate directory structure
    structure_valid, structure_errors = validate_structure(skill_path)
    results['errors'].extend(structure_errors)

    if not structure_valid:
        return False, results

    # Read SKILL.md
    skill_md = skill_path / 'SKILL.md'
    try:
        content = skill_md.read_text(encoding='utf-8')
    except Exception as e:
        results['errors'].append(f"Error reading SKILL.md: {e}")
        return False, results

    # Validate frontmatter
    frontmatter_valid, frontmatter_errors, frontmatter_dict = validate_frontmatter(content)
    results['errors'].extend(frontmatter_errors)
    results['frontmatter'] = frontmatter_dict

    # Validate references (warnings only)
    _, ref_warnings = validate_references(skill_path, content)
    results['warnings'].extend(ref_warnings)

    is_valid = len(results['errors']) == 0

    return is_valid, results


def print_results(is_valid: bool, results: dict):
    """
    Print validation results in a user-friendly format
    """
    print(f"\n{'='*60}")
    print(f"Skill Validation Report")
    print(f"{'='*60}")
    print(f"Path: {results['path']}")
    print()

    if 'frontmatter' in results and results['frontmatter']:
        print("Frontmatter:")
        for key, value in results['frontmatter'].items():
            if key == 'description' and len(value) > 60:
                print(f"  {key}: {value[:57]}...")
            else:
                print(f"  {key}: {value}")
        print()

    if results['errors']:
        print(f"❌ Errors ({len(results['errors'])}):")
        for i, error in enumerate(results['errors'], 1):
            print(f"  {i}. {error}")
        print()

    if results['warnings']:
        print(f"⚠️  Warnings ({len(results['warnings'])}):")
        for i, warning in enumerate(results['warnings'], 1):
            print(f"  {i}. {warning}")
        print()

    if is_valid:
        if results['warnings']:
            print("✅ Skill is valid (with warnings)")
        else:
            print("✅ Skill is valid!")
    else:
        print("❌ Skill validation failed")
        print()
        print("Please fix the errors above and run validation again.")

    print(f"{'='*60}\n")


def main():
    if len(sys.argv) != 2:
        print("Usage: validate_skill.py <skill-directory>")
        print("\nExamples:")
        print("  validate_skill.py ./my-skill")
        print("  validate_skill.py /path/to/skills/my-skill")
        sys.exit(1)

    skill_path = sys.argv[1]

    print(f"🔍 Validating skill at: {skill_path}")

    is_valid, results = validate_skill(skill_path)

    print_results(is_valid, results)

    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
