const weddingDate = new Date('2027-06-05T16:00:00-07:00');
const countdown = document.querySelector('#countdown');
const nav = document.querySelector('#main-nav');
document.querySelector('.menu-toggle').addEventListener('click', (event) => { const open = nav.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => nav.classList.remove('open')));
function updateCountdown() { const diff = Math.max(0, weddingDate - new Date()); const units = [['days', 86400000], ['hours', 3600000], ['minutes', 60000], ['seconds', 1000]]; countdown.innerHTML = units.map(([label, ms]) => `<div><strong>${String(Math.floor(diff / ms) % (label === 'days' ? Infinity : label === 'hours' ? 24 : 60)).padStart(2,'0')}</strong><span>${label}</span></div>`).join(''); }
updateCountdown(); setInterval(updateCountdown, 1000);
async function loadSchedule() { const list = document.querySelector('#schedule-list'); try { const csv = await fetch('/data/schedule.csv').then((res) => { if (!res.ok) throw new Error('Schedule unavailable'); return res.text(); }); const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => line.split(',').map((cell) => cell.trim())); list.innerHTML = rows.map(([date, time, title, location, description]) => `<article class="schedule-card"><div class="time">${date} · ${time}</div><h3>${title}</h3><p>${description}</p><p class="time">${location}</p></article>`).join(''); } catch { list.innerHTML = '<p class="loading">Schedule details are coming soon.</p>'; } }
loadSchedule();
const sections = [...document.querySelectorAll('.section-anchor')]; const links = [...nav.querySelectorAll('a')]; new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); } }), { rootMargin: '-35% 0px -55% 0px' }).observe(sections[0]); sections.slice(1).forEach((section) => new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)); }), { rootMargin: '-35% 0px -55% 0px' }).observe(section));

const storyTrack = document.querySelector('.story-track');
const storyBackdrop = document.querySelector('.story-backdrop');
const storyColor = document.querySelector('.story-color');
const storyWash = document.querySelector('.story-wash');
const storyCopy = document.querySelector('.story-copy');
const storyCouple = document.querySelector('.story-couple');
const storyDate = document.querySelector('.story-date');
const storyAddress = document.querySelector('.story-address');
const storyGallery = document.querySelector('.story-gallery');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const fade = (progress, start, end) => clamp((progress - start) / (end - start));
function renderStory() {
  if (!storyTrack) return;
  const bounds = storyTrack.getBoundingClientRect();
  const progress = clamp((window.innerHeight - bounds.top) / (bounds.height - window.innerHeight));
  const venueOut = fade(progress, .48, .68);
  const galleryIn = fade(progress, .62, .86);
  storyBackdrop.style.transform = `scale(${1.08 - progress * .08}) translateY(${-progress * 7}%)`;
  storyBackdrop.style.opacity = String(1 - venueOut);
  storyColor.style.opacity = String(fade(progress, .5, .72));
  storyWash.style.opacity = String(1 - fade(progress, .58, .78));
  storyCopy.style.transform = `translateY(calc(-50% + ${-progress * 7}vh))`;
  storyCouple.style.opacity = String(1 - fade(progress, .04, .2) * .9);
  storyDate.style.opacity = String(fade(progress, .13, .32) * (1 - fade(progress, .44, .62)));
  storyAddress.style.opacity = String(fade(progress, .3, .48) * (1 - fade(progress, .5, .66)));
  storyGallery.style.opacity = String(galleryIn);
  storyGallery.style.transform = `translateY(${(1 - galleryIn) * 22}vh) scale(${.9 + galleryIn * .1})`;
  requestAnimationFrame(() => { if (Math.abs(window.scrollY - lastStoryScroll) > 1) { lastStoryScroll = window.scrollY; renderStory(); } });
}
let lastStoryScroll = -1;
window.addEventListener('scroll', renderStory, { passive: true });
window.addEventListener('resize', renderStory);
renderStory();
