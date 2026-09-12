/**
 * PulseRender - Real FPS & Frame-Time Calculator
 *
 * Measures actual frame duration and rate via requestAnimationFrame timestamp deltas.
 * Uses a rolling 60-frame buffer to provide stable, real-time statistics.
 */

const BUFFER_SIZE = 60;

export class FpsCalculator {
  private frameDeltas: number[] = [];
  private lastTimestamp = 0;

  recordFrame(now: number): void {
    if (this.lastTimestamp > 0) {
      const delta = now - this.lastTimestamp;
      if (delta > 0 && delta < 1000) { // Ignore background tab pauses
        this.frameDeltas.push(delta);
        if (this.frameDeltas.length > BUFFER_SIZE) {
          this.frameDeltas.shift();
        }
      }
    }
    this.lastTimestamp = now;
  }

  getMetrics(): { fps: number; minFps: number; avgFrameMs: number; worstFrameMs: number } {
    if (this.frameDeltas.length === 0) {
      return { fps: 60, minFps: 60, avgFrameMs: 16.67, worstFrameMs: 16.67 };
    }

    let sum = 0;
    let worst = 0;

    for (let i = 0; i < this.frameDeltas.length; i++) {
      const d = this.frameDeltas[i];
      sum += d;
      if (d > worst) worst = d;
    }

    const avgFrameMs = sum / this.frameDeltas.length;
    const currentFps = Math.min(60, Math.max(0, 1000 / avgFrameMs));
    const worstFrameMs = worst;
    const minFps = worst > 0 ? Math.min(60, Math.max(0, 1000 / worst)) : currentFps;

    return {
      fps: Number(currentFps.toFixed(1)),
      minFps: Number(minFps.toFixed(1)),
      avgFrameMs: Number(avgFrameMs.toFixed(1)),
      worstFrameMs: Number(worstFrameMs.toFixed(1)),
    };
  }

  reset(): void {
    this.frameDeltas = [];
    this.lastTimestamp = 0;
  }
}
