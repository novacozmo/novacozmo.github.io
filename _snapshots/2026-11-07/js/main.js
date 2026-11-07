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

// Dialogs (dev story, etc.)
document.querySelectorAll('[data-open-dialog]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.openDialog)?.showModal();
  });
});
document.querySelectorAll('[data-close-dialog]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog')?.close());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });
});

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
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Starfield background
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const count = Math.floor((canvas.width * canvas.height) / 3500);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.3 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.015 + 0.005
  }));
}

function draw(time) {
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
  requestAnimationFrame(draw);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(draw);
