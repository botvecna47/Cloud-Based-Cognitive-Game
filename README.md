# MOUNT ADEPT — Cloud-Based Cognitive & Game-Based Assessment Platform

A production-grade **React 19 + TypeScript + Tailwind CSS** platform backed by **Supabase PostgreSQL & Row Level Security (RLS)**, unifying university cognitive aptitude practice suites and corporate recruitment assessment rounds (Capgemini, MNC aptitude) into a full-fledged cloud gaming experience.

---

## 🔒 Enterprise & Cloud Security Architecture (Supabase & Frontend)

The platform is designed following the **Principle of Least Privilege**, **OWASP ASVS Level 2 guidelines**, and defense-in-depth security standards:

1. **Row Level Security (RLS) & Multi-Tenant Data Isolation**:
   - Every single table (`profiles`, `game_sessions`, `session_level_records`, `user_high_scores`, `user_achievements`, `user_settings`) has RLS enforced.
   - Users can only read, write, and update their own game sessions and telemetry (`auth.uid() = user_id`).
   - Public leaderboards query a secure view (`leaderboard_view`) with `security_invoker = true` that only exposes non-sensitive player statistics (username, avatar, rank tier, total XP, high score).
2. **Anti-Tampering Trigger Architecture**:
   - Total XP, rank tier, and high scores are calculated and maintained server-side via PostgreSQL `BEFORE INSERT ON game_sessions` trigger with `SECURITY DEFINER` and hardened `SET search_path = public`.
   - Direct client modification of `total_xp`, `rank_tier`, or `games_played` on `public.profiles` is blocked by the `protect_profile_stats` trigger.
   - Internal trigger procedures have `REVOKE EXECUTE FROM public, anon, authenticated` to prevent direct invocation attacks.
3. **Database-Level Integrity Constraints & Input Validation**:
   - `username`: Enforced regex `^[a-zA-Z0-9_\-\.]{3,24}$` preventing XSS payloads and script tags.
   - `avatar_url`: Strict enum check against allowed avatar assets.
   - Numerical metrics: `score` (0-50,000), `accuracy_pct` (0-100), `duration_seconds` (1-7,200), and `time_taken_seconds` (0.01-600.00) are constrained with SQL `CHECK` bounds.
4. **Content Security Policy (CSP) & Client Hardening**:
   - Strict Content Security Policy meta tags in `index.html` preventing unauthorized script execution, inline injections, and clickjacking:
     - `default-src 'self'`
     - `script-src 'self'`
     - `connect-src 'self' https://*.supabase.co wss://*.supabase.co`
     - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`
   - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
   - Client-side input sanitization in `src/services/dbService.ts` and `src/context/AuthContext.tsx`.
5. **Zero Service-Role Leakage**:
   - The application strictly uses public `VITE_SUPABASE_ANON_KEY` and never exposes administrative `service_role` secrets on the client.
6. **Zero-Downtime Offline Sandbox Fallback**:
   - The application includes an intelligent local database engine. If Supabase is offline or environment credentials have not been configured yet, all features (authentication, sessions, achievements, telemetry, level records) operate smoothly in local sandbox mode and queue data safely without crashing.

---

## 🌟 Included Assessment Tracks & Games (12 Games Total)

### Track 1: Cognitive Aptitude Practice Arena
*(Modelled on university & corporate cognitive entrance assessments)*
1. **Target Sum**: Numerical agility — Select number tiles that add up exactly to the target number.
2. **Signal Sequence**: Working memory — Watch pads light up with synthesized audio tones, then repeat the exact order.
3. **Stack Sort (Tower of Hanoi)**: Planning & sequencing — Move disks between 3 pegs without placing a larger disk on a smaller one.
4. **Function Machine**: Logical reasoning — Deduce the hidden mathematical formula from 3 example pairs, then solve for the new input.
5. **Pixel Logic (Nonogram)**: Deductive reasoning — Fill grid cells based on row and column run-length clues.
6. **Matrix Complete**: Pattern recognition — Deduce the transformation from tile A to B, then complete the 2×2 analogy.

### Track 2: Game-Based Assessment Arena
*(Modelled on Capgemini & top MNC recruitment game rounds)*
7. **Digit Challenge**: Numerical reasoning — Place digits from a bank into arithmetic equation slots to balance both sides.
8. **Grid Challenge**: Working memory & multitasking — Memorize lit cells, solve an interstitial shape symmetry question, then recall the original cells.
9. **Motion Challenge**: Spatial planning — Navigate the red ball through a rock-filled maze to the target hole using on-screen buttons or keyboard Arrow Keys.
10. **Switch Challenge**: Decoding & logic — Understand how the switch transforms a sequence (reverse, shift, swap), then determine the output for a new sequence.
11. **Geo-Sudo**: Deductive logic — Latin-square sudoku with geometric shapes where no shape may repeat in any row or column.
12. **Inductive Challenge**: Pattern recognition — Spot the odd tile out that breaks the common attribute rule (shape, color, count, or fill).

---

## 🚀 Full-Fledged Game Features

- **Authentication System**:
  - Sign in and sign up with Supabase Auth (email & password).
  - One-click Guest Mode with instant play and option to link account later.
  - One-click Cadet Demo account for rapid evaluation.
- **Deep Granular Telemetry & History**:
  - Full session records with level-by-level timing (e.g. Level 1: 2.8s, Level 2: 4.1s), scores, and accuracy percentages.
  - Expandable history drawer with level-by-level breakdown.
  - Export all personal game telemetry to a downloadable JSON backup file.
- **Live Cloud Leaderboards**:
  - Global Hall of Fame with 1st, 2nd, 3rd place gold/silver/bronze podiums.
  - Filter leaderboards by overall player XP or specific individual games.
- **Cognitive Analytics & Readiness Dashboard**:
  - Multi-dimensional breakdown of 6 cognitive pillars: Numerical Agility, Working Memory, Planning, Logical Reasoning, Deductive Logic, Pattern Recognition.
  - Assessment Readiness Rating (*Placement Ready, Competitive Candidate, Intermediate, Foundational*).
  - Recent session performance timeline.
- **Badges & Trophy Room (16 Achievements)**:
  - Real-time achievement unlock toasts during sessions with fanfare audio and XP rewards.
  - Rank tier progression: **Bronze ➔ Silver ➔ Gold ➔ Platinum ➔ Diamond ➔ Master ➔ Grandmaster**.
- **In-Game HUD & Controls**:
  - Real-time countdown timer with warning pulse ($<60\text{s}$).
  - Live pause and resume modal.
  - Web Audio API synthesizer for interactive audio effects and toggleable mute.
  - Confetti victory celebrations on high-accuracy rounds.

---

## 🛠️ Step-by-Step Supabase Setup Guide

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.

### 2. Run the Schema Script in Supabase SQL Editor
1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation.
2. Open the file `supabase-schema.sql` from this repository.
3. Paste the contents into the SQL Editor and click **Run**.
4. This instantly sets up:
   - All 7 relational tables
   - Foreign keys and cascading deletes
   - Row Level Security (RLS) policies for defense-in-depth
   - Automatic user profile creation trigger (`handle_new_user`)
   - The 16 seed achievements catalogue

### 3. Configure Your `.env` File
Create a `.env` file in the project root (refer to `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```
*(Your URL and anon key are located under: Supabase Dashboard ➔ Project Settings ➔ API)*

---

## 💻 Running the Application

### Development Server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build:
```bash
npm run build
npm run preview
```
Open [http://localhost:4173](http://localhost:4173) in your browser.
