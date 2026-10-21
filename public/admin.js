const dialog = document.querySelector('#admin-dialog');
const login = document.querySelector('#admin-login');
const workspace = document.querySelector('#admin-workspace');
const loginStatus = document.querySelector('#admin-login-status');
const textStatus = document.querySelector('#admin-text-status');
const imageStatus = document.querySelector('#admin-image-status');
const textSelect = document.querySelector('#admin-text-key');
const textValue = document.querySelector('#admin-text-value');
const imageSelect = document.querySelector('#admin-image-key');
const imagePreview = document.querySelector('#admin-image-preview');
const imageFile = document.querySelector('#admin-image-file');

const textFields = [
  ['hero-announcement', 'Home · announcement', '.hero-announce'], ['hero-names', 'Home · names', '#home h1'],
  ['welcome-label', 'Welcome · label', '.intro > .eyebrow'], ['welcome-heading', 'Welcome · heading', '.intro > h2'],
  ['weekend-label', 'Schedule · label', '#schedule .section-heading > .eyebrow'], ['weekend-heading', 'Schedule · heading', '#schedule h2'],
  ['weekend-intro', 'Schedule · introduction', '#schedule .lede'], ['travel-heading', 'Travel · heading', '#travel .split-copy h2'],
  ['travel-copy', 'Travel · details', '#travel .split-copy > p:not(.eyebrow)'], ['stay-heading', 'Accommodations · label', '.accommodations-copy .eyebrow'],
  ['stay-copy', 'Accommodations · details', '.accommodations-copy > p:not(.eyebrow)'], ['engagement-names', 'Story · names', '.story-couple'],
  ['engagement-date', 'Story · date', '.story-date'], ['engagement-address', 'Story · place', '.story-address'],
  ['registry-label', 'Registry · label', '#registry > .eyebrow'], ['registry-heading', 'Registry · heading', '#registry h2'],
  ['registry-copy', 'Registry · details', '#registry > .lede'], ['things-heading', 'Things to do · heading', '#things-to-do .section-heading h2'],
  ['things-intro', 'Things to do · introduction', '#things-to-do .lede'],
  ['zoo-title', 'Zoo · title', '.thing-zoo h3'], ['zoo-copy', 'Zoo · details', '.thing-zoo > div:last-child > p:last-child'],
  ['funk-title', 'Funk Zone · title', '.thing-funk h3'], ['funk-copy', 'Funk Zone · details', '.thing-funk > div:last-child > p:last-child'],
  ['state-title', 'State Street · title', '.thing-state h3'], ['state-copy', 'State Street · details', '.thing-state > div:last-child > p:last-child'],
  ['bike-title', 'Waterfront biking · title', '.thing-bike h3'], ['bike-copy', 'Waterfront biking · details', '.thing-bike > div:last-child > p:last-child'],
  ['beach-title', 'Butterfly Beach · title', '.thing-beach h3'], ['beach-copy', 'Butterfly Beach · details', '.thing-beach > div:last-child > p:last-child'],
  ['mission-title', 'Old Mission · title', '.thing-mission h3'], ['mission-copy', 'Old Mission · details', '.thing-mission > div:last-child > p:last-child'],
  ['faq-heading', 'FAQs · heading', '#faqs .section-heading h2'], ['rsvp-heading', 'RSVP · heading', '#rsvp h2'],
  ['rsvp-copy', 'RSVP · details', '.rsvp-note'], ['footer-copy', 'Footer · line', 'footer > p:not(.footer-small)']
];
const imageFields = [
  ['hero', 'Cover · hero image', '.hero-image'], ['venue', 'Villa Verano · venue image', '.story-backdrop'],
  ['travel', 'Travel · illustration', '.split-art.art-palm'], ['zoo', 'Things to do · Zoo', '.thing-zoo .thing-photo'],
  ['funk', 'Things to do · Funk Zone', '.thing-funk .thing-photo'], ['state', 'Things to do · State Street', '.thing-state .thing-photo'],
  ['bike', 'Things to do · Waterfront biking', '.thing-bike .thing-photo'], ['beach', 'Things to do · Butterfly Beach', '.thing-beach .thing-photo'],
  ['mission', 'Things to do · Old Mission', '.thing-mission .thing-photo'],
  ...Array.from({ length: 31 }, (_, index) => [`engagement-${String(index + 1).padStart(2, '0')}`, `Engagement · photo ${index + 1}`, `#engagement-track .story-photo:nth-child(${index + 1}) img`])
];

for (const [key, label] of textFields) textSelect.add(new Option(label, key));
for (const [key, label] of imageFields) imageSelect.add(new Option(label, key));

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function findText(key) {
  const selector = textFields.find(([field]) => field === key)?.[2];
  return selector ? document.querySelector(selector) : null;
}

function setText(key, value) {
  const element = findText(key);
  if (element) {
    element.textContent = value;
    element.style.whiteSpace = 'pre-line';
  }
}

function imageUrl(key) { return `/api/site-image/${encodeURIComponent(key)}?v=${Date.now()}`; }
function imageTarget(key) {
  const selector = imageFields.find(([field]) => field === key)?.[2];
  return selector ? document.querySelector(selector) : null;
}
let savedImages = {};
function applyImage(key, url) {
  const element = imageTarget(key);
  if (!element) return;
  if (element instanceof HTMLImageElement) element.src = url;
  else element.style.backgroundImage = `linear-gradient(145deg, rgba(40,59,48,.04), rgba(159,115,93,.12)), url("${url}")`;
}

async function loadSavedContent() {
  const content = await api('/api/site-content');
  savedImages = content.images || {};
  for (const [key, value] of Object.entries(content.text || {})) setText(key, value);
  for (const key of Object.keys(content.images || {})) applyImage(key, imageUrl(key));
  return content;
}

