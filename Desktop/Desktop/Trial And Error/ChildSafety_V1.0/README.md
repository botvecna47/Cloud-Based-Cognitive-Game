## Project Guardian (Hackathon PoC)

**Implemented app:** see [`ProjectGuardian/README.md`](ProjectGuardian/README.md), **[`ProjectGuardian/MANUAL_STEPS.md`](ProjectGuardian/MANUAL_STEPS.md)** (all commands and manual steps for you to run), and [`ProjectGuardian/SNAPSHOT.doc`](ProjectGuardian/SNAPSHOT.doc) (update SNAPSHOT after **every** file change; you install deps yourself — nothing auto-installs).

This repository is a **proof-of-concept child-safety application** intended for **authorized parental supervision** and safe research.

### Important scope note
I can’t provide instructions/code for **stealth surveillance** behaviors such as:
- Global keylogging of arbitrary apps (e.g., capturing all keystrokes via `WH_KEYBOARD_LL`)
- Stealth persistence techniques (e.g., hidden logon persistence in obscure registry locations, task-scheduler SD deletion)
- Process camouflage (renaming to system binaries), invisibility tricks, or bypassing OS protections

Those techniques are commonly used for spyware and create a high risk of misuse.

What I *can* help you build here is a **consent-first** and **performance-efficient** Windows agent PoC that:
- Performs **screen OCR** on a **user-approved region/window** (Windows 10/11) to extract visible chat text
- Runs **adaptive sampling** to keep CPU low on low-end hardware
- Produces **safety insights** (e.g., grooming-risk heuristics) using on-device rules or a cloud service you control
- Uses **standard, visible startup** mechanisms appropriate for a parental-control app (and clear disclosure)

---

## Detailed execution plan (systems engineer)

### Phase 0 — Define the “authorized capture boundary” (must-have)
- **Consent model**: Decide how the child/parent authorizes monitoring:
  - Option A: Monitor only within your **own companion chat client** (safest).
  - Option B: Monitor only a **whitelisted window** the parent selects (via a visible UI).
  - Option C: Monitor only a **fixed on-screen region** (bounding box) the parent configures.
- **Data minimization**:
  - Capture **only what’s needed** for safety signals.
  - Prefer **on-device scoring** and upload only alerts/aggregates.
- **Threat model**:
  - Prevent third-party access to local logs (encryption at rest).
  - Protect network transit (TLS).

### Phase 1 — Windows Agent skeleton (.NET 8) (low overhead)
- **Process model**:
  - A single background process + a small UI/config tool (optional) for selecting allowed window/region.
  - Use `BackgroundService` (Worker Service template pattern) to host components.
- **Core modules** (keep each as a small class library):
  - `Capture.Orchestrator`: state machine, schedules capture cycles
  - `Capture.WindowTargeting`: identifies allowed window/region
  - `Capture.ScreenGrab`: captures pixels for that region
  - `Ocr.WindowsMediaOcr`: OCR pipeline
  - `Signals.RiskScoring`: lightweight heuristics; batches to cloud
  - `Storage.LocalQueue`: writes small encrypted event batches
  - `Transport.UploadClient`: async upload with backoff

### Phase 2 — Efficient “type-triggered” behavior without keylogging
Instead of capturing all keystrokes globally, use **non-invasive triggers**:
- **Foreground window change trigger**: start OCR only when the foreground window is in an allowed list.
- **Idle / activity trigger**: use OS activity signals (e.g., last input time) to avoid OCR when idle.
- **UI-state trigger** (best): check if the chat textbox area is visible (via UI Automation) before OCR.

Performance constraints for low-end hardware:
- **Sampling budget**: target 1–2 OCR runs/sec *only while* in an allowed window and user activity is detected; otherwise 0.
- **Debounce**: if the window/region hasn’t changed and OCR output is identical, skip processing.
- **Backpressure**: if OCR is still running, drop or coalesce new capture requests (never queue unbounded work).

### Phase 3 — OCR pipeline tuned for speed & accuracy
- **Region cropping**: OCR only the message panel region; avoid full-screen.
- **Image preprocessing** (fast):
  - Downscale to a max width (e.g., 1280) when the region is large.
  - Convert to grayscale; apply a simple contrast stretch.
  - Optional binarization thresholding if it improves your target UI.
- **Change detection**:
  - Compute a cheap hash (e.g., perceptual hash or block-wise checksum) of the region.
  - Run OCR only when hash changes beyond a threshold.
- **Text post-processing**:
  - Normalize whitespace, dedupe repeated frames, segment into “messages” heuristically.

### Phase 4 — Local security & integrity (non-stealth)
- **Encryption at rest**:
  - Use platform crypto (DPAPI) or a well-reviewed crypto library design; store only minimal data.
  - Rotate files; cap disk usage.
- **Tamper-evidence**:
  - Append-only log batches with HMAC to detect modification.

### Phase 5 — Cloud Brain (optional) & safety insights
- **API**:
  - Auth tokens per family/device; rate limit.
  - Upload batches of OCR text + metadata (timestamp, app/window label, region id).
- **Signals**:
  - Start with simple heuristics (grooming-phase keyword/intent patterns).
  - Add sentiment over time and relationship frequency graphs.
- **Parent dashboard**:
  - Show trends, flagged excerpts, and explainability (why it was flagged).

### Phase 6 — Startup/persistence (transparent + user-controlled)
- Use **standard**, user-visible startup methods appropriate for parental software:
  - Installer adds startup entry with clear labeling
  - Provide an in-app toggle to enable/disable startup
  - Provide uninstall instructions and logs export

---

## What’s next (one chunk per prompt)
Pick the first module to implement (safe scope). Good starting options:
- **Module A**: C# Worker Service skeleton + capture orchestrator (state machine + throttling)
- **Module B**: OCR wrapper using `Windows.Media.Ocr` + region screenshot capture + preprocessing
- **Module C**: Relationship / risk scoring algorithm (Python) that consumes OCR text events

Tell me which module you want first (A, B, or C), and your preferred UI target (Discord/WhatsApp/etc) and whether you want **window-whitelist** or **fixed region**.

