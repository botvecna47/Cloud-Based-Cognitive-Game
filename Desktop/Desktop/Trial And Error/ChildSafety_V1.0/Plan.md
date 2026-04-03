1. Vision and MVP outcome

Problem: Parents need visibility into risky online interactions; E2E chat apps block database scraping.

MVP outcome: A functional demo where:





A Windows Agent captures visible text from parent-whitelisted foreground windows (e.g., Discord) using Consent-First Zonal OCR via Windows.Media.Ocr.



Text is processed by a FastAPI service that calls Hugging Face Inference APIs for sentiment + risk labels/scores.



A Supabase database stores events plus relationship/risk metrics.



A Streamlit dashboard visualizes a simple Friend-or-Foe social graph and a 7-day mood heatmap.

Success criteria for hackathon: End-to-end path works on one machine; README documents manual install steps; SNAPSHOT.doc always reflects current tree and next step.



2. Explicit scope: what to omit vs include







Area



Omit for MVP



Include





ML



Local BERT training/fine-tune



HF Inference API only (sentiment + one classifier endpoint)





Persistence



Registry SD tricks, HKU stealth, task hiding



Standard HKCU Run or manual run; document only





UI



React/WPF heavy UI



Streamlit dashboard; agent config via appsettings.json





Data



Large local DB



Supabase Postgres via supabase-py





Input



Global low-level keyboard hooks / keylogging



Foreground whitelist + idle gate + region hash to trigger OCR

Safety boundary: No stealth keylogging, no process camouflage, no hiding from Task Scheduler. Framing for stakeholders: authorized parental supervision with visible consent and configurable capture.



3. Assumptions (defaults until you change them)





OCR trigger: Foreground window title/process name matches a whitelist in config; optional GetLastInputInfo (or similar) so OCR pauses when user idle above N seconds.



Region: MVP uses a fixed rectangle (screen coordinates) or window client rect for the active whitelisted window; parent edits JSON once.



Startup: HKCU\Software\Microsoft\Windows\CurrentVersion\Run for demo persistence (documented, reversible).



Auth: Brain accepts a shared API key header for the agent; dashboard uses Supabase anon key + RLS (or service role only server-side in brain—prefer RLS-friendly pattern).



4. Target architecture

flowchart LR
  subgraph agent [Windows_Agent_NET8]
    Watcher[ForegroundWatcher]
    Orch[CaptureOrchestrator]
    Ocr[OcrManager]
    Q[LocalQueue]
    Up[UploadClient]
    Watcher --> Orch
    Orch --> Ocr
    Ocr --> Q
    Q --> Up
  end
  subgraph cloud [Cloud]
    API[FastAPI_Brain]
    HF[HuggingFace_Inference]
    SB[(Supabase_Postgres)]
    API --> HF
    API --> SB
  end
  Up -->|HTTPS_JSON| API
  subgraph dash [Parent]
    ST[Streamlit]
  end
  SB --> ST

Data flow (happy path):





Watcher polls or hooks foreground window (Win32); if not whitelisted, orchestrator stays idle.



If eligible, orchestrator requests capture at most 1–2 Hz; skips if region hash unchanged.



OcrManager returns normalized text line(s); agent appends JSON lines to local queue file(s).



UploadClient POSTs batches to POST /ingest or POST /analyze (see contracts below).



Brain calls HF, merges scores, writes row(s) to Supabase.



Streamlit queries Supabase (read-only) for charts and tables.



5. Repository layout (authoritative tree)

ProjectGuardian/
  agent/
    Guardian.Agent.csproj          # net8.0-windows; Windows SDK
    src/
      Program.cs                   # Generic host + BackgroundService
      appsettings.json             # whitelist, region, brain URL, API key path
      Capture/
        CaptureOrchestrator.cs
        ForegroundWindowWatcher.cs
        RegionSelector.cs
      Ocr/
        OcrManager.cs
      Storage/
        LocalQueue.cs
      Transport/
        UploadClient.cs
      Startup/
        RunKeyHelper.cs            # optional HKCU Run register/unregister
  brain/
    main.py                        # FastAPI app
    requirements.txt
    .env.example                   # HF_TOKEN, SUPABASE_*, BRAIN_API_KEY
  dashboard/
    app.py
    requirements.txt
  README.md
  SNAPSHOT.doc

Optional: supabase/migrations/ or a single schema.sql checked in for reproducibility.



6. API and data contracts

6.1 Agent to Brain

**POST /analyze** (or split /ingest raw + /analyze server-side only—MVP can use one endpoint)

Request body (JSON):





device_id (string, stable GUID in config or machine id hash)



captured_at (ISO-8601 UTC)



window_title (string, truncated)



process_name (string)



text (string, OCR output chunk)



region_hash (string, optional dedupe id)

Response:





