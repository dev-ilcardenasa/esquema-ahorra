/* Utility: random */
const rand = (min, max) => Math.random() * (max - min) + min;

/* Cursor particles canvas */
const cursorCanvas = document.getElementById('canvas-cursor');
const cursorCtx = cursorCanvas.getContext('2d');
let cursorParticles = [];
function resizeCanvases() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  [cursorCanvas, confettiCanvas, fireworksCanvas].forEach((c) => {
    if (!c) return;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });
}

/* Confetti canvas */
const confettiCanvas = document.getElementById('canvas-confetti');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiPieces = [];
let confettiRainRate = 0; // pieces per second, adjusted based on performance

/* Fireworks canvas */
const fireworksCanvas = document.getElementById('canvas-fireworks');
const fireworksCtx = fireworksCanvas.getContext('2d');
let fireworks = [];

/* Sparkles floating */
const sparklesContainer = document.getElementById('sparkles');

/* Balloons */
const balloonsContainer = document.getElementById('balloons');

/* Hearts */
const heartsContainer = document.getElementById('hearts');
const giftsContainer = document.getElementById('gifts');

/* Typewriter */
const typewriterEl = document.getElementById('typewriter');
const specialMessage = document.getElementById('special-message');

/* Buttons */
const magicButton = document.getElementById('magic-button');
const musicButton = document.getElementById('music-button');
const welcomeOverlay = document.getElementById('welcome-overlay');
const startButton = document.getElementById('start-button');

/* Title editable attribute (optional editing) */
const mainTitle = document.getElementById('main-title');
mainTitle.setAttribute('contenteditable', 'true');
mainTitle.setAttribute('spellcheck', 'false');
mainTitle.title = 'Haz clic para editar el mensaje';

/* Day/Night based on local time */
function applyAutoTheme() {
  const hour = new Date().getHours();
  const isNight = hour < 7 || hour >= 20;
  document.body.classList.toggle('night', isNight);
}

/* Sparkles initial */
function spawnSparkles(count = 24) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 100}%`;
    el.style.animationDelay = `${Math.random() * 4}s`;
    sparklesContainer.appendChild(el);
  }
}

/* Balloons spawn */
const balloonColors = ['#f9a8d4', '#fde68a', '#fbcfe8', '#fef3c7', '#e9d5ff'];
function spawnBalloons(count = 10) {
  const vw = window.innerWidth;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'balloon';
    const color = balloonColors[i % balloonColors.length];
    b.style.background = `radial-gradient(circle at 30% 30%, ${color}, ${color} 60%, rgba(0,0,0,0.05))`;
    b.style.left = `${Math.random() * (vw - 60)}px`;
    const duration = rand(18, 28);
    b.style.animationDuration = `${duration}s`;
    b.style.opacity = String(rand(0.85, 1));
    balloonsContainer.appendChild(b);
  }
}

/* Hearts on click */
function spawnHeart(x, y) {
  const h = document.createElement('div');
  h.className = 'heart animate';
  h.style.left = `${x - 7}px`;
  h.style.top = `${y - 7}px`;
  h.style.background = `hsl(${Math.floor(rand(330, 360))}, 90%, 70%)`;
  heartsContainer.appendChild(h);
  setTimeout(() => h.remove(), 1200);
}
document.addEventListener('click', (e) => {
  spawnHeart(e.clientX, e.clientY);
});

/* Cursor particles trail */
document.addEventListener('mousemove', (e) => {
  cursorParticles.push({ x: e.clientX, y: e.clientY, vx: rand(-0.5, 0.5), vy: rand(-0.5, -1.2), life: 1, size: rand(1.5, 3), hue: rand(320, 360) });
});

function updateCursorParticles(dt) {
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  const gravity = 0.01;
  cursorParticles = cursorParticles.filter((p) => p.life > 0);
  for (const p of cursorParticles) {
    p.x += p.vx * 16 * dt; p.y += p.vy * 16 * dt; p.vy += gravity;
    p.life -= dt * 0.8;
    cursorCtx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${Math.max(p.life, 0)})`;
    cursorCtx.beginPath();
    cursorCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    cursorCtx.fill();
  }
}

/* Confetti rain */
function spawnConfettiBurst({ x, y, count = 120 } = {}) {
  // Pink palette
  const colors = ['#ffc0d9', '#f9a8d4', '#f472b6', '#fda4af', '#fecdd3', '#ffe4ef', '#ffd1e8'];
  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI, 0);
    confettiPieces.push({
      x: x ?? window.innerWidth / 2,
      y: y ?? window.innerHeight / 2,
      vx: Math.cos(angle) * rand(2, 6),
      vy: Math.sin(angle) * rand(2, 6),
      size: rand(3, 6),
      color: colors[i % colors.length],
      life: rand(1.2, 2.2),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.2, 0.2)
    });
  }
}

