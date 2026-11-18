import confetti from 'canvas-confetti';

export function fireCelebration() {
  try {
    const count = 160;
    const defaults = {
      origin: { y: 0.72 },
      zIndex: 9999,
      colors: ['#171717', '#D9381E', '#787670', '#B82D16', '#ECE8DF'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.3, { spread: 34, startVelocity: 48 });
    fire(0.35, { spread: 68, decay: 0.92, scalar: 0.85 });
    fire(0.2, { spread: 100, startVelocity: 30, scalar: 1.05 });
    fire(0.15, { spread: 115, startVelocity: 42 });
  } catch {
    // ignore
  }
}