function selectText() {
  const field = textFields.find(([key]) => key === textSelect.value);
  const element = findText(textSelect.value);
  textValue.value = element?.textContent || '';
}
function selectImage(images = {}) {
  const key = imageSelect.value;
  imagePreview.style.backgroundImage = images[key] ? `url("${imageUrl(key)}")` : 'none';
  imagePreview.classList.toggle('has-image', Boolean(images[key]));
  imageFile.value = '';
}

document.querySelector('#admin-open').addEventListener('click', async () => {
  dialog.showModal();
  try {
    const { authenticated } = await api('/api/admin/session');
    if (authenticated) await unlock();
  } catch { /* The sign-in form remains available while offline. */ }
});
document.querySelector('#admin-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

async function unlock() {
  login.hidden = true;
  workspace.hidden = false;
  textSelect.value = textFields[0][0];
  selectText();
  const content = await loadSavedContent();
  selectImage(content.images || {});
  const status = await api('/api/lanja-edit-status');
  const toggle = document.querySelector('#lanja-edit-toggle');
  toggle.checked = status.active;
  document.querySelector('#admin-mode-status').textContent = status.active ? 'Inbox monitoring is active.' : 'Inbox monitoring is off.';
}

login.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginStatus.textContent = 'Checking PIN…';
  try {
    await api('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin: new FormData(login).get('pin') }) });
    login.reset(); loginStatus.textContent = '';
    await unlock();
  } catch (error) { loginStatus.textContent = error.message; }
});

textSelect.addEventListener('change', selectText);
textValue.addEventListener('input', () => setText(textSelect.value, textValue.value));
document.querySelector('#admin-save-text').addEventListener('click', async () => {
  textStatus.textContent = 'Saving…';
  try { await api('/api/admin/text', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ [textSelect.value]: textValue.value }) }); textStatus.textContent = 'Saved to the live site.'; }
  catch (error) { textStatus.textContent = error.message; }
});

imageSelect.addEventListener('change', async () => {
  try { const content = await api('/api/site-content'); selectImage(content.images || {}); }
  catch (error) { imageStatus.textContent = error.message; }
});
imageFile.addEventListener('change', () => {
  const file = imageFile.files?.[0];
  if (file) { imagePreview.style.backgroundImage = `url("${URL.createObjectURL(file)}")`; imagePreview.classList.add('has-image'); }
});
document.querySelector('#admin-upload-image').addEventListener('click', async () => {
  const file = imageFile.files?.[0];
  if (!file) { imageStatus.textContent = 'Choose an image first.'; return; }
  if (file.size > 5 * 1024 * 1024) { imageStatus.textContent = 'That image is larger than 5 MB.'; return; }
  imageStatus.textContent = 'Uploading…';
  try {
    await api(`/api/admin/image/${encodeURIComponent(imageSelect.value)}`, { method: 'PUT', headers: { 'content-type': file.type }, body: file });
    applyImage(imageSelect.value, imageUrl(imageSelect.value));
    const content = await api('/api/site-content'); selectImage(content.images || {});
    imageStatus.textContent = 'Image updated on the live site.';
  } catch (error) { imageStatus.textContent = error.message; }
});
document.querySelector('#admin-reset-image').addEventListener('click', async () => {
  imageStatus.textContent = 'Restoring original…';
  try {
    await api(`/api/admin/image/${encodeURIComponent(imageSelect.value)}`, { method: 'DELETE' });
    const target = imageTarget(imageSelect.value);
    if (target) target.style.backgroundImage = '';
    if (target instanceof HTMLImageElement) {
      const photo = Number(imageSelect.value.split('-')[1]) - 1;
      const galleryPhoto = document.querySelector(`#engagement-track .story-photo:nth-child(${photo + 1}) img`);
      if (galleryPhoto) target.src = galleryPhoto.dataset.originalSrc || target.src;
    }
    const content = await api('/api/site-content'); selectImage(content.images || {});
    imageStatus.textContent = 'Original image restored.';
  } catch (error) { imageStatus.textContent = error.message; }
});

document.querySelector('#lanja-edit-toggle').addEventListener('change', async (event) => {
  const toggle = event.currentTarget;
  toggle.disabled = true;
  const message = document.querySelector('#admin-mode-status');
  try {
    const status = await api('/api/admin/mode', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active: toggle.checked }) });
    message.textContent = status.active ? 'Inbox monitoring is active. It checks every 10 minutes.' : 'Inbox monitoring is off.';
  } catch (error) { toggle.checked = !toggle.checked; message.textContent = error.message; }
  finally { toggle.disabled = false; }
});

document.querySelectorAll('.admin-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.admin-tab').forEach((item) => item.classList.toggle('active', item === tab));
  const images = tab.dataset.adminTab === 'images';
  document.querySelector('#admin-copy').hidden = images;
  document.querySelector('#admin-images').hidden = !images;
}));
document.querySelector('#admin-logout').addEventListener('click', async () => {
  try { await api('/api/admin/logout', { method: 'POST' }); } catch { /* Lock the interface even if the network is unavailable. */ }
  workspace.hidden = true; login.hidden = false; dialog.close();
});

textSelect.value = textFields[0][0];
selectText();
const originalObserver = new MutationObserver(() => {
  for (const image of document.querySelectorAll('#engagement-track .story-photo img')) {
    if (!image.dataset.originalSrc) image.dataset.originalSrc = image.src;
  }
  for (const [key, value] of Object.entries(savedImages)) applyImage(key, imageUrl(key));
});
originalObserver.observe(document.querySelector('#engagement-track'), { childList: true, subtree: true });
loadSavedContent().catch(() => {});
