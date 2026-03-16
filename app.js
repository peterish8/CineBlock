// ==========================================
//  Prime Video UI — Interactive Logic
// ==========================================

/* ---------- NAV SCROLL SHADOW ---------- */
const topNav = document.getElementById('top-nav');
window.addEventListener('scroll', () => {
  topNav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ---------- NAV LINK ACTIVE STATE ---------- */
document.querySelectorAll('.nav-link[data-section]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

/* ---------- HERO ROTATOR ---------- */
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots   = document.querySelectorAll('.hero-dot');
let heroTimer = null;

function goToSlide(index) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function startAutoRotate() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => goToSlide(currentSlide + 1), 6000);
}

document.getElementById('hero-prev').addEventListener('click', () => {
  goToSlide(currentSlide - 1);
  startAutoRotate();
});
document.getElementById('hero-next').addEventListener('click', () => {
  goToSlide(currentSlide + 1);
  startAutoRotate();
});
dots.forEach(dot => {
  dot.addEventListener('click', () => {
    goToSlide(parseInt(dot.dataset.slide));
    startAutoRotate();
  });
});

startAutoRotate();

/* ---------- WATCHLIST TOGGLE ---------- */
document.querySelectorAll('.card-watchlist-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const addEl   = btn.querySelector('.watchlist-add');
    const checkEl = btn.querySelector('.watchlist-check');
    const isAdded = addEl.style.display === 'none';
    addEl.style.display   = isAdded ? '' : 'none';
    checkEl.style.display = isAdded ? 'none' : '';
    btn.style.borderColor = isAdded ? 'rgba(255,255,255,0.4)' : '#1DB954';
  });
});

/* ---------- CAROUSEL SCROLL ARROWS ---------- */
function setupCarousel(trackId, prevId, nextId) {
  const track = document.getElementById(trackId);
  const prev  = document.getElementById(prevId);
  const next  = document.getElementById(nextId);
  if (!track || !prev || !next) return;
  const scrollAmount = () => track.offsetWidth * 0.7;
  prev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
}
setupCarousel('track-0', 'carousel-prev-0', 'carousel-next-0');
setupCarousel('track-1', 'carousel-prev-1', 'carousel-next-1');
setupCarousel('track-2', 'carousel-prev-2', 'carousel-next-2');

/* ---------- VIDEO PLAYER ---------- */
const playerOverlay = document.getElementById('player-overlay');
const playerBack    = document.getElementById('player-back');
const playerBtn     = document.getElementById('player-play-pause');
const ppIcon        = document.getElementById('play-pause-icon');
const scrubber      = document.getElementById('player-scrubber');
const currentTimeEl = document.getElementById('current-time');
const xrayToggle    = document.getElementById('xray-toggle');
const xrayPanel     = document.getElementById('xray-panel');
const xrayTabs      = document.querySelectorAll('.xray-tab');
const playerTitleBar= document.getElementById('player-title-bar');

let isPlaying = false;
let playerInterval = null;

const PLAY_ICON = `<polygon points="5,3 19,12 5,21" fill="white"/>`;
const PAUSE_ICON = `<rect x="5" y="4" width="4" height="16" rx="1" fill="white"/><rect x="15" y="4" width="4" height="16" rx="1" fill="white"/>`;

function openPlayer(title) {
  playerTitleBar.textContent = title || 'Prime Video';
  playerOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  isPlaying = true;
  ppIcon.innerHTML = PAUSE_ICON;
  startPlayerProgress();
}

function closePlayer() {
  playerOverlay.style.display = 'none';
  document.body.style.overflow = '';
  isPlaying = false;
  clearInterval(playerInterval);
  xrayPanel.style.display = 'none';
}

function startPlayerProgress() {
  clearInterval(playerInterval);
  playerInterval = setInterval(() => {
    if (!isPlaying) return;
    const val = Math.min(parseInt(scrubber.value) + 0.1, 100);
    scrubber.value = val;
    // Update time display
    const total = 58 * 60 + 42;
    const current = Math.round((val / 100) * total);
    const m = Math.floor(current / 60).toString().padStart(2,'0');
    const s = (current % 60).toString().padStart(2,'0');
    currentTimeEl.textContent = `${m}:${s}`;
  }, 300);
}

