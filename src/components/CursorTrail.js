/**
 * CursorTrail.js
 * Easter Egg: Hold Shift to create diamond stardust trail
 */

const COLORS = ['#b87333', '#c4885c', '#4a6741', '#6b8b61']; // copper and moss
const DIAMOND = '◈';

let isShiftHeld = false;
let particles = [];
let animationFrame = null;

function createParticle(x, y) {
  const particle = document.createElement('span');
  particle.textContent = DIAMOND;
  particle.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    z-index: 99999;
    font-size: ${8 + Math.random() * 14}px;
    color: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
    opacity: 1;
    transform: translate(-50%, -50%);
    transition: none;
  `;
  document.body.appendChild(particle);
  
  return {
    el: particle,
    x,
    y,
    life: 1,
    decay: 0.02 + Math.random() * 0.02,
    drift: (Math.random() - 0.5) * 2,
    fall: Math.random() * 1.5
  };
}

function animate() {
  particles.forEach((p, i) => {
    p.life -= p.decay;
    p.x += p.drift;
    p.y += p.fall;
    
    // Twinkle effect
    const twinkle = 0.5 + Math.sin(Date.now() * 0.01 + i) * 0.5;
    p.el.style.opacity = p.life * twinkle;
    p.el.style.left = p.x + 'px';
    p.el.style.top = p.y + 'px';
    
    if (p.life <= 0) {
      p.el.remove();
    }
  });
  
  particles = particles.filter(p => p.life > 0);
  
  if (particles.length > 0 || isShiftHeld) {
    animationFrame = requestAnimationFrame(animate);
  } else {
    animationFrame = null;
  }
}

function onMouseMove(e) {
  if (!isShiftHeld) return;
  
  // Create 1-2 particles per move
  const count = Math.random() > 0.5 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    particles.push(createParticle(e.clientX + offsetX, e.clientY + offsetY));
  }
  
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(animate);
  }
}

function onKeyDown(e) {
  if (e.key === 'Shift' && !isShiftHeld) {
    isShiftHeld = true;
  }
}

function onKeyUp(e) {
  if (e.key === 'Shift') {
    isShiftHeld = false;
  }
}

export function initCursorTrail() {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}
