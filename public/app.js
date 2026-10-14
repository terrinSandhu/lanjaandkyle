const weddingDate = new Date('2027-06-05T16:00:00-07:00');
const countdown = document.querySelector('#countdown');
const nav = document.querySelector('#main-nav');
const railLinks = [...document.querySelectorAll('.section-rail-link')];
const mainLinks = [...nav.querySelectorAll('a')];

document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  const open = nav.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});
mainLinks.forEach((link) => link.addEventListener('click', () => nav.classList.remove('open')));

function updateCountdown() {
  const diff = Math.max(0, weddingDate - new Date());
  const units = [['days', 86400000], ['hours', 3600000], ['minutes', 60000], ['seconds', 1000]];
  countdown.innerHTML = units.map(([label, ms]) => `<div><strong>${String(Math.floor(diff / ms) % (label === 'days' ? Infinity : label === 'hours' ? 24 : 60)).padStart(2, '0')}</strong><span>${label}</span></div>`).join('');
}
updateCountdown();
setInterval(updateCountdown, 1000);

const icons = {
  ceremony: '<svg viewBox="0 0 24 24"><path d="M4 20h16M6 20V9l6-5 6 5v11M9 20v-5h6v5M3 9h18M12 4V2"/></svg>',
  welcome: '<svg viewBox="0 0 24 24"><path d="M4 20h16M5 20V9h14v11M8 9V5h8v4M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
  reception: '<svg viewBox="0 0 24 24"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 10v11M16 3v18M16 3c2 1 3 3 3 5h-3"/></svg>',
  default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>'
};

async function loadSchedule() {
  const list = document.querySelector('#schedule-list');
  try {
    const csv = await fetch('/data/schedule.csv').then((res) => { if (!res.ok) throw new Error('Schedule unavailable'); return res.text(); });
    const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => line.split(',').map((cell) => cell.trim()));
    list.innerHTML = rows.map(([date, time, title, location, description]) => {
      const icon = /ceremony/i.test(title) ? icons.ceremony : /welcome/i.test(title) ? icons.welcome : /reception/i.test(title) ? icons.reception : icons.default;
      return `<article class="schedule-card reveal" role="button" tabindex="0"><span class="line-icon schedule-icon" aria-hidden="true">${icon}</span><div class="time">${date} · ${time}</div><h3>${title}</h3><p>${description}</p><p class="time">${location}</p></article>`;
    }).join('');
    observeReveals(list);
  } catch { list.innerHTML = '<p class="loading">Schedule details are coming soon.</p>'; }
}
loadSchedule();

function setActiveSection(id) {
  [...mainLinks, ...railLinks].forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
}
const sections = [...document.querySelectorAll('.section-anchor')];
const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); }), { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => sectionObserver.observe(section));

function observeReveals(root = document) {
  const items = [...root.querySelectorAll('.reveal:not(.is-visible)')];
  if (!items.length) return;
  const observer = new IntersectionObserver((entries, current) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); current.unobserve(entry.target); } }), { threshold: .15 });
  items.forEach((item) => observer.observe(item));
}
document.querySelectorAll('.section-heading, .split-copy, .hotel-list, .registry-card, .gallery-card, .faq-list').forEach((item) => item.classList.add('reveal'));
observeReveals();

const storyTrack = document.querySelector('.story-track');
const storyBackdrop = document.querySelector('.story-backdrop');
const storyColor = document.querySelector('.story-color');
const storyWash = document.querySelector('.story-wash');
const storyCopy = document.querySelector('.story-copy');
const storyCouple = document.querySelector('.story-couple');
const storyDate = document.querySelector('.story-date');
const storyAddress = document.querySelector('.story-address');
const storyGallery = document.querySelector('.story-gallery');
const storyFocal = document.querySelector('.story-focal');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const fade = (progress, start, end) => clamp((progress - start) / (end - start));
let targetStoryProgress = 0;
let storyProgress = 0;
let storyFrame = 0;
function measureStory() {
  if (!storyTrack) return;
  const bounds = storyTrack.getBoundingClientRect();
  targetStoryProgress = clamp((window.innerHeight - bounds.top) / (bounds.height - window.innerHeight));
  if (!storyFrame) storyFrame = requestAnimationFrame(animateStory);
}
function animateStory() {
  storyProgress += (targetStoryProgress - storyProgress) * .14;
  const progress = storyProgress;
  const venueOut = fade(progress, .48, .68);
  const galleryIn = fade(progress, .62, .86);
  storyBackdrop.style.transform = `translate(-50%, -50%) scale(${1.08 - progress * .08}) rotate(${(progress - .5) * 1.8}deg)`;
  storyBackdrop.style.opacity = String(1 - venueOut);
  storyColor.style.opacity = String(fade(progress, .5, .72));
  storyWash.style.opacity = String(1 - fade(progress, .58, .78));
  storyCopy.style.transform = `translate(-50%, calc(-50% + ${-progress * 7}vh))`;
  storyCouple.style.opacity = String(1 - fade(progress, .04, .2) * .9);
  storyDate.style.opacity = String(fade(progress, .13, .32) * (1 - fade(progress, .44, .62)));
  storyAddress.style.opacity = String(fade(progress, .3, .48) * (1 - fade(progress, .5, .66)));
  storyGallery.style.opacity = String(galleryIn);
  storyGallery.style.transform = `translate(-50%, calc(-50% + ${(1 - galleryIn) * 22}vh)) scale(${.9 + galleryIn * .1})`;
  storyFocal.style.transform = `translate(-50%, -50%) scale(${.72 + progress * .35}) rotate(${progress * 16}deg)`;
  storyFocal.style.opacity = String(fade(progress, .1, .32) * (1 - fade(progress, .62, .82)));
  if (Math.abs(targetStoryProgress - storyProgress) > .001) storyFrame = requestAnimationFrame(animateStory);
  else storyFrame = 0;
}
window.addEventListener('scroll', measureStory, { passive: true });
window.addEventListener('resize', measureStory);
measureStory();

