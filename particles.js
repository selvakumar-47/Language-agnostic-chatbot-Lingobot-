/**
 * LingoBot Particle System
 * Renders a premium, dynamic backdrop of drifting, glowing language characters and translation symbols.
 * Reflects the multilingual, language-agnostic nature of the project.
 */

const LANG_CHARACTERS = [
  // English / Latin
  'A', 'Z', 'e', 'M', 'x', 'L', 'B', 't',
  // Spanish / Accents
  'ñ', 'á', '¿', '¡',
  // Devanagari (Hindi)
  'अ', 'क', 'म', 'ल', 'श', 'न', 'ह',
  // Hanzi (Chinese)
  '文', '语', '语', '世', '界', '中',
  // Hiragana / Katakana (Japanese)
  'あ', 'り', 'の', 'ル', 'ボ', 'ッ', 'ト',
  // Cyrillic (Russian)
  'Д', 'Ж', 'Я', 'Б', 'Ф',
  // Arabic
  'ع', 'ك', 'ت', 'ب', 'م',
  // Translation Symbols
  '🌐', '💬'
];

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationFrameId = null;
    this.resizeTimeout = null;

    this.initCanvasSize();
    this.bindEvents();
  }

  initCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.spawnParticles();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      // Debounce window resize
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.initCanvasSize();
      }, 200);
    });
  }

  spawnParticles() {
    this.particles = [];
    const count = this.getParticleCount();

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  getParticleCount() {
    const area = this.canvas.width * this.canvas.height;
    // Lower density for characters to keep it readable, subtle, and premium
    return Math.floor(area / 18000); 
  }

  createParticle(randomY = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const y = randomY ? Math.random() * h : h + 20;

    return {
      x: Math.random() * w,
      y: y,
      char: LANG_CHARACTERS[Math.floor(Math.random() * LANG_CHARACTERS.length)],
      // Font size: readable but subtle
      size: 10 + Math.random() * 16,
      alpha: 0.04 + Math.random() * 0.28,
      // Slow upward drifting
      speedY: -(0.06 + Math.random() * 0.12),
      speedX: (Math.random() - 0.5) * 0.05,
      // Dynamic colors matching the active theme (Cyan, Violet, Soft Whites)
      color: this.getRandomColor(),
      pulseSpeed: 0.0015 + Math.random() * 0.0035,
      pulseDir: Math.random() > 0.5 ? 1 : -1,
      wobble: Math.random() * Math.PI,
      wobbleSpeed: 0.002 + Math.random() * 0.005,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.003
    };
  }

  getRandomColor() {
    const colors = [
      '#00E5FF', // Highlighter Cyan
      '#0088FF', // Electric Blue
      '#ffffff', // Pure White
      '#a855f7', // Neon Purple
      '#e2e8f0'  // Slate Silver
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.particles.forEach((p, idx) => {
      // Gentle sine wave wobble horizontally
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * 0.05;
      p.y += p.speedY;

      // Update character rotation
      p.rotation += p.rotationSpeed;

      // Twinkling/glowing animation
      p.alpha += p.pulseDir * p.pulseSpeed;
      if (p.alpha > 0.45) {
        p.alpha = 0.45;
        p.pulseDir = -1;
      } else if (p.alpha < 0.04) {
        p.alpha = 0.04;
        p.pulseDir = 1;
      }

      // If particle drifts off screen, respawn at the bottom
      if (p.y < -20 || p.x < -20 || p.x > this.canvas.width + 20) {
        this.particles[idx] = this.createParticle(false);
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.font = `${p.size}px 'Outfit', 'Inter', sans-serif`;
      
      // Pivot translation and rotation
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Soft glow shadow matching the color
      this.ctx.shadowBlur = p.size * 0.6;
      this.ctx.shadowColor = p.color;

      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillText(p.char, 0, 0);

      this.ctx.restore();
    });
  }

  tick() {
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  start() {
    if (this.animationFrameId) return;
    this.tick();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
