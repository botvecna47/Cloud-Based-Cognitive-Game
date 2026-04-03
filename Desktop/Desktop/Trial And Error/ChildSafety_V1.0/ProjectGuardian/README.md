# Project Guardian (Hackathon MVP)

Consent-first parental safety PoC: a **Windows .NET 8 agent** performs **zonal OCR** on a configured screen region when a **foreground window whitelist** matches; a **FastAPI** brain calls **Hugging Face Inference API**; **Supabase** stores events; a **Streamlit** dashboard shows alerts, a **7-day mood heatmap**, and a simple **Friend-or-Foe** star graph (process-level MVP).

**See [`SNAPSHOT.doc`](SNAPSHOT.doc) for current session state, file tree, and exact next steps.**

**All commands and manual tasks for you to run** (installs, `dotnet`, `pip`, Supabase, env vars) are gathered in **[`MANUAL_STEPS.md`](MANUAL_STEPS.md)**. Prefer that file over scattered chat instructions.

## Snapshot protocol (how to maintain handoff docs)

- **Authoritative report:** [`SNAPSHOT.doc`](SNAPSHOT.doc) in this folder (section **0** = edit instructions; sections **1–10** = live state).
- **Stable runbook:** this `README.md` — update when install or run steps change; keep the link to `SNAPSHOT.doc` above.
- **When to update `SNAPSHOT.doc`:** after **every** change to any project file (add/edit/delete/rename) — not only “big” tasks. Also update before switching models or ending a session, and whenever env names, schema, ports, or APIs change.
- **Rules:** refresh metadata date; keep the file tree accurate; list secrets by **name only**; replace vague bullets with file-specific notes; complete the §8.2 checklist at the bottom of `SNAPSHOT.doc`.
- **Root folder:** `../SNAPSHOT.doc` is a short pointer only — bump its “Last updated” line whenever the authoritative snapshot changes.
- **No auto-installs:** this repo does not install .NET, Python packages, or tools for you. **You** install prerequisites (see below). Documentation lists package names only; assistants should **ask you** to install, not run installers in your environment.
- **Commands:** prefer editing files directly; avoid running shell commands unless unavoidable. Do not assume `dotnet build`, `pip install`, etc. were run — verify locally yourself.
- **User-executable steps:** anything that requires the human to run a command or do manual UI work must be documented (or updated) in **[`MANUAL_STEPS.md`](MANUAL_STEPS.md)**.

## Prerequisites

- **Windows 10/11** (x64)
- **.NET 8 SDK** (to build the agent): [Download .NET 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Python 3.11+** (brain + dashboard)

## Folder map

```
ProjectGuardian/
  agent/                 # C# console host (Guardian.Agent.csproj)
  brain/                 # FastAPI + HF + Supabase insert
  dashboard/             # Streamlit UI
  supabase/schema.sql    # Run in Supabase SQL editor
  MANUAL_STEPS.md        # You run: installs, commands, Supabase, env setup
  README.md
  SNAPSHOT.doc
```

## Manual dependency install

### Agent (NuGet — restored on `dotnet build`)

- `Microsoft.Extensions.Hosting`
- `Microsoft.Extensions.Http`
- `System.Drawing.Common`
- `System.Management`
- `System.Runtime.WindowsRuntime`

### Brain

```bash
cd brain
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Dashboard

```bash
cd dashboard
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

### Agent — `agent/src/appsettings.json`

- `Guardian:Whitelist` — process/window substrings (e.g. Discord).
- `Guardian:ScreenRegion` — absolute screen rectangle for zonal OCR (pixels).
- `Guardian:BrainBaseUrl` — e.g. `http://127.0.0.1:8000`
- `Guardian:BrainApiKey` — must match `BRAIN_API_KEY` on the brain.

### Brain — copy `brain/.env.example` to `brain/.env`

| Variable | Purpose |
|----------|---------|
| `BRAIN_API_KEY` | Bearer token for `POST /analyze` |
| `HF_TOKEN` | Hugging Face API token (inference) |
| `HF_SENTIMENT_MODEL` | Default: `cardiffnlp/twitter-roberta-base-sentiment-latest` |
| `HF_RISK_MODEL` | Optional; empty uses heuristic risk |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side inserts (keep secret) |

### Supabase

1. Create a project; open **SQL Editor**.
2. Paste and run `supabase/schema.sql`.

### Dashboard — environment

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Same as project |
| `SUPABASE_KEY` | Service role or anon key per your policy (MVP often uses service role in secrets) |

## How to run (dev)

Step-by-step (installs, paths, verification): **[`MANUAL_STEPS.md`](MANUAL_STEPS.md)**.

Quick reference:

**Terminal 1 — Brain**

```bash
cd brain
.venv\Scripts\activate
set BRAIN_API_KEY=your_key
set HF_TOKEN=your_hf_token
set SUPABASE_URL=...
set SUPABASE_SERVICE_ROLE_KEY=...
uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Dashboard**

```bash
cd dashboard
.venv\Scripts\activate
set SUPABASE_URL=...
set SUPABASE_KEY=...
streamlit run app.py
```

**Terminal 3 — Agent**

```bash
cd agent
dotnet run -c Release
```

Adjust `appsettings.json` so the capture region overlaps your chat area and whitelist matches your foreground app.

## Security notes

- Local queue files may be **AES-256-GCM** encrypted with a key derived from the Windows **MachineGuid** (see `Storage/MachineKey.cs`).
- Agent → Brain uses **HTTPS** in production; local dev may use HTTP.
- **RLS** is disabled in `schema.sql` for hackathon speed; enable before production.

## Optional: HKCU Run (visible startup)

Use `RunKeyHelper` from `Startup/RunKeyHelper.cs` in a small tool or document manual registry entry — not auto-run from the agent in this MVP.
