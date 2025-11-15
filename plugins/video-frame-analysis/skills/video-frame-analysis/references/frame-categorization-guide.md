# Frame Categorization Guide

This guide provides patterns for categorizing video frames based on their content type.

## Common Content Categories

### 1. Presentation Slides

**Visual characteristics:**
- High contrast text on solid background
- Bullet points, headings, diagrams
- Professional typography
- Company logos/branding
- Minimal motion between frames
- Consistent layout/template

**Typical indicators:**
- Large text readable at thumbnail size
- Structured layout (titles, sections)
- Charts, graphs, icons
- White, dark, or branded backgrounds

**Examples:**
- Keynote/PowerPoint slides
- Technical diagrams
- Architecture drawings
- Flowcharts

**Value:** HIGH - Usually contains key information

---

### 2. Demo Screenshots / UI

**Visual characteristics:**
- Application interfaces
- Browser windows
- Admin panels/dashboards
- Code editors
- Terminal windows
- Multiple UI elements (buttons, menus, forms)

**Typical indicators:**
- Navigation bars, sidebars
- Form fields and inputs
- Buttons and controls
- Address bars (browser)
- Window chrome/toolbars

**Examples:**
- Product demos
- Software walkthroughs
- Dashboard views
- Admin interfaces

**Value:** HIGH - Shows actual product/functionality

---

### 3. Code/Terminal

**Visual characteristics:**
- Monospace font
- Dark background (usually)
- Syntax highlighting
- Line numbers
- Terminal prompt symbols

**Typical indicators:**
- `$` or `>` prompts
- Git commits
- Console output
- Code with syntax colors
- Stack traces/logs

**Examples:**
- Code editors (VS Code, etc.)
- Terminal sessions
- Git operations
- Build outputs

**Value:** MEDIUM-HIGH - Technical content

---

### 4. Presenter Shots

**Visual characteristics:**
- Human faces
- Speaking posture
- Microphone visible
- Conference badge
- Hand gestures
- Room/venue visible

**Typical indicators:**
- Person centered or prominent
- Conference/meetup setting
- Multiple people (panel)
- Podium/stage

**Examples:**
- Speaker at podium
- Panel discussions
- Q&A sessions
- Introductions

**Value:** LOW - Usually extraneous for technical content

---

### 5. Audience Shots

**Visual characteristics:**
- Multiple people seated
- Backs of heads
- Laptops visible
- Conference seating
- Low lighting (typically)

**Typical indicators:**
- Rows of seats
- Crowd in background
- People facing away
- Laptop screens visible

**Examples:**
- Conference audience
- Meetup attendees
- Workshop participants

**Value:** LOW - Usually extraneous

---

### 6. Video Calls / Grid View

**Visual characteristics:**
- Multiple small rectangles (Zoom/Meet grid)
- Screen sharing view
- Participant names overlaid
- Gallery view layout

**Typical indicators:**
- Uniform rectangular arrangement
- Participant name labels
- Video meeting UI elements
- Screen share indicator

**Examples:**
- Zoom meetings
- Google Meet sessions
- Teams calls

**Value:** VARIES - Screen shares are HIGH, participant video is LOW

---

### 7. Video/Animation

**Visual characteristics:**
- Smooth transitions
- Motion graphics
- Animation sequences
- Video clips

**Typical indicators:**
- Motion blur
- Transitioning elements
- Animated logos
- Video playback

**Examples:**
- Intro animations
- Transition effects
- Embedded videos

**Value:** VARIES - May need multiple frames to capture

---

## Categorization Decision Tree

```
Frame analysis flow:

1. Is there a human face prominent?
   YES → Is person speaking/presenting?
         YES → Presenter (LOW value, filter out)
         NO → Audience (LOW value, filter out)
   NO → Continue

2. Is there text visible?
   YES → Is it a slide format?
         YES → Presentation Slide (HIGH value, keep)
         NO → Is it UI/interface?
              YES → Demo Screenshot (HIGH value, keep)
              NO → Is it code/terminal?
                   YES → Code/Terminal (MEDIUM-HIGH, keep)
                   NO → Continue
   NO → Continue

3. Is there application UI visible?
   YES → Demo Screenshot (HIGH value, keep)
   NO → Continue

4. Is this a Zoom/Meet grid?
   YES → Is screen share visible?
         YES → Extract shared screen (HIGH value)
         NO → Video call (LOW value, filter out)
   NO → Continue

5. Is this transitional/animated?
   YES → Animation (VARIES, inspect context)
   NO → Uncategorized (review manually)
```

## Filtering Strategies

### Conservative (Keep Most Frames)

Keep everything except clear extraneous content:
- Filter out: Presenter shots, audience shots
- Keep: Everything else

**Use when:** You're unsure what's important or want comprehensive coverage

### Balanced (Recommended)

Keep technical and informational content:
- Filter out: Presenter shots, audience shots, video call participants, transitions
- Keep: Slides, demos, code, screen shares

**Use when:** Standard presentation/demo analysis

### Aggressive (Minimal Set)

Keep only high-value unique frames:
- Filter out: Presenter, audience, duplicates, transitions, less important UI
- Keep: Only slides, key demo moments, critical code

**Use when:** You need the absolute minimum for documentation

## Duplicate Detection

Frames may be near-duplicates (same slide with slight cursor movement, etc.):

**Indicators of duplicates:**
- Nearly identical layout
- Same text content
- Minor cursor position changes
- Slight presenter movement in overlay

**Strategies:**
- Compare consecutive frames
- Check if text content is identical
- Look for >95% visual similarity
- Keep first occurrence, discard rest

## Special Cases

### Picture-in-Picture

When presenter video overlays content:
- Assess the main content (slide/demo)
- Ignore small presenter overlay
- Categorize based on dominant content

### Screen Sharing with Video

When screen share and webcam both visible:
- Prioritize the screen share content
- Categorize as Demo/Slide based on shared content
- Ignore the webcam portion

### Transition Frames

Frames caught mid-transition:
- Usually blurry or partial content
- May show both old and new content
- Generally LOW value
- Can be filtered out unless critical timing

## Output Recommendations

When exporting categorized frames:

**Naming convention:**
```
[category]-[description]-[timestamp].png

Examples:
slide-ai-features-overview-1-14-00.png
demo-dashboard-widgets-1-15-30.png
code-git-commit-example-1-18-45.png
```

**Organization:**
```
output/
├── slides/
│   ├── slide-01-title.png
│   └── slide-02-architecture.png
├── demos/
│   ├── demo-01-dashboard.png
│   └── demo-02-settings.png
├── code/
│   └── code-01-implementation.png
└── extraneous/
    ├── presenter-01.png
    └── audience-01.png
```
