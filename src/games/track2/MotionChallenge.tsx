import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

function bfs(start: number, target: number, rocks: Set<number>, n: number): number {
  const queue: [number, number][] = [[start, 0]];
  const seen = new Set<number>([start]);

  while (queue.length) {
    const [cur, dist] = queue.shift()!;
    if (cur === target) return dist;

    const r = Math.floor(cur / n);
    const c = cur % n;

    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
      const np = nr * n + nc;
      if (rocks.has(np) || seen.has(np)) continue;
      seen.add(np);
      queue.push([np, dist + 1]);
    }
  }

  return -1;
}

export const MotionChallenge: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const n = Math.min(4 + Math.floor((L - 1) / 2), 7);
  const total = n * n;

  const puzzle = useMemo(() => {
    let ball = 0;
    let hole = total - 1;
    let rocks = new Set<number>();

    for (let attempts = 0; attempts < 300; attempts++) {
      ball = Math.floor(Math.random() * total);
      hole = Math.floor(Math.random() * total);
      if (ball === hole) continue;

      rocks = new Set<number>();
      const rockCount = Math.min(2 + L, Math.floor(total * 0.28));
      while (rocks.size < rockCount) {
        const r = Math.floor(Math.random() * total);
        if (r !== ball && r !== hole) {
          rocks.add(r);
        }
      }

      const shortestPath = bfs(ball, hole, rocks, n);
      if (shortestPath >= 2) {
        return { n, ball, hole, rocks, shortestPath };
      }
    }

    return { n, ball: 0, hole: total - 1, rocks: new Set<number>(), shortestPath: n * 2 - 2 };
  }, [L, n, total]);

  const [ballPos, setBallPos] = useState<number>(puzzle.ball);
  const [moves, setMoves] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);

  useEffect(() => {
    setBallPos(puzzle.ball);
    setMoves(0);
    setHasWon(false);
  }, [puzzle]);

  const move = useCallback(
    (dr: number, dc: number) => {
      if (hasWon) return;

      const r = Math.floor(ballPos / puzzle.n);
      const c = ballPos % puzzle.n;
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nc < 0 || nr >= puzzle.n || nc >= puzzle.n) return;
      const nextPos = nr * puzzle.n + nc;
      if (puzzle.rocks.has(nextPos)) return;

      sound.playClick();
      setBallPos(nextPos);
      setMoves(m => m + 1);

      if (nextPos === puzzle.hole) {
        setHasWon(true);
        sound.playCorrect();
        setTimeout(() => {
          api.correct();
        }, 300);
      }
    },
    [ballPos, hasWon, puzzle, api]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move(-1, 0);
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move(1, 0);
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move(0, -1);
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move(0, 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          Guide the red ball to the <span className="text-cyan-400 font-bold">◎ Target Hole</span>:
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-sm text-slate-400">
            Moves: <strong className="text-white font-mono text-base">{moves}</strong>
          </span>
          <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-md">
            Optimal: ~{puzzle.shortestPath} moves
          </span>
        </div>
      </div>

      {/* Maze Grid */}
      <div className="p-3 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl">
        <div
          className="grid gap-1.5 sm:gap-2 select-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.n}, minmax(42px, 52px))` }}
        >
          {Array.from({ length: total }).map((_, i) => {
            const isBall = ballPos === i;
            const isHole = puzzle.hole === i;
            const isRock = puzzle.rocks.has(i);

            let content = null;
            let cellStyle = 'bg-slate-800/90 border-slate-700/60';

            if (isRock) {
              cellStyle = 'bg-slate-700 border-slate-600 shadow-inner cursor-not-allowed';
              content = <div className="w-4 h-4 rounded bg-slate-600/90" />;
            } else if (isBall) {
              cellStyle = 'bg-slate-800 border-rose-500/50';
              content = (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-600 border-2 border-white shadow-lg shadow-rose-500/50 animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/70" />
                </div>
              );
            } else if (isHole) {
              cellStyle = 'bg-slate-950 border-cyan-500/70 shadow-inner';
              content = (
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-cyan-400 flex items-center justify-center text-cyan-400 text-base font-bold animate-spin-slow">
                  ◎
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl border-2 flex items-center justify-center transition-all ${cellStyle}`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* On-Screen D-Pad & Controls */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => move(-1, 0)}
          aria-label="Move up"
          className="w-14 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl border border-slate-700 hover:border-cyan-400 active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center"
        >
          ↑
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => move(0, -1)}
            aria-label="Move left"
            className="w-14 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl border border-slate-700 hover:border-cyan-400 active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center"
          >
            ←
          </button>
          <button
            onClick={() => move(1, 0)}
            aria-label="Move down"
            className="w-14 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl border border-slate-700 hover:border-cyan-400 active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center"
          >
            ↓
          </button>
          <button
            onClick={() => move(0, 1)}
            aria-label="Move right"
            className="w-14 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl border border-slate-700 hover:border-cyan-400 active:scale-95 transition-all shadow cursor-pointer flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>

      <div className="text-slate-400 text-xs text-center">
        Tip: You can also use the Arrow Keys or W / A / S / D on your keyboard.
      </div>
    </div>
  );
};
