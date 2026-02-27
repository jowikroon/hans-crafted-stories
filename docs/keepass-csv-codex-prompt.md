# Codex prompt: raw login list → KeePassXC CSV

Paste the block below into Codex (or any LLM), then replace the placeholder with your raw login data. You will get **only** the CSV back. Save as `MyLogins.csv` (UTF-8) and import in KeePassXC: **Database → Import → CSV File…**.

---

## Prompt (copy from "You are" to "Now generate the CSV.")

```
You are an expert KeePassXC migration assistant. Your ONLY job is to create a perfect, ready-to-import CSV file from my raw login data.

Follow these rules EXACTLY — no exceptions, no extra text:

1. Output ONLY the raw CSV. Start directly with the first line (the header). No explanations, no markdown, no ```csv, no "Here is your CSV", nothing else.

2. Header must be exactly: Group,Title,Username,Password,URL,Notes

3. For every entry:
   - Group: intelligently assign one of these (create new groups only if necessary): Email, Banking, Shopping, Social Media, Streaming, Work, Government, Utilities, Other
   - Title: clean and short name of the service (e.g. "Gmail", "ING Bank", "Netflix")
   - Username, Password, URL: use exactly what I provide, never change or invent
   - Notes: ALWAYS begin with one of these exact tags (based on logic and what I wrote):
     • "SAFE" — if strong, unique, recent, 2FA mentioned
     • "NOT SAFE" — if reused, old, weak-looking, or I said so
     • "WEAK" — if short or obvious pattern
     • "REUSED" — if I mention it's used elsewhere
     • "NEEDS CHANGE" — if old or compromised
     After the tag add any extra info I gave you (2FA, changed date, etc.)

4. Clean and normalize everything:
   - Fix obvious typos in URLs (http/https, missing www, etc.)
   - Remove duplicate entries (keep the most recent/complete one)
   - If no URL is given, use a logical guess or leave empty
   - Properly escape fields: any field with comma or quote must be wrapped in "double quotes"

5. Sort the final CSV by Group alphabetically, then by Title alphabetically.

Here is my raw login data (in any format — text, list, table, screenshots description, whatever):

[paste ALL your login data here]

Now generate the CSV.
```

---

## Bonus: suggest stronger passwords for weak entries

Add this sentence at the very end of the prompt (before you send):

```
Also, for every entry tagged "NOT SAFE", "WEAK" or "NEEDS CHANGE", add a second line in Notes with a suggested new strong password (20+ characters, random-looking).
```