// Open player on play buttons
document.querySelectorAll('.btn-play-hero, .card-play-btn:not(.tvod-play)').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const slide = btn.closest('.hero-slide');
    const card  = btn.closest('.content-card');
    let title = 'Prime Video';
    if (slide) {
      const t = slide.querySelector('.hero-main-title');
      if (t) title = t.innerText;
    } else if (card) {
      const t = card.querySelector('.card-meta-title');
      if (t) title = t.textContent;
    }
    openPlayer(title);
  });
});

playerBack.addEventListener('click', closePlayer);

// Play/Pause toggle
playerBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  ppIcon.innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
});

// Scrubber
scrubber.addEventListener('input', () => {
  const total = 58 * 60 + 42;
  const current = Math.round((scrubber.value / 100) * total);
  const m = Math.floor(current / 60).toString().padStart(2,'0');
  const s = (current % 60).toString().padStart(2,'0');
  currentTimeEl.textContent = `${m}:${s}`;
});

// Rewind/Forward
document.getElementById('player-rewind').addEventListener('click', () => {
  scrubber.value = Math.max(0, parseInt(scrubber.value) - 3);
  scrubber.dispatchEvent(new Event('input'));
});
document.getElementById('player-forward').addEventListener('click', () => {
  scrubber.value = Math.min(100, parseInt(scrubber.value) + 3);
  scrubber.dispatchEvent(new Event('input'));
});

// X-Ray toggle
xrayToggle.addEventListener('click', () => {
  const visible = xrayPanel.style.display !== 'none';
  xrayPanel.style.display = visible ? 'none' : 'block';
});

// X-Ray tabs
xrayTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    xrayTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById('xray-content');
    if (tab.id === 'xray-cast-tab') {
      content.innerHTML = `<div class="xray-cast-row">
        <div class="xray-actor"><div class="xray-avatar" style="background:#2a4a7f">M</div><div class="xray-name">Morfydd Clark</div></div>
        <div class="xray-actor"><div class="xray-avatar" style="background:#4a2a7f">C</div><div class="xray-name">Charlie Vickers</div></div>
        <div class="xray-actor"><div class="xray-avatar" style="background:#7f4a2a">R</div><div class="xray-name">Robert Aramayo</div></div>
        <div class="xray-actor"><div class="xray-avatar" style="background:#2a7f4a">I</div><div class="xray-name">Ismael Cruz</div></div>
      </div>`;
    } else if (tab.id === 'xray-trivia-tab') {
      content.innerHTML = `<p style="font-size:12px;color:#b0bec5;line-height:1.6;">The show used over 2,000 hand-crafted props. The language Quenya was refined with Tolkien scholar David Salo for linguistic authenticity.</p>`;
    } else {
      content.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#1a3a6c,#2a5fa0);display:flex;align-items:center;justify-content:center;font-size:18px;">♪</div><div><div style="font-size:13px;color:white;font-weight:600;">Bear McCreary</div><div style="font-size:11px;color:#b0bec5;">Rings of Power (Main Theme)</div></div></div>`;
    }
  });
});

// Keyboard controls
document.addEventListener('keydown', e => {
  if (playerOverlay.style.display === 'none') return;
  if (e.code === 'Escape') closePlayer();
  if (e.code === 'Space') {
    e.preventDefault();
    playerBtn.click();
  }
  if (e.code === 'ArrowLeft') document.getElementById('player-rewind').click();
  if (e.code === 'ArrowRight') document.getElementById('player-forward').click();
});

// Auto-hide controls in player
let hideTimer;
function showControls() {
  document.getElementById('player-ui').style.opacity = '1';
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (isPlaying) document.getElementById('player-ui').style.opacity = '0';
  }, 3000);
}
playerOverlay.addEventListener('mousemove', showControls);
playerOverlay.addEventListener('click', showControls);
