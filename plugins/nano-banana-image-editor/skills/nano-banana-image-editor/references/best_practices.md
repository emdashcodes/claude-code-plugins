# Gemini 3 Pro Image - Best Practices

Essential best practices for getting the most out of Gemini 3 Pro Image (Nano Banana Pro).

## 1. Be Hyper-Specific

Vague prompts yield unpredictable results. Specific prompts give you control.

**❌ Avoid:**

- "A nice landscape"
- "Make it better"
- "A person in a room"

**✅ Instead:**

- "A snow-covered mountain landscape at sunrise, with a frozen lake in the foreground reflecting pink and orange clouds, shot with a wide-angle lens"
- "Increase the contrast by 20%, warm up the color temperature, and sharpen the details in the foreground"
- "A woman in her 30s with shoulder-length brown hair, wearing a blue blazer, sitting in a modern office with floor-to-ceiling windows, natural lighting from the left"

**Why it works:** The model has millions of possible interpretations of "nice landscape." By adding specific details (time of day, weather, elements, camera settings), you narrow the possibility space to match your vision.

## 2. Provide Context and Intent

Tell the model what the image is for and how it should feel.

**Examples:**

- "Create a professional LinkedIn headshot with..."
- "Design a playful children's book illustration featuring..."
- "Generate a serious, corporate presentation slide showing..."
- "Make a vibrant, energetic social media graphic for..."

**Why it works:** Understanding the purpose helps the model make appropriate stylistic choices (formal vs. casual, serious vs. playful, detailed vs. simplified).

## 3. Iterate and Refine

Use Gemini's multi-turn conversation capability to progressively improve images.

**Workflow:**

1. Start with a good baseline prompt
2. Generate initial image
3. Identify specific improvements needed
4. Request targeted edits in follow-up prompts
5. Repeat until satisfied

**Example conversation:**

```
You: Create a logo for a coffee shop called "Morning Brew"
[Review result]
You: Make the coffee cup larger and move it to the left side
[Review result]
You: Change the font to something more elegant and vintage
[Review result]
You: Perfect! Now generate it at 4K resolution
```

**Why it works:** Breaking down complex requests into steps gives you more control and allows you to course-correct based on each result.

## 4. Use Step-by-Step Instructions

For complex compositions, break down the prompt into clear steps.

**Example:**

```
Create a promotional poster:
1. Background: Gradient from deep blue (top) to purple (bottom)
2. Main element: Large coffee cup in the center, photorealistic, steam rising
3. Text: "MORNING BREW" in bold sans-serif at the top, white color
4. Subtext: "Opening Soon" below the cup, smaller elegant font
5. Style: Modern, clean, professional
```

**Why it works:** Structured prompts help the model prioritize elements and understand their relationships.

## 5. Semantic Negative Prompts

Instead of saying what you don't want, describe what you do want more precisely.

**❌ Less effective:**

- "No blur, no distortion, no artifacts"

**✅ More effective:**

- "Sharp focus, clean edges, high-fidelity detail"

**Why it works:** The model responds better to positive instructions. If you find yourself listing negatives, reframe as specific positive attributes.

## 6. Control the Camera

Use photography terminology to precisely control perspective and quality.

**Camera Terms:**

- **Focal length:** "24mm wide-angle", "85mm portrait lens", "200mm telephoto"
- **Aperture:** "f/1.8 for shallow depth of field", "f/11 for everything in focus"
- **Shot type:** "wide shot", "medium shot", "close-up", "extreme close-up"
- **Angle:** "eye-level", "low angle looking up", "bird's eye view", "Dutch angle"
- **Focus:** "tack-sharp focus on subject", "soft focus background", "rack focus"

**Lighting Terms:**

- "Golden hour natural light"
- "Studio lighting with three-point setup"
- "Soft diffused window light"
- "Dramatic side lighting with deep shadows"
- "Bright even lighting, no harsh shadows"

**Why it works:** These terms are well-represented in the training data and give precise control over the visual result.

## 7. Multiple Reference Images Best Practices

When using reference images, be strategic about what you include.

**Character Consistency (up to 5 people):**

- Use clear, well-lit photos of faces
- Consistent angle and expression across references helps
- Specify: "Maintain facial resemblance to these people"

**Object Fidelity (up to 6 objects):**

- Use high-quality photos of objects from multiple angles
- Specify: "Keep these objects' appearance accurate"

**Style Transfer:**

- Use 1-2 reference images for style
- Clearly state: "Apply the artistic style of this reference to..."

**Composition:**

- Reference images for background, foreground, or specific elements
- Specify what each image contributes: "Use the first image for style, second for background, third for subject"

