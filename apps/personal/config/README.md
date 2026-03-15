# Config & credentials

## “I don’t have an env file” — start here

**What’s an env file?**  
A simple text file with lines like `NAME=value`. It’s where we put secrets (API keys, passwords) and URLs so scripts and the app can use them **without** writing those secrets into the code. The file stays only on your computer and is not committed to git.

**What to do:**

1. **Create your env file**  
   In this folder (`config/`), copy the example file and rename the copy:
   - **Copy:** `all-credentials.export.env.example`
   - **To:** `all-credentials.export.env`

2. **Open `all-credentials.export.env`** in a text editor and replace the placeholders with your real values:
   - **N8N_BASE_URL** — your n8n address: `https://hansvanleeuwen.app.n8n.cloud`
   - **N8N_API_KEY** — the long key you got from n8n (Settings → n8n API → Create an API key). Paste it after the `=`, no quotes needed.
   - **SUPABASE_URL** — already filled in the example (`https://pesfakewujjwkyybwaom.supabase.co`). Change only if you use another project.
   - **SUPABASE_SERVICE_ROLE_KEY** — from Supabase: Project Settings → API → “service_role” key (secret).
   - **ANTHROPIC_API_KEY** / **OPENAI_API_KEY** — from your Anthropic and OpenAI accounts. Only needed if you run n8n workflows that use Claude or OpenAI.

3. **Save the file.**  
   Don’t commit it (it’s in `.gitignore`).

4. **Run the n8n credentials script** (from the project root):
   ```bash
   npm run n8n:add-credentials
   ```
   That script reads `config/all-credentials.export.env` and adds the credentials to n8n at **https://hansvanleeuwen.app.n8n.cloud**.

**Summary:**  
Env file = one place for your n8n URL, n8n API key, and other keys. You create it once from the example, paste your real values, then the script uses it to talk to n8n.