function updateConfetti(dt) {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  const g = 0.05;
  confettiPieces = confettiPieces.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
  for (const p of confettiPieces) {
    p.x += p.vx * 16 * dt;
    p.y += p.vy * 16 * dt;
    p.vy += g;
    p.rotation += p.rotationSpeed;
    p.life -= dt * 0.3;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
    confettiCtx.restore();
  }
}

/* Confetti gentle rain from top */
let confettiSpawnAccumulator = 0;
function spawnConfettiRain(dt) {
  confettiSpawnAccumulator += dt * confettiRainRate;
  // Pink palette
  const colors = ['#ffc0d9', '#f9a8d4', '#f472b6', '#fda4af', '#fecdd3', '#ffe4ef', '#ffd1e8'];
  while (confettiSpawnAccumulator >= 1) {
    confettiSpawnAccumulator -= 1;
    const x = Math.random() * window.innerWidth;
    confettiPieces.push({
      x,
      y: -10,
      vx: rand(-0.6, 0.6),
      vy: rand(1.4, 2.6),
      size: rand(3, 6),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: rand(2.2, 3.5),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.15, 0.15)
    });
  }
}

/* Fireworks temporary effect */
function launchFireworks() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let j = 0; j < 6; j++) {
    const parts = [];
    const hue = rand(0, 360);
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      parts.push({ x: cx, y: cy, vx: Math.cos(angle) * rand(2, 4), vy: Math.sin(angle) * rand(2, 4), life: rand(1, 1.6), hue });
    }
    fireworks.push(parts);
  }
  fireworksCanvas.classList.add('show');
  setTimeout(() => fireworksCanvas.classList.remove('show'), 3500);
}

