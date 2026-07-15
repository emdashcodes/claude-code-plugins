---
name: quill-export
description: Export meetings, transcripts, speaker names, metadata, notes, and recording links from the Quill macOS app database to Markdown. Use when Codex or Claude needs to list, find, extract, summarize, or save local Quill meeting data.
---

# Quill Meeting Export

Export local Quill meetings through the bundled `scripts/export_meeting.py` script.

## Resolve the bundled script

Locate the directory containing this `SKILL.md`, then set `SCRIPT` to the absolute path of its bundled exporter:

```bash
SCRIPT="<absolute-skill-directory>/scripts/export_meeting.py"
```

Replace `<absolute-skill-directory>` before running the command. Use the skill path exposed by the current host. Do not assume the skill is under `~/.claude`, `~/.codex`, or the current working directory; plugin installations may run from a versioned cache.

## Check access

Quill stores its database at:

```text
~/Library/Application Support/Quill/quill.db
```

Before the first export, verify that the database is readable:

```bash
test -r "$HOME/Library/Application Support/Quill/quill.db"
```

If it is missing, confirm that Quill is installed and has created at least one meeting. If macOS or the execution sandbox denies access, explain the exact path that must be allowed. Do not copy the database or change its permissions without the user's approval.

Treat transcripts and meeting notes as private local data. Only expose or save the meeting content the user requested.

## List meetings

List recent meetings before exporting when the user has not supplied an exact meeting ID:

```bash
python3 "$SCRIPT" list 20
```

The list is written to stderr and includes the meeting ID, title, date, duration, and type. Use a smaller or larger positive integer when the user specifies a limit.

## Export a meeting

Export by exact meeting ID:

```bash
python3 "$SCRIPT" export "76490ffc-d751-4a2a-9ef5-df4d3ddce442"
```

Or export by a case-insensitive title fragment:

```bash
python3 "$SCRIPT" export "orchestrator"
```

If a title fragment matches multiple meetings, show the short match list and ask the user which meeting they mean. Do not guess based only on recency.

The Markdown document is written to stdout. Status and errors are written to stderr, so redirection is safe:

```bash
python3 "$SCRIPT" export "meeting title" > "/absolute/output/path/meeting.md"
```

Quote all paths and search terms. When saving a file, use the destination the user supplied. If no destination was supplied, return the Markdown in the conversation or ask before writing outside the current workspace.

## Finish the note

The exporter preserves Quill's original notes and emits placeholders for `Summary`, `Key Discussion Points`, `Action Items`, and `Related`.

- For a raw export, leave the transcript and original Quill notes unchanged and remove unfilled placeholder sections.
- For a polished meeting note, replace the placeholders using only evidence in the transcript, metadata, and Quill notes.
- Keep decisions distinct from discussion points.
- Include an action item only when the meeting assigns or clearly implies an action. Preserve the named owner when available.
- Add related links only when the user provides them or they can be verified in the current workspace. Do not invent cross-references.
- Preserve the YAML frontmatter, speaker attribution, original Quill notes, and recording link.

## Output details

The exporter:

- Maps Quill speaker IDs to contact names when Quill has tagged them.
- Groups consecutive transcript blocks from the same speaker.
- Classifies known meeting types as `work` or `personal` in YAML frontmatter.
- Includes only the combined `.m4a` recording when it can find one.
- Never modifies the Quill database.

See [references/quill-schema.md](references/quill-schema.md) only when debugging schema drift or changing the exporter. Use [assets/meeting-template.md](assets/meeting-template.md) as the target structure for a polished note.

## Handle failures

- Database missing or unreadable: report the expected path and the underlying error.
- No title match: show the search term and suggest listing recent meetings.
- Multiple title matches: show the matching IDs and titles, then wait for a choice.
- Missing transcript or audio: export the available metadata and notes; do not treat optional media as a total failure.
- SQLite schema error: inspect the live schema and compare it with `references/quill-schema.md` before changing any query.