sentiment_label, sentiment_score (from HF)



risk_label, risk_score (from HF classifier if available, else heuristic placeholder)



alert (boolean) — true if any score crosses threshold

Headers: Authorization: Bearer <BRAIN_API_KEY> or X-Api-Key.

6.2 Brain to Hugging Face





Environment: HF_TOKEN, model IDs for sentiment and (optional) text-classification for grooming-style labels.



Implement timeouts (e.g., 15–30 s) and fallback: if HF fails, return alert: false and log error (do not block agent forever).

6.3 Supabase (minimal schema sketch)

Tables (illustrative):





events — id, device_id, captured_at, window_title, text_snippet (truncated), sentiment_score, risk_score, created_at



alerts — id, event_id, reason, created_at

RLS: Policies so parent_user_id or device_id maps to authenticated parent; MVP may use a single service role from brain only and lock dashboard behind Streamlit secrets (hackathon shortcut), with a follow-up to tighten RLS.



7. Efficiency plan (low-end hardware)







Mechanism



Purpose





Whitelist + idle gate



Avoid OCR when wrong app or user away





Max OCR rate 1–2/s



Cap CPU while chat is active





Region hash (MVP: fast checksum; later: pHash)



Skip OCR when pixels unchanged





Crop to message area only



Smaller bitmap than full screen





Downscale before OCR



Fewer pixels for Windows.Media.Ocr





Bounded queue



Max file size or line count; drop oldest or pause upload



8. Snapshot protocol (mandatory — no low-effort handoffs)

Purpose: SNAPSHOT.doc is the authoritative handoff report for any AI or human picking up the repo. It must be complete enough that someone never needs to scan the whole tree to know what works, what is broken, and what to do next. Vague one-liners (“updated stuff”, “fixed bugs”) are not acceptable.

Where the files live: Repo root (or ProjectGuardian/ root if you nest the app there—pick one root and never split handoff docs across two locations).

When to update (hard rule):





After every discrete task or PR-sized chunk that changes files.



Before ending a chat session or switching models.



After any change to run instructions, env vars, schema, or ports.

README.md sync





README.md = stable “how to run” + architecture summary + dependency lists.



SNAPSHOT.doc = living state (what changed this session, current tree, blockers, exact next steps).



Do not duplicate long code in SNAPSHOT; do point to file paths and key entrypoints.



8.1 SNAPSHOT.doc — required report structure

Every update must include all sections below. Use clear headings (Markdown or plain text is fine).

1) Metadata





Project: Project Guardian



Date / time (local): e.g. 2026-04-01



Session / task ID (optional): short label, e.g. Task-3-OCR



Branch / commit (if using git): short hash or n/a

2) Executive summary (3–6 bullets)





What the repo can do right now (end-to-end status in one glance).



What is stubbed / not wired yet.



Any demo blocker (e.g., “HF token missing”, “Supabase schema not applied”).

3) Current state — components





Agent (C#): status (not started / skeleton / OCR works / uploads work), main entrypoint file path.



Brain (FastAPI): status, base URL, key endpoints.



Data (Supabase): status, whether schema.sql was applied, RLS status (MVP vs tightened).



Dashboard (Streamlit): status, what charts/pages exist.

4) File tree





Indented tree of all meaningful paths (source, config, docs, SQL scripts).



Exclude only generated junk (bin/, obj/, __pycache__/, .venv/) unless debugging build issues.

5) What was done (this session)





Numbered list tied to files touched (e.g. “Added OcrManager.cs; implemented region crop + hash gate”).



No vague bullets. If a feature is partial, say exactly what is left.

6) Configuration and secrets (names only — no secret values)





List required env vars and where they are set (.env, Streamlit secrets, Windows env).



Note which values are still placeholders.

7) How to run (quick commands — copy/paste)





Shortest path to run agent / brain / dashboard (even if also in README).



Note OS (Windows 10/11) and .NET / Python versions if known.

8) Known issues / risks





OCR accuracy, HF rate limits, DPI scaling, permission issues, etc.

9) Next TODO (ordered, unambiguous)





Numbered steps; each step should be actionable in one coding session (e.g. “Implement UploadClient POST to /analyze with retry policy”).

10) Handoff notes for the next model





2–5 bullets: assumptions, “gotchas”, and the single best file to open first.



8.2 Quality bar (reject if any fail)





File tree matches reality (or explicitly says “not yet created”).



Next TODO is specific; no “continue development” or “improve code”.



What was done references concrete paths and outcomes.



Blockers are explicit or explicitly “none”.



Secrets are never pasted into SNAPSHOT.



8.3 README.md minimum (must stay aligned with SNAPSHOT)





Project purpose + consent boundary (one short paragraph).



Folder map (matches tree in SNAPSHOT).



