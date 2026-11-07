// Respect the visitor's "reduce motion" setting everywhere below.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Nav: highlight the section currently in view.
const navAnchors = new Map(
  [...navLinks.querySelectorAll('a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a])
);
function setActiveNav(id) {
  navAnchors.forEach((a, key) => {
    const on = key === id;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}
const spy = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) setActiveNav(entry.target.id);
    else if (navAnchors.get(entry.target.id)?.classList.contains('active')) setActiveNav(null);
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navAnchors.forEach((a, id) => {
  const section = document.getElementById(id);
  if (section) spy.observe(section);
});
// The last section can be too short to reach the middle of the screen.
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    setActiveNav('contact');
  }
}, { passive: true });

// Dialogs. Story dialogs carry a data-hash so they can be linked: opening one sets
// e.g. #story-nbody in the address bar, and loading the page with that hash opens it.
const storyDialogs = [...document.querySelectorAll('dialog[data-hash]')];
const pushedFor = new Set(); // dialogs whose open added a history entry

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  const hash = dialog.dataset.hash && '#' + dialog.dataset.hash;
  if (hash && location.hash !== hash) {
    history.pushState(null, '', hash);
    pushedFor.add(dialog);
  }
}
function syncDialogsToHash() {
  const target = storyDialogs.find(d => '#' + d.dataset.hash === location.hash);
  storyDialogs.forEach(d => {
    if (d !== target && d.open) { pushedFor.delete(d); d.close(); }
  });
  if (target && !target.open) target.showModal();
}

document.querySelectorAll('[data-open-dialog]').forEach(btn => {
  btn.addEventListener('click', () => {
    const dialog = document.getElementById(btn.dataset.openDialog);
    if (dialog) openDialog(dialog);
  });
});
document.querySelectorAll('[data-close-dialog]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog')?.close());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });
  // Runs for every way a dialog can close (x button, backdrop, Esc).
  dialog.addEventListener('close', () => {
    const hash = dialog.dataset.hash && '#' + dialog.dataset.hash;
    if (!hash || location.hash !== hash) return;
    if (pushedFor.delete(dialog)) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  });
});
window.addEventListener('hashchange', syncDialogsToHash);
syncDialogsToHash(); // deep link on page load

// "Copy link" inside the story dialogs.
document.querySelectorAll('[data-copy-link]').forEach(btn => {
  if (!navigator.clipboard) { btn.hidden = true; return; }
  const labelEl = btn.querySelector('.dialog-copy-label');
  const label = labelEl.textContent;
  let resetTimer;
  btn.addEventListener('click', async () => {
    const dialog = btn.closest('dialog');
    const url = location.origin + location.pathname + '#' + dialog.dataset.hash;
    try {
      await navigator.clipboard.writeText(url);
      labelEl.textContent = 'Link copied';
      btn.classList.add('copied');
    } catch {
      labelEl.textContent = 'Copy from the address bar';
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      labelEl.textContent = label;
      btn.classList.remove('copied');
    }, 2000);
  });
});

// Growth strip: bars fill in when scrolled into view.
const growth = document.querySelector('.growth');
if (growth) {
  new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        growth.classList.add('in-view');
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 }).observe(growth);
}

// Videos: click-to-play. The YouTube player only loads when a thumbnail is clicked,
// so visiting the page doesn't contact YouTube's player. Without JS the thumbnail
// is a normal link to the video on YouTube.
let activeVideo = null;
document.querySelectorAll('.video-thumb').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    if (activeVideo) activeVideo.frame.replaceWith(activeVideo.link);
    const frame = document.createElement('div');
    frame.className = 'video-embed';
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(link.dataset.videoId) + '?autoplay=1&rel=0';
    iframe.title = link.dataset.videoTitle;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.appendChild(iframe);
    link.replaceWith(frame);
    activeVideo = { frame, link };
  });
});

// "Watch" links and project thumbnails: jump to the matching video and start it.
document.querySelectorAll('a[href^="#video-"]').forEach(link => {
  link.addEventListener('click', e => {
    const card = document.querySelector(link.getAttribute('href'));
    if (!card) return;
    e.preventDefault();
    card.querySelector('.video-thumb')?.click();
    card.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  });
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Starfield background. A slow shimmer drawn at ~20fps; static for visitors who
// asked for reduced motion; stops while the tab is hidden.
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let running = false;
let lastFrame = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const count = Math.floor((canvas.width * canvas.height) / 3500);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.3 + 0.2,
    phase: Math.random() * Math.PI * 2,
    // radians per millisecond: one slow shimmer every ~3-12 seconds
    speed: Math.random() * 0.0015 + 0.0005
  }));
  if (!running) paint(0);
}

function paint(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
    ctx.globalAlpha = 0.25 + twinkle * 0.75;
    ctx.fillStyle = '#e8e9f5';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function loop(time) {
  if (!running) return;
  if (time - lastFrame >= 50) { // ~20fps is plenty for a slow shimmer
    paint(time);
    lastFrame = time;
  }
  requestAnimationFrame(loop);
}
function startStars() {
  if (running || reduceMotion.matches || document.hidden) return;
  running = true;
  requestAnimationFrame(loop);
}
function stopStars() { running = false; }

window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => (document.hidden ? stopStars() : startStars()));
reduceMotion.addEventListener('change', () => {
  if (reduceMotion.matches) { stopStars(); paint(0); } else startStars();
});
resize();
paint(0);
startStars();
