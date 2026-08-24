const linksInput = document.querySelector('#videoLinks');
const loadButton = document.querySelector('#loadButton');
const clearButton = document.querySelector('#clearButton');
const grid = document.querySelector('#videoGrid');
const wallSection = document.querySelector('#wallSection');
const controlDock = document.querySelector('#controlDock');
const message = document.querySelector('#inputMessage');
const countLabel = document.querySelector('#videoCount');
const statusDot = document.querySelector('.status-dot');
const playButton = document.querySelector('#playAll');
const playLabel = document.querySelector('#playLabel');
const playIcon = document.querySelector('#playIcon');
const muteButton = document.querySelector('#muteAll');
const volume = document.querySelector('#volume');
const volumeValue = document.querySelector('#volumeValue');
const loopToggle = document.querySelector('#loopToggle');

let apiReady = false;
let players = [];
let videoIds = [];
let allPlaying = false;
let allMuted = true;

window.onYouTubeIframeAPIReady = () => { apiReady = true; };

function extractVideoId(value) {
  try {
    const url = new URL(value.trim().startsWith('http') ? value.trim() : `https://${value.trim()}`);
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/')[1]?.split('?')[0];
    if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v');
  } catch (_) { return null; }
  return null;
}

function waitForAPI(callback) {
  if (apiReady && window.YT?.Player) callback();
  else setTimeout(() => waitForAPI(callback), 120);
}

function updateCount() {
  const count = videoIds.length;
  countLabel.textContent = `${count} video${count === 1 ? '' : 's'} loaded`;
  statusDot.classList.toggle('live', count > 0);
  wallSection.hidden = count === 0;
  controlDock.hidden = count === 0;
}

function createPlayer(id, index) {
  const card = document.createElement('article');
  card.className = 'video-card';
  card.dataset.id = id;
  card.innerHTML = `<span class="video-number">${String(index + 1).padStart(2, '0')}</span><button class="remove-video" title="Remove video" aria-label="Remove video">×</button><div id="player-${index}"></div>`;
  grid.appendChild(card);
  card.querySelector('.remove-video').addEventListener('click', () => removeVideo(id));

  const player = new YT.Player(`player-${index}`, {
    videoId: id,
    playerVars: { autoplay: 1, mute: 1, controls: 1, rel: 0, playsinline: 1, modestbranding: 1 },
    events: {
      onReady: event => { event.target.mute(); event.target.setVolume(Number(volume.value)); event.target.playVideo(); },
      onStateChange: event => {
        if (event.data === YT.PlayerState.ENDED && loopToggle.checked) { event.target.seekTo(0); event.target.playVideo(); }
      }
    }
  });
  players.push(player);
}

function buildWall(ids, scroll = true) {
  players.forEach(player => { try { player.destroy(); } catch (_) {} });
  players = [];
  grid.innerHTML = '';
  videoIds = [...new Set(ids)].slice(0, 12);
  localStorage.setItem('multiview-videos', JSON.stringify(videoIds));
  updateCount();
  if (!videoIds.length) return;
  waitForAPI(() => videoIds.forEach(createPlayer));
  allPlaying = true;
  allMuted = true;
  syncControlLabels();
  if (scroll) wallSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadLinks() {
  const lines = linksInput.value.split(/\n|,/).map(v => v.trim()).filter(Boolean);
  const ids = lines.map(extractVideoId).filter(Boolean);
  if (!lines.length) { message.textContent = 'Paste at least one YouTube link first.'; linksInput.focus(); return; }
  if (!ids.length) { message.textContent = 'No valid YouTube links were found.'; return; }
  message.textContent = ids.length < lines.length ? `${lines.length - ids.length} invalid link(s) skipped. Maximum 12 videos.` : '';
  buildWall(ids);
}

function removeVideo(id) {
  const remaining = videoIds.filter(videoId => videoId !== id);
  linksInput.value = remaining.map(videoId => `https://youtu.be/${videoId}`).join('\n');
  buildWall(remaining, false);
}

function syncControlLabels() {
  playLabel.textContent = allPlaying ? 'Pause all' : 'Play all';
  playIcon.textContent = allPlaying ? 'Ⅱ' : '▶';
  muteButton.textContent = allMuted ? '🔇' : '🔊';
  muteButton.title = allMuted ? 'Unmute all' : 'Mute all';
}

loadButton.addEventListener('click', loadLinks);
clearButton.addEventListener('click', () => { linksInput.value = ''; message.textContent = ''; buildWall([], false); });
playButton.addEventListener('click', () => {
  allPlaying = !allPlaying;
  players.forEach(player => { try { allPlaying ? player.playVideo() : player.pauseVideo(); } catch (_) {} });
  if (allPlaying && allMuted) { allMuted = false; players.forEach(player => player.unMute()); }
  syncControlLabels();
});
muteButton.addEventListener('click', () => {
  allMuted = !allMuted;
  players.forEach(player => { try { allMuted ? player.mute() : player.unMute(); } catch (_) {} });
  syncControlLabels();
});
volume.addEventListener('input', () => {
  volumeValue.textContent = `${volume.value}%`;
  players.forEach(player => { try { player.setVolume(Number(volume.value)); } catch (_) {} });
});
document.querySelectorAll('[data-columns]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-columns]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  grid.className = `video-grid columns-${button.dataset.columns}`;
}));

const saved = JSON.parse(localStorage.getItem('multiview-videos') || '[]');
if (saved.length) {
  linksInput.value = saved.map(id => `https://youtu.be/${id}`).join('\n');
  buildWall(saved, false);
}
