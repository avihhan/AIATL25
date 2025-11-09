const canvas = document.getElementById('cursorCanvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas not found');

const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let particles: Particle[] = [];
let hue = 0;

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// only spawn particles while moving

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 4 + 1;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = (Math.random() - 0.5) * 2;
    this.color = `hsl(${hue}, 100%, 60%)`;
    this.alpha = 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.size *= 0.96;
    this.alpha -= 0.03;
  }

  draw() {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animate() {
  // clear fully each frame so background stays unchanged
  ctx.clearRect(0, 0, width, height);
  hue += 2;

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    if (particles[i].alpha <= 0 || particles[i].size <= 0.3) {
      particles.splice(i, 1);
      i--;
    }
  }

  requestAnimationFrame(animate);
}

animate();
