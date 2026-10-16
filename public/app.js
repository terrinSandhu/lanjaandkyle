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
  brunch: '<svg viewBox="0 0 24 24"><path d="M4 15h16M6 15v4h12v-4M8 15V9a4 4 0 0 1 8 0v6M12 3v3M4 11H2M22 11h-2"/></svg>',
  default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>'
};

async function loadSchedule() {
  const list = document.querySelector('#schedule-list');
  try {
    const csv = await fetch('/data/schedule.csv').then((res) => { if (!res.ok) throw new Error('Schedule unavailable'); return res.text(); });
    const parseCsvLine = (line) => {
      const cells = [];
      let cell = '';
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"' && line[index + 1] === '"') { cell += '"'; index += 1; }
        else if (character === '"') quoted = !quoted;
        else if (character === ',' && !quoted) { cells.push(cell.trim()); cell = ''; }
        else cell += character;
      }
      cells.push(cell.trim());
      return cells;
    };
    const rows = csv.trim().split(/\r?\n/).slice(1).map(parseCsvLine);
    list.innerHTML = rows.map(([date, time, title, location, description]) => {
      const icon = /ceremony/i.test(title) ? icons.ceremony : /welcome/i.test(title) ? icons.welcome : /brunch/i.test(title) ? icons.brunch : /reception/i.test(title) ? icons.reception : icons.default;
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
let storyPhotos = [];
const storyFocal = document.querySelector('.story-focal');
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const fade = (progress, start, end) => clamp((progress - start) / (end - start));
let targetStoryProgress = 0;
let storyProgress = 0;
let storyFrame = 0;
const storySpring = window.matchMedia('(max-width: 760px)').matches ? .22 : .14;
function measureStory() {
  if (!storyTrack) return;
  const bounds = storyTrack.getBoundingClientRect();
  targetStoryProgress = clamp((window.innerHeight - bounds.top) / (bounds.height - window.innerHeight));
  if (!storyFrame) storyFrame = requestAnimationFrame(animateStory);
}
function animateStory() {
  storyProgress += (targetStoryProgress - storyProgress) * storySpring;
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
  storyPhotos.forEach((photo, index) => {
    const reveal = fade(progress, .6 + Math.min(index, 4) * .035, .76 + Math.min(index, 4) * .035);
    photo.style.setProperty('--story-reveal', String(reveal));
    photo.style.opacity = String(reveal);
  });
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
const mobileRsvpCta = document.querySelector('.mobile-rsvp-cta');
const rsvpSection = document.querySelector('#rsvp');
if (mobileRsvpCta && rsvpSection) {
  const rsvpVisibility = new IntersectionObserver(([entry]) => mobileRsvpCta.classList.toggle('is-hidden', entry.isIntersecting), { threshold: .2 });
  rsvpVisibility.observe(rsvpSection);
}
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

document.querySelector('[data-registry-item="Honeymoon fund"]')?.remove();

const galleryViewport = document.querySelector('#engagement-viewport');
const galleryTrack = document.querySelector('#engagement-track');
const galleryPosition = document.querySelector('#gallery-position');
const galleryToggle = document.querySelector('#gallery-toggle');
const photoModal = document.querySelector('#photo-modal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const engagementPhotos = Array.from({ length: 31 }, (_, index) => ({
  src: `/assets/engagement/gallery/${String(index + 1).padStart(2, '0')}.jpg`,
  alt: `Lanja and Kyle, engagement photograph ${index + 1}`
}));
let currentPhoto = 0;
if (galleryTrack && galleryViewport) {
  galleryTrack.innerHTML = engagementPhotos.map((photo, index) => `<figure class="story-photo"><button class="story-photo-open" type="button" data-photo-index="${index}" aria-label="View engagement photo ${index + 1} of ${engagementPhotos.length}"><img src="${photo.src}" alt="${photo.alt}" loading="lazy" /></button><figcaption>${String(index + 1).padStart(2, '0')} / ${String(engagementPhotos.length).padStart(2, '0')}</figcaption></figure>`).join('');
  storyPhotos = [...galleryTrack.querySelectorAll('.story-photo')];
  const updateGalleryPosition = () => {
    const cards = [...galleryTrack.querySelectorAll('.story-photo')];
    const midpoint = galleryViewport.scrollLeft + galleryViewport.clientWidth / 2;
    currentPhoto = cards.reduce((nearest, card, index) => Math.abs(card.offsetLeft + card.offsetWidth / 2 - midpoint) < Math.abs(cards[nearest].offsetLeft + cards[nearest].offsetWidth / 2 - midpoint) ? index : nearest, 0);
    galleryPosition.textContent = `Photo ${currentPhoto + 1} of ${engagementPhotos.length}`;
  };
  const goToPhoto = (index) => {
    currentPhoto = (index + engagementPhotos.length) % engagementPhotos.length;
    galleryTrack.querySelectorAll('.story-photo')[currentPhoto]?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    galleryPosition.textContent = `Photo ${currentPhoto + 1} of ${engagementPhotos.length}`;
  };
  let galleryPlaying = !reducedMotion.matches;
  let galleryVisible = false;
  let pointerInsideGallery = false;
  let autoAdvanceTimer;
  const syncAutoAdvance = () => {
    window.clearInterval(autoAdvanceTimer);
    if (galleryPlaying && galleryVisible && !pointerInsideGallery && !document.hidden && !photoModal?.open) {
      autoAdvanceTimer = window.setInterval(() => { if (!photoModal?.open) goToPhoto(currentPhoto + 1); }, 4300);
    }
    galleryToggle?.setAttribute('aria-pressed', String(galleryPlaying));
    if (galleryToggle) galleryToggle.textContent = galleryPlaying ? 'Pause photos' : 'Play photos';
  };
  const galleryObserver = new IntersectionObserver(([entry]) => {
    galleryVisible = entry.isIntersecting && entry.intersectionRatio >= .35;
    syncAutoAdvance();
  }, { threshold: [.35, .6] });
  galleryObserver.observe(galleryViewport);
  if (window.matchMedia('(hover: hover)').matches) {
    galleryViewport.addEventListener('pointerenter', () => { pointerInsideGallery = true; syncAutoAdvance(); });
    galleryViewport.addEventListener('pointerleave', () => { pointerInsideGallery = false; syncAutoAdvance(); });
  }
  document.addEventListener('visibilitychange', syncAutoAdvance);
  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) galleryPlaying = false;
    syncAutoAdvance();
  });
  galleryToggle?.addEventListener('click', () => { galleryPlaying = !galleryPlaying; syncAutoAdvance(); });
  galleryViewport.addEventListener('scroll', updateGalleryPosition, { passive: true });
  galleryViewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); goToPhoto(currentPhoto + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToPhoto(currentPhoto - 1); }
  });
  document.querySelector('#gallery-previous')?.addEventListener('click', () => goToPhoto(currentPhoto - 1));
  document.querySelector('#gallery-next')?.addEventListener('click', () => goToPhoto(currentPhoto + 1));
  photoModal?.addEventListener('close', syncAutoAdvance);
  syncAutoAdvance();
  updateGalleryPosition();
  measureStory();
}

