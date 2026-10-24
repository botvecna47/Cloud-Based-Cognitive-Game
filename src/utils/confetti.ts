import confetti from 'canvas-confetti';

export function fireCelebration() {
  try {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#20B8CF', '#128FB0', '#ffffff'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#2f6fed', '#1f9d6d', '#ffd76b'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#e23b57', '#8b5cf6', '#20B8CF'],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  } catch {
    // ignore
  }
}
