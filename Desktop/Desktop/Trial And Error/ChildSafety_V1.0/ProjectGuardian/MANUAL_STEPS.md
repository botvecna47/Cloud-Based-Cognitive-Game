# Manual steps & commands (you run these locally)

This file is the **single place** for instructions that require **you** to execute something on your machine: installs, shell commands, clicks in Supabase, copying keys, etc.

**Rules for contributors and AI assistants**

- Do **not** assume these commands were run unless you did them yourself.
- When the project needs a **new** manual step (new tool, new env var, new port), **add or update a section here** — do not only say it in chat.
- After changing this file, update [`SNAPSHOT.doc`](SNAPSHOT.doc) (per §0).

---

## 1. What you need installed (one-time)

| Item | Why | Where to get it |
|------|-----|-----------------|
| **Windows 10/11 (x64)** | Agent is Windows-only | — |
| **.NET 8 SDK** | Build/run `Guardian.Agent` | [Download .NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) |
| **Python 3.11+** | Brain + dashboard | [python.org](https://www.python.org/downloads/) or Microsoft Store |
| **Git** (optional) | Clone/versioning | [git-scm.com](https://git-scm.com/) |

Verify in a terminal (you run these):

```text
dotnet --version
python --version
```

You should see a .NET **8.x** SDK and Python **3.11+**.

---

## 2. Supabase (database)

1. Create a project at [Supabase](https://supabase.com/).
2. Open **SQL Editor** in the dashboard.
3. Open the file `ProjectGuardian/supabase/schema.sql` in your editor, copy its full contents, paste into SQL Editor, **Run**.
4. Confirm tables `events` (and `alerts`) exist under **Table Editor**.

**Secrets you will need later (names only — never commit values):**

- Project **URL** → `SUPABASE_URL`
- **service_role** key (Settings → API) → `SUPABASE_SERVICE_ROLE_KEY` for the brain, and often `SUPABASE_KEY` for the dashboard in MVP setups (treat as secret).

---

## 3. Hugging Face (inference token)

1. Create/login at [Hugging Face](https://huggingface.co/).
2. Settings → **Access Tokens** → create a token with read access to Inference API.
3. You will put it in `HF_TOKEN` in the brain `.env` (see below).

---

## 4. Brain (FastAPI) — first-time setup

**Paths:** replace `path\to\ProjectGuardian` with your actual folder.

### 4.1 Virtual environment and packages

```text
cd path\to\ProjectGuardian\brain
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 4.2 Environment file

1. Copy `brain/.env.example` to `brain/.env`.
2. Edit `brain/.env` and set (use your real values; do not share them in chat logs publicly):

   - `BRAIN_API_KEY` — any strong random string; **must match** `Guardian:BrainApiKey` in `agent/src/appsettings.json`.
   - `HF_TOKEN` — Hugging Face token.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase.
   - Optional: `HF_SENTIMENT_MODEL`, `HF_RISK_MODEL`, `RISK_ALERT_THRESHOLD`.

### 4.3 Run the API (you run this)

```text
cd path\to\ProjectGuardian\brain
.venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

**Check:** browser or another terminal: open `http://127.0.0.1:8000/healthz` — should return JSON like `{"status":"ok"}`.

---

## 5. Dashboard (Streamlit)

### 5.1 Virtual environment (separate from brain is OK)

```text
cd path\to\ProjectGuardian\dashboard
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 5.2 Environment variables

Set before `streamlit run` (PowerShell examples):

```text
$env:SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_KEY = "YOUR_KEY"
```

Use the key policy you chose (MVP often uses service role for simplicity; lock down for production).

### 5.3 Run

```text
cd path\to\ProjectGuardian\dashboard
.venv\Scripts\activate
streamlit run app.py
```

Streamlit prints a local URL (e.g. `http://localhost:8501`).

---

## 6. Agent (C#)

### 6.1 Configure

Edit `agent/src/appsettings.json`:

- `Guardian:BrainBaseUrl` — e.g. `http://127.0.0.1:8000` if brain is local.
- `Guardian:BrainApiKey` — **same string** as `BRAIN_API_KEY` in `brain/.env`.
- `Guardian:ScreenRegion` — **Left, Top, Width, Height** in **screen pixels** over your chat area (use Snipping Tool or similar to find numbers).
- `Guardian:Whitelist` — substrings matching your app (e.g. Discord process or window title).

### 6.2 Build and run (you run these)

```text
cd path\to\ProjectGuardian\agent
dotnet build -c Release
dotnet run -c Release
```

If build errors mention WinRT or Windows SDK, install the **.NET 8 SDK** and ensure **Windows 10/11** SDK components are available (Visual Studio Installer can add them if needed).

---

## 7. End-to-end order (recommended)

1. Supabase: run `schema.sql`.
2. Brain: `.env` + `uvicorn` → `/healthz` OK.
3. Agent: `appsettings.json` + `dotnet run` (optional: run after brain is up).
4. Send at least one successful `/analyze` (agent does this when OCR fires, or use a REST client to test the brain).
5. Dashboard: env vars + `streamlit run` → see rows in UI.

---

## 8. Optional: HKCU startup (demo)

The code includes `RunKeyHelper` — registering Run entries is **manual** for MVP. Do not add Run keys without understanding what runs at logon. Document your own path in a personal note if you use it.

---

## 9. Changelog (manual doc updates)

| Date | Change |
|------|--------|
| 2026-04-01 | Initial `MANUAL_STEPS.md` created: installs, Supabase, HF, brain, dashboard, agent, E2E order. |

**When you add steps:** append a row here and bump the date in `SNAPSHOT.doc`.
