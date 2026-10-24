# MOUNT ADEPT — Game-Based & Cognitive Aptitude Practice Arena (React)

A modern, high-performance **React + TypeScript + Tailwind CSS** platform unifying both cognitive aptitude practice suites into a single, cohesive training arena.

---

## 🌟 Included Assessment Tracks & Games (12 Games Total)

### Track 1: Cognitive Aptitude Practice Arena
*(Modelled on university & corporate cognitive entrance assessments)*
1. **Target Sum**: Numerical agility. Select number tiles that add up exactly to the target number.
2. **Signal Sequence**: Working memory. Watch pads light up with synthesized audio tones, then repeat the exact order.
3. **Stack Sort (Tower of Hanoi)**: Planning & sequencing. Move disks between 3 pegs without placing a larger disk on a smaller one.
4. **Function Machine**: Logical reasoning. Deduce the hidden mathematical formula from 3 example pairs, then solve for the new input.
5. **Pixel Logic (Nonogram)**: Deductive reasoning. Fill grid cells based on row and column run-length clues.
6. **Matrix Complete**: Pattern recognition. Deduce the transformation from tile A to B, then complete the 2×2 analogy.

### Track 2: Game-Based Assessment Arena
*(Modelled on Capgemini & top MNC recruitment game rounds)*
7. **Digit Challenge**: Numerical reasoning. Place digits from a bank into arithmetic equation slots to balance both sides.
8. **Grid Challenge**: Working memory & multitasking. Memorize lit cells, solve an interstitial shape symmetry question, then recall the original cells.
9. **Motion Challenge**: Spatial planning. Navigate the red ball through a rock-filled maze to the target hole using on-screen buttons or keyboard Arrow Keys.
10. **Switch Challenge**: Decoding & logic. Understand how the switch transforms a sequence (reverse, shift, swap), then determine the output for a new sequence.
11. **Geo-Sudo**: Deductive logic. Latin-square sudoku with geometric shapes where no shape may repeat in any row or column.
12. **Inductive Challenge**: Pattern recognition. Spot the odd tile out that breaks the common attribute rule (shape, color, count, or fill).

---

## 🚀 Features & Enhancements

- **3 Assessment Modes**:
  - **Track 1 Full Assessment**: 4 random Track 1 games back-to-back.
  - **Track 2 Full Assessment**: 4 random Track 2 games back-to-back.
  - **Grand Cognitive Marathon**: 6 random games across both tracks.
  - **Individual Practice**: Customizable session durations (3 min sprint, 6 min standard, 10 min deep dive).
- **In-Game HUD**: Live 6:00 countdown clock, dynamic progress bar with warning state (<60s), pause/resume, and real-time score tracker.
- **Scoring & Performance Index**:
  - Track 1 Performance Index out of 100 with qualitative bands (*Excellent, Strong, Fair, Keep practising*).
  - Track 2 Speed & Accuracy score formula ($Score = \frac{120 \times Level^2}{Time}$).
- **Web Audio API Sound Effects**: Interactive clicks, pleasant major chord chimes on correct answers, buzzer on errors, signal pad pitches, and victory fanfare (toggleable).
- **Persistent Analytics Dashboard**: Automatically saves history, total score, average accuracy, and high scores for each of the 12 games in `localStorage`.
- **Keyboard Controls**: Arrow keys and WASD support in Motion Challenge.
- **Confetti Celebration**: Visual reward on completing rounds with high accuracy.

---

## 💻 How to Run

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