function updateFireworks(dt) {
  fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  const drag = 0.99, g = 0.02;
  fireworks = fireworks.filter(parts => parts.some(p => p.life > 0));
  for (const parts of fireworks) {
    for (const p of parts) {
      p.x += p.vx * 16 * dt;
      p.y += p.vy * 16 * dt;
      p.vx *= drag; p.vy = p.vy * drag + g;
      p.life -= dt * 0.5;
      fireworksCtx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${Math.max(p.life, 0)})`;
      fireworksCtx.fillRect(p.x, p.y, 2, 2);
    }
  }
}

/* Gallery reveal */
function setupGalleryReveal() {
  const items = document.querySelectorAll('.gallery-item');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.2 });
  items.forEach(i => obs.observe(i));
}

/* Typewriter logic with cancellation to handle repeated clicks safely */
const messageText = "Gracias por tus abrazos que me reconfortan, tus consejos que me guían y tus sonrisas que alegran mi vida.\nEres mi fuerza, mi ejemplo y mi mayor bendición.\nCada día contigo es un regalo lleno de amor, enseñanzas y momentos inolvidables.\nTu dedicación y cariño me inspiran a ser mejor y a valorar lo que realmente importa.\nTe amo profundamente mamá, siempre serás mi refugio y mi luz ❤️";
let typewriterToken = 0;
async function runTypewriter(text) {
  const myToken = ++typewriterToken; // cancel any previous run
  typewriterEl.textContent = '';
  for (let i = 0; i < text.length; i++) {
    if (myToken !== typewriterToken) return; // another run started
    typewriterEl.textContent += text[i];
    await new Promise(r => setTimeout(r, text[i] === '\n' ? 250 : rand(18, 38)));
  }
}

/* YouTube background player */
let ytPlayer;
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('player', {
    videoId: 'VP7QLzPzXvQ',
    playerVars: {
      playsinline: 1,
      autoplay: 1, // start immediately (muted to satisfy policies)
      controls: 0,
      loop: 1,
      mute: 1,
      rel: 0,
      modestbranding: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        try {
          ytPlayer.mute();
          ytPlayer.setVolume(70);
          ytPlayer.playVideo();
        } catch {}
        // Unmute on first user interaction
        const unmuteOnce = () => {
          try { ytPlayer.unMute(); ytPlayer.setVolume(70); } catch {}
          window.removeEventListener('pointerdown', unmuteOnce);
          window.removeEventListener('keydown', unmuteOnce);
        };
        window.addEventListener('pointerdown', unmuteOnce, { once: true });
        window.addEventListener('keydown', unmuteOnce, { once: true });
      }
    }
  });
};

function handleVisibility() {
  if (!ytPlayer) return;
  const visible = !document.hidden;
  try {
    if (visible) {
      // Do not auto-play unless started before
      // noop
    } else {
      ytPlayer.pauseVideo && ytPlayer.pauseVideo();
    }
  } catch {}
}
document.addEventListener('visibilitychange', handleVisibility);

/* Music button */
musicButton.addEventListener('click', () => {
  try {
    if (!ytPlayer) return;
    const state = ytPlayer.getPlayerState ? ytPlayer.getPlayerState() : undefined;
    // If not playing, play and unmute
    if (state !== YT.PlayerState.PLAYING) {
      ytPlayer.playVideo();
      ytPlayer.unMute();
      ytPlayer.setVolume(70);
      return;
    }
    // If playing but muted, unmute
    if (ytPlayer.isMuted && ytPlayer.isMuted()) {
      ytPlayer.unMute();
      ytPlayer.setVolume(70);
      return;
    }
    // If playing and unmuted, pause
    ytPlayer.pauseVideo();
  } catch {}
});

/* Welcome overlay start */
function startExperience() {
  try {
    if (ytPlayer) {
      ytPlayer.playVideo();
      ytPlayer.unMute();
      ytPlayer.setVolume(70);
    }
  } catch {}
  if (welcomeOverlay) {
    welcomeOverlay.classList.add('overlay-hide');
    setTimeout(() => { welcomeOverlay.style.display = 'none'; }, 520);
  }
}
if (startButton) {
  startButton.addEventListener('click', startExperience);
}
// Also allow tapping anywhere on overlay to start
if (welcomeOverlay) {
  welcomeOverlay.addEventListener('pointerdown', (e) => {
    // avoid double if the button caught it
    if (e.target === welcomeOverlay) startExperience();
  });
}

/* Magic button actions */
let surpriseShown = false;
magicButton.addEventListener('click', () => {
  if (!surpriseShown) {
    specialMessage.classList.remove('hidden');
    // Start visual effects immediately
    spawnConfettiBurst();
    launchFireworks();
    rainGiftsAndBoostConfetti();
    // Run typewriter in background; mark as shown when finishes (only if not cancelled)
    const myToken = typewriterToken + 1;
    runTypewriter(messageText).then(() => {
      if (typewriterToken === myToken) {
        surpriseShown = true;
      }
    });
  } else {
    // Re-run typewriter quickly when clicked again
    runTypewriter(messageText);
    spawnConfettiBurst();
    launchFireworks();
    rainGiftsAndBoostConfetti();
  }
});

/* Main loop */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateCursorParticles(dt);
  spawnConfettiRain(dt);
  updateConfetti(dt);
  updateFireworks(dt);
  requestAnimationFrame(frame);
}

/* Init */
function init() {
  resizeCanvases();
  spawnSparkles(28);
  spawnBalloons(12);
  setupGalleryReveal();
  applyAutoTheme();
  // Set confetti rain rate based on viewport size (more pink confetti)
  const baseRate = 55; // per second baseline, increased for fuller effect
  const areaFactor = Math.min(1.8, Math.max(0.8, (window.innerWidth * window.innerHeight) / (1280 * 720)));
  confettiRainRate = baseRate * areaFactor;
  window.addEventListener('resize', resizeCanvases);
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', init);

/* Gifts rain + confetti boost */
function rainGiftsAndBoostConfetti() {
  const durationMs = 4500;
  const endAt = performance.now() + durationMs;
  const originalRate = confettiRainRate;
  confettiRainRate = originalRate * 2.5; // temporary boost
  const emojiOptions = ['🎁','🎀','💝','🍰','🎈','🌟'];

  function spawnGift() {
    if (!giftsContainer) return;
    const g = document.createElement('div');
    g.className = 'gift';
    g.style.left = `${Math.random() * (window.innerWidth - 42)}px`;
    g.style.top = `-60px`;
    g.style.animationDuration = `${rand(3.2, 5.5)}s`;
    g.style.animationDelay = '0s';
    const s = document.createElement('span');
    s.textContent = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
    g.appendChild(s);
    giftsContainer.appendChild(g);
    setTimeout(() => g.remove(), 7000);
  }

  // Spawn gifts frequently during the window
  const spawnInterval = setInterval(spawnGift, 120);
  // Stop and restore confetti after duration
  setTimeout(() => {
    clearInterval(spawnInterval);
    confettiRainRate = originalRate;
  }, durationMs);
}