## 8. Resolution Strategy

Choose resolution based on use case, not "bigger is always better."

**When to use 1K (default):**

- Iterating and testing prompts
- Social media posts (most platforms downscale anyway)
- Quick mockups and concepts
- Budget-conscious projects

**When to use 2K:**

- Professional presentations
- Print materials (small format)
- High-quality web graphics
- Portfolio pieces

**When to use 4K:**

- Large print materials
- Studio-quality output needed
- Final production assets
- When maximum detail is critical

**Cost vs. Quality:** 4K costs more tokens and takes longer. Start with 1K to perfect your prompt, then regenerate at 4K for final output.

## 9. Aspect Ratio Selection

Match aspect ratio to intended use:

**1:1** - Instagram posts, profile pictures, icons, square formats
**16:9** - YouTube thumbnails, presentation slides, desktop wallpapers
**9:16** - Instagram Stories, TikTok, mobile-first vertical content
**4:3** - Traditional print, some presentation formats
**3:2** - Standard photography, print photos
**21:9** - Cinematic ultra-wide, dramatic landscapes

**Tip:** Changing aspect ratio can dramatically change composition. If 16:9 cuts off important elements, try a different ratio rather than fighting the composition.

## 10. When to Use Google Search Grounding

Enable `--search` flag for prompts that benefit from real-time or factual information.

**Use search grounding for:**

- Weather visualizations ("today's weather in...")
- Current events ("recent news about...")
- Factual information (species characteristics, historical facts, scientific data)
- Real-world object appearances

**Don't use search grounding for:**

- Purely creative/artistic requests
- Abstract concepts
- Fictional scenarios
- When speed matters more than factual accuracy

## 11. Editing Best Practices

**Start simple:**

- Make one change at a time
- Test each edit before adding more

**Be specific about regions:**

- "In the top left corner..."
- "The background behind the subject..."
- "The person wearing the red shirt..."

**Preserve what works:**

- "Change X but keep Y exactly the same"
- "Maintain the subject's facial features while changing the background"

**Natural integration:**

- "Blend seamlessly with the existing image"
- "Match the lighting and color temperature of the scene"
- "Integrate naturally, preserving perspective"

## 12. Common Pitfalls to Avoid

**1. Overloading prompts:**

- ❌ Trying to describe every tiny detail
- ✅ Focus on the most important 5-7 elements

**2. Ambiguous pronouns:**

- ❌ "Make it blue and put it on the left"
- ✅ "Make the car blue and place the tree on the left side"

**3. Contradictory instructions:**

- ❌ "Photorealistic cartoon style"
- ✅ "Photorealistic portrait" OR "Cartoon-style illustration"

**4. Forgetting the format:**

- ❌ Requesting features outside the aspect ratio
- ✅ Check that your composition fits the chosen aspect ratio

**5. Not using reference images when you should:**

- ❌ Describing a complex style in words
- ✅ Providing a reference image of the desired style

**6. Bash special characters in prompts:**

- ❌ Using double quotes with dollar signs: `"Menu: Espresso $3, Latte $4"`
- ✅ Using single quotes: `'Menu: Espresso $3, Latte $4'`
- ✅ Or escaping special chars: `"Menu: Espresso \\$3, Latte \\$4"`
- **Why:** In bash, double-quoted strings expand `$variable` syntax. Characters like dollar signs, exclamation marks, backticks, and backslashes need escaping or single quotes
- **Common issue:** Prompts with prices (`$3.50`) or other special characters get corrupted when passed through bash

## 13. Quality Checklist

Before finalizing an image, check:

- [ ] Does it match the prompt intent?
- [ ] Is the resolution appropriate for the use case?
- [ ] Is the aspect ratio correct?
- [ ] Are all text elements legible and accurate?
- [ ] Is the composition balanced and effective?
- [ ] Does lighting and perspective make sense?
- [ ] Are colors and mood appropriate?
- [ ] Are there any artifacts or errors to fix?

## 14. Workflow for Complex Projects

1. **Research and gather references** - Collect style references, example compositions
2. **Start with low-res iterations** - Use 1K to perfect the prompt
3. **Test variations** - Try different aspect ratios and compositions
4. **Refine progressively** - Multi-turn editing to dial in details
5. **Final high-res render** - Regenerate at 2K or 4K once perfect
6. **Quality check** - Review against checklist above

## 15. Learning from Results

Keep a "prompt journal" of what works:

- Save successful prompts for reuse
- Note which terminology gives desired results
- Build a personal library of effective reference images
- Document the relationship between prompt details and outcomes

**The key to mastery:** Experimentation, iteration, and learning from each generation.
