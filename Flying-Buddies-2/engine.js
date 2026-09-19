/* Pure game rules. No DOM, network, or frame-rate-dependent physics. */
(function (root) {
  'use strict';
  const MODES = Object.freeze({
    easy: { label: 'Easy', speed: 125, gap: 240, spacing: 270 },
    classic: { label: 'Classic', speed: 150, gap: 210, spacing: 265 },
    hard: { label: 'Hard', speed: 180, gap: 180, spacing: 260 }
  });
  class FlightEngine {
    constructor({ width = 420, height = 700, difficulty = 'classic', random = Math.random } = {}) {
      this.width = width;
      this.height = height;
      this.mode = MODES[difficulty] || MODES.classic;
      this.random = random;
      this.gravity = 1000;
      this.impulse = -335;
      this.radius = 17;
      this.pipeWidth = 66;
      this.groundHeight = 38;
      this.reset();
    }
    reset() {
      this.state = 'ready';
      this.elapsed = 0;
      this.score = 0;
      this.distance = 0;
      this.pipes = [];
      this.player = { x: this.width * .27, y: this.height * .38, vy: 0 };
      this.spawnDistance = -80;
      this.lastGap = this.height * .43;
    }
    flap() {
      if (this.state === 'ready') this.state = 'playing';
      if (this.state !== 'playing') return false;
      this.player.vy = this.impulse;
      return true;
    }
    pause() {
      if (this.state !== 'playing' && this.state !== 'ready') return false;
      this.beforePause = this.state;
      this.state = 'paused';
      return true;
    }
    resume() {
      if (this.state !== 'paused') return false;
      this.state = this.beforePause || 'playing';
      return true;
    }
    get scene() { return Math.floor((this.elapsed + 1e-8) / 20) % 2; }
    get gapSize() { return Math.min(this.mode.gap, this.height * .36); }
    addPipe() {
      const half = this.gapSize / 2;
      const min = 92 + half;
      const max = this.height - this.groundHeight - 70 - half;
      const lower = Math.max(min, this.lastGap - 95);
      const upper = Math.min(max, this.lastGap + 95);
      const center = lower + this.random() * Math.max(0, upper - lower);
      this.lastGap = center;
      this.pipes.push({ x: this.width + 14, top: center - half, bottom: center + half, passed: false });
    }
    intersectsRect(x, y, width, height) {
      const p = this.player;
      const nearX = Math.max(x, Math.min(p.x, x + width));
      const nearY = Math.max(y, Math.min(p.y, y + height));
      return (p.x - nearX) ** 2 + (p.y - nearY) ** 2 < this.radius ** 2;
    }
    update(dt) {
      if (this.state !== 'playing') return;
      // The renderer uses 1/120 s steps. Clamping also protects other callers.
      dt = Math.min(Math.max(dt, 0), 1 / 30);
      this.elapsed += dt;
      const move = this.mode.speed * dt;
      this.distance += move;
      this.spawnDistance += move;
      this.player.vy += this.gravity * dt;
      this.player.y += this.player.vy * dt;
      if (!this.pipes.length && this.spawnDistance >= 0) {
        this.addPipe();
        this.spawnDistance = 0;
      } else if (this.spawnDistance >= this.mode.spacing) {
        this.addPipe();
        this.spawnDistance -= this.mode.spacing;
      }
      for (const pipe of this.pipes) pipe.x -= move;
      // Only the visible ground line and a forgiving core hitbox count.
      let hit = this.player.y - this.radius < 0 || this.player.y + this.radius > this.height - this.groundHeight;
      for (const pipe of this.pipes) {
        if (this.intersectsRect(pipe.x, 0, this.pipeWidth, pipe.top) ||
            this.intersectsRect(pipe.x - 5, pipe.top - 23, this.pipeWidth + 10, 23) ||
            this.intersectsRect(pipe.x, pipe.bottom, this.pipeWidth, this.height - pipe.bottom) ||
            this.intersectsRect(pipe.x - 5, pipe.bottom, this.pipeWidth + 10, 23)) hit = true;
      }
      if (hit) { this.state = 'over'; return; }
      for (const pipe of this.pipes) {
        if (!pipe.passed && pipe.x + this.pipeWidth + 5 < this.player.x - this.radius) {
          pipe.passed = true;
          this.score += 1;
        }
      }
      this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth + 5 > -10);
    }
  }
  root.FlyingBuddiesEngine = { FlightEngine, MODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FlyingBuddiesEngine;
})(typeof window !== 'undefined' ? window : globalThis);
