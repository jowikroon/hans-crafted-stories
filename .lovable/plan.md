

# Add VPS2 Ollama Models to Command Center

Add self-hosted Ollama models running on VPS2 (187.124.2.66) as a new "LOCAL / VPS" group in the model picker, and route requests to the Ollama API in the edge function.

---

## 1. Add Ollama models to `commandCenterData.ts`

Add a new group `"ollama"` to the `AIModelGroup` type and add models to `AI_MODELS`:

```text
AIModelGroup = "gemini" | "openai" | "image" | "ollama"

New entries:
  Qwen 2.5 7B     - tag: "7B"    - group: "ollama"
  Llama 3.2 3B    - tag: "3B"    - group: "ollama"
```

## 2. Update model picker UI in `CommandCenter.tsx`

Add `"ollama"` to the group iteration with label **"LOCAL / VPS"**. These models get a server icon or tag instead of the camera/badge pattern used by other groups. The dropdown already handles groups via the `(["gemini", "openai", "image"] as const).map(...)` block -- just extend it to include `"ollama"`.

## 3. Route Ollama models in `hansai-chat/index.ts`

Add a third routing branch before the Lovable AI gateway fallback:

- If `selectedModel` starts with `"ollama/"`, extract the model name (e.g. `qwen2.5:7b`) and call the Ollama API directly at `http://187.124.2.66:11434/v1/chat/completions` (Ollama's OpenAI-compatible endpoint).
- This endpoint returns SSE in the same OpenAI format, so the existing streaming response logic works unchanged.
- No API key needed -- Ollama runs open on the VPS, firewalled to VPS1 only.

The routing order becomes:
1. Model starts with `ollama/` -- call VPS2 Ollama directly
2. `GEMINI_API_KEY` is set and model is Google -- call Gemini API
3. Fallback -- call Lovable AI Gateway

## 4. Store the Ollama base URL as a secret

Add `OLLAMA_BASE_URL` as a Supabase secret (`http://187.124.2.66:11434`) so the edge function doesn't hardcode the IP. This also makes it easy to change if the VPS moves.

---

## Files to modify

| File | Change |
|------|--------|
| `src/components/command-center/commandCenterData.ts` | Add `"ollama"` to `AIModelGroup`, add 2 Ollama model entries |
| `src/components/command-center/CommandCenter.tsx` | Add `"ollama"` to group iteration with "LOCAL / VPS" header |
| `supabase/functions/hansai-chat/index.ts` | Add Ollama routing branch using OpenAI-compatible `/v1/chat/completions` endpoint |

## Technical details

**Ollama model IDs in the data:**
- `ollama/qwen2.5:7b` -- maps to Ollama model name `qwen2.5:7b`
- `ollama/llama3.2:3b` -- maps to Ollama model name `llama3.2:3b`

**Edge function Ollama call:**
```typescript
// Strip "ollama/" prefix to get the actual model name
const ollamaModel = selectedModel.replace("ollama/", "");
const ollamaBase = Deno.env.get("OLLAMA_BASE_URL") || "http://187.124.2.66:11434";

const ollamaRes = await fetch(`${ollamaBase}/v1/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: ollamaModel,
    messages: [{ role: "system", content: systemContent }, ...messages],
    stream: true,
  }),
});
```

Since Ollama's `/v1/chat/completions` returns standard OpenAI SSE format, the response can be passed through directly -- same as the existing Lovable AI gateway path.
