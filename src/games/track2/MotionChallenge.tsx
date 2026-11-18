import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const winTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setBallPos(puzzle.ball);
    setMoves(0);
    setHasWon(false);
    return () => {
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    };
  }, [puzzle]);

  const move = useCallback(
    (dr: number, dc: number) => {
      if (hasWon || api.isPaused) return;

      const r = Math.floor(ballPos / puzzle.n);
      const c = ballPos % puzzle.n;
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nc < 0 || nr >= puzzle.n || nc >= puzzle.n) return;
      const nextPos = nr * puzzle.n + nc;
      if (puzzle.rocks.has(nextPos)) return;

      sound.playClick();
      const nextMoves = moves + 1;
      setBallPos(nextPos);
      setMoves(nextMoves);

      if (nextPos === puzzle.hole) {
        setHasWon(true);
        sound.playCorrect();
        winTimeoutRef.current = window.setTimeout(() => {
          api.correct({ moves: nextMoves });
        }, 300);
      }
    },
    [ballPos, hasWon, moves, puzzle, api]
  );

  // Keyboard navigation (disabled when paused or typing in inputs/modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (api.isPaused) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

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
  }, [move, api.isPaused]);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-ink text-base sm:text-lg font-medium">
          Navigate the vermilion marker to the{' '}
          <span className="font-mono font-bold text-vermilion">◎ Target</span>:
        </p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="font-mono text-xs text-ink-secondary tabular-nums">
            Moves: <strong className="text-ink text-sm">{moves}</strong>
          </span>
          <span className="font-mono text-[11px] text-ink-muted bg-paper border border-hairline px-2.5 py-0.5 rounded-md tabular-nums">
            Optimal: ~{puzzle.shortestPath}
          </span>
        </div>
      </div>

      {/* Maze Grid (fluid responsive sizing so 4x4..7x7 fits cleanly on 320px phones) */}
      <div className="p-2.5 sm:p-5 bg-paper rounded-xl border border-hairline w-full max-w-[360px]">
        <div
          className="grid gap-1 sm:gap-2 select-none w-full"
          style={{ gridTemplateColumns: `repeat(${puzzle.n}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: total }).map((_, i) => {
            const isBall = ballPos === i;
            const isHole = puzzle.hole === i;
            const isRock = puzzle.rocks.has(i);

            let content = null;
            let cellStyle = 'bg-surface border-hairline';

            if (isRock) {
              cellStyle = 'bg-ink border-ink cursor-not-allowed';
              content = <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-ink-secondary" />;
            } else if (isBall) {
              cellStyle = 'bg-vermilion-wash border-vermilion';
              content = (
                <div className="w-[70%] h-[70%] rounded-full bg-vermilion border-2 border-ink flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-surface" />
                </div>
              );
            } else if (isHole) {
              cellStyle = 'bg-recessed border-ink border-dashed';
              content = (
                <div className="w-[74%] h-[74%] rounded-full border-2 border-dashed border-ink flex items-center justify-center text-vermilion font-mono text-xs sm:text-base font-bold leading-none">
                  ◎
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-[background-color,border-color] duration-150 ${cellStyle}`}
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
          type="button"
          onClick={() => move(-1, 0)}
          aria-label="Move up"
          className="w-14 h-12 rounded-xl bg-surface hover:bg-recessed text-ink font-mono font-bold text-xl border border-hairline hover:border-ink transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center"
        >
          ↑
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => move(0, -1)}
            aria-label="Move left"
            className="w-14 h-12 rounded-xl bg-surface hover:bg-recessed text-ink font-mono font-bold text-xl border border-hairline hover:border-ink transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => move(1, 0)}
            aria-label="Move down"
            className="w-14 h-12 rounded-xl bg-surface hover:bg-recessed text-ink font-mono font-bold text-xl border border-hairline hover:border-ink transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => move(0, 1)}
            aria-label="Move right"
            className="w-14 h-12 rounded-xl bg-surface hover:bg-recessed text-ink font-mono font-bold text-xl border border-hairline hover:border-ink transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center"
          >
            →
          </button>
        </div>
      </div>

      <p className="text-ink-muted text-xs text-center">
        Use Arrow Keys or W / A / S / D to navigate faster.
      </p>
    </div>
  );
};