const welcomeOverlay = document.querySelector('#welcome-overlay');
const openInvitation = document.querySelector('#open-invitation');
const closeWelcome = () => {
  welcomeOverlay?.classList.add('is-closing');
  window.setTimeout(() => welcomeOverlay?.remove(), 650);
  sessionStorage.setItem('lanjaandkyle-welcome-seen', 'true');
};
if (sessionStorage.getItem('lanjaandkyle-welcome-seen') === 'true') welcomeOverlay?.remove();
openInvitation?.addEventListener('click', closeWelcome);
welcomeOverlay?.addEventListener('click', (event) => { if (event.target === welcomeOverlay) closeWelcome(); });
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && welcomeOverlay) closeWelcome(); });

const detailModal = document.querySelector('#detail-modal');
const modalTitle = document.querySelector('#modal-title');
const modalCopy = document.querySelector('#modal-copy');
const modalKicker = document.querySelector('#modal-kicker');
const modalLink = document.querySelector('#modal-link');
const showModal = ({ title, copy, kicker = 'A little detail', link = '#rsvp' }) => {
  if (!detailModal) return;
  modalTitle.textContent = title;
  modalCopy.textContent = copy;
  modalKicker.textContent = kicker;
  modalLink.href = link;
  detailModal.showModal();
};
document.querySelector('#modal-close')?.addEventListener('click', () => detailModal.close());
detailModal?.addEventListener('click', (event) => { if (event.target === detailModal) detailModal.close(); });
document.querySelectorAll('.gallery-card').forEach((card) => card.addEventListener('click', () => showModal({ title: card.dataset.modalTitle, copy: card.dataset.modalCopy, kicker: 'From the gallery' })));
const openScheduleModal = (event) => {
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  if (event.type === 'keydown') event.preventDefault();
  const card = event.target.closest('.schedule-card');
  if (!card) return;
  showModal({ title: card.querySelector('h3')?.textContent || 'Weekend plan', copy: card.querySelector('p')?.textContent || 'More details coming soon.', kicker: card.querySelector('.time')?.textContent || 'Schedule' });
};
document.querySelector('#schedule-list')?.addEventListener('click', openScheduleModal);
document.querySelector('#schedule-list')?.addEventListener('keydown', openScheduleModal);

const rsvpForm = document.querySelector('#rsvp-form');
const rsvpStatus = document.querySelector('#rsvp-status');
rsvpForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = rsvpForm.querySelector('button');
  button.disabled = true;
  rsvpStatus.textContent = 'Saving your reply…';
  try {
    const response = await fetch('/api/rsvp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(rsvpForm))) });
    if (!response.ok) throw new Error('Unable to save');
    rsvpForm.reset();
    rsvpStatus.textContent = 'Thank you. Your RSVP has been saved.';
  } catch { rsvpStatus.textContent = 'We could not save that just now. Please try again.'; }
  button.disabled = false;
});

document.querySelectorAll('[data-registry-item]').forEach((item) => item.addEventListener('click', () => {
  const payload = JSON.stringify({ item: item.dataset.registryItem, href: item.href, at: new Date().toISOString() });
  if (navigator.sendBeacon) navigator.sendBeacon('/api/registry-click', new Blob([payload], { type: 'application/json' }));
  else fetch('/api/registry-click', { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true });
}));