const photoModalImage = document.querySelector('#photo-modal-image');
const photoModalCaption = document.querySelector('#photo-modal-caption');
const showEngagementPhoto = (index) => {
  currentPhoto = (index + engagementPhotos.length) % engagementPhotos.length;
  const photo = engagementPhotos[currentPhoto];
  photoModalImage.src = photo.src;
  photoModalImage.alt = photo.alt;
  photoModalCaption.textContent = `Lanja & Kyle · ${currentPhoto + 1} of ${engagementPhotos.length}`;
  if (!photoModal.open) photoModal.showModal();
  galleryToggle?.setAttribute('aria-pressed', 'false');
  galleryPosition.textContent = `Photo ${currentPhoto + 1} of ${engagementPhotos.length}`;
};
galleryTrack?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-photo-index]');
  if (button) showEngagementPhoto(Number(button.dataset.photoIndex));
});
document.querySelector('#photo-modal-close')?.addEventListener('click', () => photoModal.close());
document.querySelector('#photo-modal-prev')?.addEventListener('click', () => showEngagementPhoto(currentPhoto - 1));
document.querySelector('#photo-modal-next')?.addEventListener('click', () => showEngagementPhoto(currentPhoto + 1));
photoModal?.addEventListener('click', (event) => { if (event.target === photoModal) photoModal.close(); });
photoModal?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') showEngagementPhoto(currentPhoto + 1);
  if (event.key === 'ArrowLeft') showEngagementPhoto(currentPhoto - 1);
});