Prerequisites + manual install lists (NuGet names for C#; pip package names for Python).



How to run each component + env var table.



Link or note: “See SNAPSHOT.doc for current session state and next steps.”



9. Task-by-task execution plan (modular chunks)

Task 1 — Skeleton + snapshot protocol





Create folder tree in section 5; add empty .gitkeep in empty dirs if needed.



Add README.md and SNAPSHOT.doc per Section 8 (full structure, quality bar, README alignment — no placeholder snapshots).



Add Guardian.Agent.csproj targeting net8.0-windows with UseWindowsForms or WinRT refs only as needed for OCR (document in README).



Acceptance: Tree matches plan; README lists all manual installs and points to SNAPSHOT for live state; SNAPSHOT.doc includes every subsection in §8.1 and passes the §8.2 checklist; Next TODO lists Task 2 steps explicitly.

Task 2 — Capture orchestrator + foreground watcher





ForegroundWindowWatcher: GetForegroundWindow, GetWindowText (length-capped), optional GetWindowThreadProcessId → process name; compare to appsettings.json whitelist (substring or regex list).



CaptureOrchestrator: timer or loop with PeriodicTimer; states Idle / Eligible / Capturing; enforce min interval between OCR calls.



Acceptance: Logs to console when foreground window changes and when eligible; no OCR yet is OK.

Task 3 — OcrManager + region selection





RegionSelector: read rectangle from config; map to RECT for PrintWindow/BitBlt or use WinRT screen capture APIs as chosen (document tradeoff in README).



OcrManager: SoftwareBitmap or equivalent path for OcrEngine; preprocess; hash; return text.



Acceptance: Saving one OCR string to console when eligible and region hash changes.

Task 4 — Local queue + UploadClient





LocalQueue: append JSON lines under %LocalAppData%\Guardian\queue\; max size; rotate.



UploadClient: HttpClient, POST batches, retry with backoff, dead-letter file on repeated failure.



Acceptance: Offline queue fills; when brain is up, drains queue.

Task 5 — FastAPI brain + Hugging Face





main.py: lifespan for HTTP client; /healthz; POST /analyze with API key middleware.



Call HF inference for sentiment; second model or same multi-task if available; map to unified response.



requirements.txt: fastapi, uvicorn, httpx, pydantic-settings, optional python-dotenv.



Acceptance: curl/postman to /analyze returns JSON with scores.

Task 6 — Supabase wiring





Insert into events (and alerts when alert true) from brain after HF response.



requirements.txt: add supabase.



Provide schema.sql or Supabase SQL editor script for tables + basic RLS notes.



Acceptance: Row appears in Supabase table after one successful analyze.

Task 7 — Streamlit dashboard





app.py (MVP visuals):





sidebar filters (date range, device)



table of recent events; highlight rows where alert



7-day mood heatmap (sentiment aggregated by day; optionally hour-of-day buckets)



Friend-or-Foe social graph (basic network graph view from Supabase events/contacts)



Secrets: SUPABASE_URL, SUPABASE_KEY via Streamlit secrets or env.



Acceptance: Parent can open browser and see data without running the agent again (historical).

Task 8 — HKCU Run helper (optional polish)





RunKeyHelper: register/unregister path to Guardian.Agent.exe under Run key; log success; require admin only if writing HKLM (do not—stay HKCU).



Document uninstall: remove key + delete queue folder.



10. Three-day hackathon timeline (suggested)







Day



Focus



Deliverables





1



Connection



Skeleton, watcher + orchestrator stub, FastAPI /healthz + /analyze stub, README/SNAPSHOT discipline





2



Intelligence



OcrManager end-to-end, HF integration, Supabase insert, basic Streamlit table





3



Polish



Throttle tuning, dashboard chart, HKCU Run doc, demo script for judges



11. Risks and mitigations







Risk



Mitigation





HF rate limits / latency



Cache last result; timeout; show “degraded” in dashboard





OCR wrong on dark themes



Tune binarization/contrast; document theme requirement for demo





Privacy concern in demo



Use synthetic chat window or demo account; blur in slides





RLS complexity



MVP: service role in brain only; add parent auth later



12. Post-MVP backlog (not in initial execution)





UI Automation for chat region instead of fixed rect



JWT between agent and brain per device



Stronger RLS and parent login on dashboard



Encrypted local queue with DPAPI



Graph intelligence:





implement the relationship score R=(Sentiment\cdot Magnitude)+(Frequency\cdot Reciprocity)



compute Betweenness Centrality (hub/peer isolation signals) for contacts



Efficiency targets (summary)





OCR only when: whitelisted foreground, not idle, hash changed.



Hard caps: 1–2 OCR/s, region-only capture, bounded queue.



Startup (demo-safe)





HKCU Run only; documented removal path.



No stealth persistence, no SD deletion, no hidden tasks.

