

# Add All AI Models to Command Center Model Picker

## What Changes

The model picker currently shows 5 models. Lovable AI supports 12 models total. This adds all missing models to the dropdown, organized into clear groups (Google Gemini and OpenAI) so users can pick any available model.

## Models to Add

Currently missing from `AI_MODELS`:
- `google/gemini-3-pro-preview` (Pro, next-gen)
- `google/gemini-2.5-flash-lite` (cheapest/fastest)
- `openai/gpt-5-nano` (fast/cheap)
- `openai/gpt-5.2` (latest reasoning)

Also adding image generation models as a separate visual group:
- `google/gemini-2.5-flash-image` (image gen)
- `google/gemini-3-pro-image-preview` (next-gen image gen)

## Updated `AI_MODELS` Array

```text
Google Gemini:
  Gemini 3 Pro         - "Next-Gen"
  Gemini 3 Flash       - "Fast"
  Gemini 2.5 Pro       - "Powerful"
  Gemini 2.5 Flash     - "Balanced"
  Gemini 2.5 Flash Lite - "Lite"

OpenAI:
  GPT-5.2              - "Latest"
  GPT-5                - "Premium"
  GPT-5 Mini           - "Smart"
  GPT-5 Nano           - "Speed"

Image Generation:
  Gemini 3 Pro Image   - "Image"
  Gemini 2.5 Flash Image - "Image"
```

## UI Changes in `CommandCenter.tsx`

The dropdown gets group headers to separate providers:

- A thin `text-[8px] uppercase tracking-widest text-muted-foreground/40` label before each group: "GOOGLE GEMINI", "OPENAI", "IMAGE GEN"
- Dropdown width increases slightly from `w-52` to `w-56` to accommodate longer names
- Image models show a small camera icon instead of the tag badge to differentiate them visually

## Files to Modify

| File | Change |
|------|--------|
| `src/components/command-center/commandCenterData.ts` | Expand `AI_MODELS` array with all 11 models, add a `group` field to each entry |
| `src/components/command-center/CommandCenter.tsx` | Update model picker dropdown to render group headers and handle the expanded list |

