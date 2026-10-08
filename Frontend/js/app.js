/* ==========================================================================
   SoundWave Music Streaming Platform - Pastel Frontend Logic
   ========================================================================== */

const state = {
  user: null,
  tracks: [],
  albums: [],
  artistTracks: [],
  artistAlbums: [],
  currentTrack: null,
  isPlaying: false,
  queue: [],
  queueIndex: -1,
  isShuffle: false,
  isRepeat: 'none', // 'none' | 'all' | 'one'
  volume: 0.8,
  previousVolume: 0.8,
  currentGenre: 'all',
  searchQuery: '',
  authMode: 'login', // 'login' | 'register'
  selectedAlbum: null,
  theme: 'light'
};

// Global Native Audio Instance
const audio = new Audio();
audio.volume = state.volume;

// Default Pastel Artwork
const DEFAULT_COVER = '/assets/covers/pastel_dreamscape.jpg';

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '🌸';
  if (type === 'success') icon = '✨';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// Audio Playback Engine & Events
// ==========================================================================
audio.addEventListener('play', () => {
  state.isPlaying = true;
  updatePlaybackUI();
});

audio.addEventListener('pause', () => {
  state.isPlaying = false;
  updatePlaybackUI();
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const scrubBar = document.getElementById('scrub-bar');
  const currentTimeLabel = document.getElementById('time-current');
  
  const percent = (audio.currentTime / audio.duration) * 100;
  scrubBar.value = percent;
  scrubBar.style.background = `linear-gradient(to right, var(--pastel-lavender) ${percent}%, var(--border-light) ${percent}%)`;
  
  currentTimeLabel.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  const durationLabel = document.getElementById('time-duration');
  durationLabel.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  if (state.isRepeat === 'one') {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNextTrack();
  }
});

audio.addEventListener('error', (err) => {
  console.warn("Audio playback stream notice:", err);
  showToast("Audio stream unavailable or loading", "error");
});

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updatePlaybackUI() {
  const playPauseIcon = document.getElementById('play-pause-icon');
  const thumbWrap = document.getElementById('player-thumb-wrap');
  const eqVisualizer = document.getElementById('eq-visualizer');

  if (state.isPlaying) {
    playPauseIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
    thumbWrap.classList.add('playing');
    eqVisualizer.classList.add('active');
  } else {
    playPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    thumbWrap.classList.remove('playing');
    eqVisualizer.classList.remove('active');
  }

  // Update track active styles in lists
  document.querySelectorAll('.track-card').forEach(card => {
    const trackId = card.getAttribute('data-track-id');
    if (state.currentTrack && trackId === state.currentTrack._id) {
      card.classList.add('active-playing');
    } else {
      card.classList.remove('active-playing');
    }
  });
}

function playTrack(track, newQueue = null) {
  if (!track || !track.uri) {
    showToast("Selected track is missing a valid audio URL", "error");
    return;
  }

  state.currentTrack = track;

  if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
    state.queue = [...newQueue];
    state.queueIndex = state.queue.findIndex(t => t._id === track._id);
    if (state.queueIndex === -1) {
      state.queue.unshift(track);
      state.queueIndex = 0;
    }
  } else if (state.queue.length === 0) {
    state.queue = [track];
    state.queueIndex = 0;
  } else {
    const idx = state.queue.findIndex(t => t._id === track._id);
    if (idx !== -1) {
      state.queueIndex = idx;
    } else {
      state.queue.push(track);
      state.queueIndex = state.queue.length - 1;
    }
  }

  // Update bottom player elements
  const coverArt = track.coverImage || DEFAULT_COVER;
  document.getElementById('player-cover-art').src = coverArt;
  document.getElementById('player-track-title').textContent = track.title || 'Untitled';
  
  const artistName = (track.artist && track.artist.username) ? track.artist.username : 'Unknown Artist';
  document.getElementById('player-track-artist').textContent = artistName;

  updateQueueBadge();

  // Set audio source & play
  audio.src = track.uri;
  audio.play().then(() => {
    updatePlaybackUI();
    // Register play count to server
    fetch(`/api/music/${track._id}/play`, { method: 'POST' }).catch(() => {});
  }).catch(err => {
    console.warn("Autoplay blocked or stream delayed:", err);
  });
}

function togglePlayPause() {
  if (!state.currentTrack) {
    if (state.tracks.length > 0) {
      playTrack(state.tracks[0], state.tracks);
    }
    return;
  }

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

function playNextTrack() {
  if (state.queue.length === 0) return;

  if (state.isShuffle) {
    state.queueIndex = Math.floor(Math.random() * state.queue.length);
  } else {
    state.queueIndex++;
    if (state.queueIndex >= state.queue.length) {
      if (state.isRepeat === 'all') {
        state.queueIndex = 0;
      } else {
        state.queueIndex = state.queue.length - 1;
        audio.pause();
        return;
      }
    }
  }

  const nextTrack = state.queue[state.queueIndex];
  if (nextTrack) playTrack(nextTrack);
}

function playPreviousTrack() {
  if (!state.queue || state.queue.length === 0) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  state.queueIndex--;
  if (state.queueIndex < 0) {
    state.queueIndex = state.queue.length - 1;
  }

  const prevTrack = state.queue[state.queueIndex];
  if (prevTrack) playTrack(prevTrack);
}

function handleSeek(value) {
  if (!audio.duration || isNaN(audio.duration)) return;
  const targetTime = (value / 100) * audio.duration;
  audio.currentTime = targetTime;
}

function handleVolumeChange(value) {
  state.volume = parseFloat(value);
  audio.volume = state.volume;
  updateVolumeIcon();
}

function toggleMute() {
  if (audio.volume > 0) {
    state.previousVolume = audio.volume;
    audio.volume = 0;
    document.getElementById('volume-slider').value = 0;
  } else {
    audio.volume = state.previousVolume || 0.8;
    document.getElementById('volume-slider').value = audio.volume;
  }
  updateVolumeIcon();
}

function updateVolumeIcon() {
  const icon = document.getElementById('volume-icon');
  if (audio.volume === 0) {
    icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
  } else {
    icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
  }
}

function toggleShuffle() {
  state.isShuffle = !state.isShuffle;
  const btn = document.getElementById('btn-shuffle');
  btn.classList.toggle('active', state.isShuffle);
  showToast(state.isShuffle ? "Shuffle enabled" : "Shuffle disabled");
}

function toggleRepeat() {
  const btn = document.getElementById('btn-repeat');
  if (state.isRepeat === 'none') {
    state.isRepeat = 'all';
    btn.classList.add('active');
    showToast("Repeat all enabled");
  } else if (state.isRepeat === 'all') {
    state.isRepeat = 'one';
    btn.classList.add('active');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="15" font-size="8" fill="currentColor">1</text></svg>`;
    showToast("Repeat track enabled");
  } else {
    state.isRepeat = 'none';
    btn.classList.remove('active');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
    showToast("Repeat disabled");
  }
}

function toggleFavorite(btn) {
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    btn.querySelector('svg').setAttribute('fill', 'var(--pastel-rose)');
    showToast("Added to Liked Songs", "success");
  } else {
    btn.querySelector('svg').setAttribute('fill', 'none');
    showToast("Removed from Liked Songs");
  }
}

// ==========================================================================
// Views & Navigation
// ==========================================================================
function switchView(viewName) {
  document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  if (viewName === 'discover') {
    document.getElementById('view-discover').style.display = 'flex';
    document.getElementById('nav-discover').classList.add('active');
  } else if (viewName === 'albums') {
    document.getElementById('view-albums').style.display = 'flex';
    document.getElementById('nav-albums').classList.add('active');
    renderAlbumsFull();
  } else if (viewName === 'studio') {
    document.getElementById('view-studio').style.display = 'flex';
    document.getElementById('nav-studio').classList.add('active');
    setupStudioView();
  }
}

function switchStudioTab(tabName) {
  document.querySelectorAll('.studio-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('studio-pane-upload').style.display = 'none';
  document.getElementById('studio-pane-album').style.display = 'none';
  document.getElementById('studio-pane-manage').style.display = 'none';

  if (tabName === 'upload') {
    document.getElementById('tab-btn-upload').classList.add('active');
    document.getElementById('studio-pane-upload').style.display = 'flex';
  } else if (tabName === 'album') {
    document.getElementById('tab-btn-album').classList.add('active');
    document.getElementById('studio-pane-album').style.display = 'flex';
    populateAlbumChecklist();
  } else if (tabName === 'manage') {
    document.getElementById('tab-btn-manage').classList.add('active');
    document.getElementById('studio-pane-manage').style.display = 'flex';
    loadArtistCatalog();
  }
}

// ==========================================================================
// API Handlers: Fetch Catalog & Albums
// ==========================================================================
async function fetchCatalog(search = '', genre = '') {
  try {
    let url = '/api/music?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (genre && genre !== 'all') url += `genre=${encodeURIComponent(genre)}&`;

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error("Could not fetch tracks");
    const data = await res.json();
    state.tracks = data.musics || [];
    renderTracksGrid(state.tracks);
  } catch (err) {
    console.error("fetchCatalog error:", err);
  }
}

async function fetchAlbums() {
  try {
    const res = await fetch('/api/music/albums', { credentials: 'include' });
    if (!res.ok) throw new Error("Could not fetch albums");
    const data = await res.json();
    state.albums = data.albums || [];
    renderAlbumsHome(state.albums);
  } catch (err) {
    console.error("fetchAlbums error:", err);
  }
}

// Render Tracks in Discover View
function renderTracksGrid(tracks) {
  const container = document.getElementById('tracks-grid-container');
  if (!container) return;

  if (tracks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: 18px; border: 1px solid var(--border-light);">
        No tracks match your current filter. Try searching for another genre or artist.
      </div>
    `;
    return;
  }

  container.innerHTML = tracks.map(track => {
    const coverArt = track.coverImage || DEFAULT_COVER;
    const artistName = (track.artist && track.artist.username) ? track.artist.username : 'SoundWave Artist';
    const isCurrent = state.currentTrack && state.currentTrack._id === track._id;

    return `
      <div class="track-card ${isCurrent ? 'active-playing' : ''}" data-track-id="${track._id}" onclick="handleTrackCardClick('${track._id}')">
        <div class="track-card-thumb-wrap">
          <img src="${coverArt}" class="track-card-img" alt="${escapeHtml(track.title)}" loading="lazy">
          <div class="track-card-overlay">
            <div class="track-play-bubble">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>
        <div class="track-card-info">
          <div class="track-card-title">${escapeHtml(track.title)}</div>
          <div class="track-card-artist">${escapeHtml(artistName)}</div>
          <div class="track-card-meta">
            <span class="track-genre-chip">${escapeHtml(track.genre || 'Pastel')}</span>
            <span>${track.duration || '03:20'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleTrackCardClick(trackId) {
  const track = state.tracks.find(t => t._id === trackId);
  if (track) playTrack(track, state.tracks);
}

function playAllVisibleTracks() {
  if (state.tracks.length > 0) {
    playTrack(state.tracks[0], state.tracks);
    showToast(`Playing all ${state.tracks.length} tracks`, "success");
  }
}

// Render Albums on Home & Full Albums View
function renderAlbumsHome(albums) {
  const container = document.getElementById('albums-home-container');
  if (!container) return;
  renderAlbumsIntoContainer(container, albums.slice(0, 4));
}

function renderAlbumsFull() {
  const container = document.getElementById('albums-full-container');
  if (!container) return;
  renderAlbumsIntoContainer(container, state.albums);
}

function renderAlbumsIntoContainer(container, albums) {
  if (albums.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: 18px; border: 1px solid var(--border-light);">
        No curated albums published yet. Artists can publish albums via the Artist Studio.
      </div>
    `;
    return;
  }

  container.innerHTML = albums.map(album => {
    const coverArt = album.coverImage || DEFAULT_COVER;
    const artistName = (album.artist && album.artist.username) ? album.artist.username : 'SoundWave Artist';
    const trackCount = (album.musics && Array.isArray(album.musics)) ? album.musics.length : 0;

    return `
      <div class="album-card" onclick="openAlbumModal('${album._id}')">
        <div class="album-card-jacket">
          <img src="${coverArt}" class="album-cover-img" alt="${escapeHtml(album.title)}" loading="lazy">
          <div class="album-card-vinyl">
            <div class="album-vinyl-label"></div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div class="album-card-title">${escapeHtml(album.title)}</div>
          <div class="album-card-artist">${escapeHtml(artistName)}</div>
          <div class="album-card-meta">
            <span>${escapeHtml(album.genre || 'Album')}</span>
            <span>${trackCount} ${trackCount === 1 ? 'Track' : 'Tracks'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Album Dynamic Exploration Modal
// ==========================================================================
async function openAlbumModal(albumId) {
  try {
    const res = await fetch(`/api/music/albums/${albumId}`, { credentials: 'include' });
    if (!res.ok) throw new Error("Could not load album");
    const data = await res.json();
    const album = data.album;
    state.selectedAlbum = album;

    const coverArt = album.coverImage || DEFAULT_COVER;
    document.getElementById('modal-album-cover').src = coverArt;
    document.getElementById('modal-album-title').textContent = album.title;
    document.getElementById('modal-album-artist').textContent = `Curated by ${album.artist?.username || 'Artist'}`;
    document.getElementById('modal-album-desc').textContent = album.description || 'Curated pastel track collection.';
    document.getElementById('modal-album-genre').textContent = album.genre || 'Album';

    const tbody = document.getElementById('modal-album-tracklist-tbody');
    const tracks = album.musics || [];

    if (tracks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No tracks in this album yet.</td></tr>`;
    } else {
      tbody.innerHTML = tracks.map((track, i) => {
        const isCurrent = state.currentTrack && state.currentTrack._id === track._id;
        const artist = track.artist?.username || album.artist?.username || 'Artist';

        return `
          <tr style="${isCurrent ? 'color: var(--pastel-lavender); font-weight: 700;' : ''}">
            <td style="color: var(--text-muted); font-weight: 600;">${i + 1}</td>
            <td style="font-weight: 700;">${escapeHtml(track.title)}</td>
            <td style="color: var(--text-secondary);">${escapeHtml(artist)}</td>
            <td style="color: var(--text-muted);">${track.duration || '03:20'}</td>
            <td style="text-align: right;">
              <button class="btn-icon-subtle" onclick="event.stopPropagation(); playModalTrack('${track._id}')" title="Play Track">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    document.getElementById('album-detail-modal').classList.add('active');
  } catch (err) {
    showToast("Failed to open album", "error");
  }
}

function closeAlbumModal() {
  document.getElementById('album-detail-modal').classList.remove('active');
}

function playModalAlbum() {
  if (state.selectedAlbum && state.selectedAlbum.musics && state.selectedAlbum.musics.length > 0) {
    playTrack(state.selectedAlbum.musics[0], state.selectedAlbum.musics);
    showToast(`Playing album: ${state.selectedAlbum.title}`, "success");
    closeAlbumModal();
  } else {
    showToast("Album has no tracks to play", "error");
  }
}

function playModalTrack(trackId) {
  if (!state.selectedAlbum) return;
  const track = state.selectedAlbum.musics.find(t => t._id === trackId);
  if (track) {
    playTrack(track, state.selectedAlbum.musics);
  }
}

function playHeroFeatured() {
  if (state.albums.length > 0) {
    openAlbumModal(state.albums[0]._id);
  } else if (state.tracks.length > 0) {
    playTrack(state.tracks[0], state.tracks);
  }
}

function exploreHeroAlbum() {
  if (state.albums.length > 0) {
    openAlbumModal(state.albums[0]._id);
  } else {
    switchView('albums');
  }
}

// ==========================================================================
// Queue Drawer
// ==========================================================================
function toggleQueueDrawer() {
  const modal = document.getElementById('queue-drawer-modal');
  modal.classList.toggle('active');
  if (modal.classList.contains('active')) {
    renderQueueList();
  }
}

function updateQueueBadge() {
  const badge = document.getElementById('queue-count-badge');
  if (badge) badge.textContent = state.queue.length;
}

function renderQueueList() {
  const container = document.getElementById('queue-tracks-list');
  if (!container) return;

  if (state.queue.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Queue is empty. Select tracks to play.</div>`;
    return;
  }

  container.innerHTML = state.queue.map((track, idx) => {
    const isCurrent = idx === state.queueIndex;
    const coverArt = track.coverImage || DEFAULT_COVER;
    const artist = track.artist?.username || 'Artist';

    return `
      <div class="track-check-item ${isCurrent ? 'active' : ''}" style="${isCurrent ? 'background-color: var(--pastel-mint-light); border-color: var(--pastel-mint-border);' : ''}" onclick="jumpToQueueIndex(${idx})">
        <img src="${coverArt}" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;">
        <div style="flex: 1; overflow: hidden;">
          <div style="font-weight: 700; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(track.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${escapeHtml(artist)}</div>
        </div>
        ${isCurrent ? '<span style="font-size: 0.72rem; color: var(--pastel-mint); font-weight: 800;">PLAYING</span>' : ''}
      </div>
    `;
  }).join('');
}

function jumpToQueueIndex(index) {
  if (index >= 0 && index < state.queue.length) {
    state.queueIndex = index;
    playTrack(state.queue[index]);
  }
}

function clearQueue() {
  state.queue = [];
  state.queueIndex = -1;
  updateQueueBadge();
  renderQueueList();
  showToast("Queue cleared");
}

// ==========================================================================
// Search & Genre Filtering
// ==========================================================================
let searchDebounceTimer;
function handleSearch(val) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.searchQuery = val.trim();
    fetchCatalog(state.searchQuery, state.currentGenre);
  }, 250);
}

function filterGenre(genre, pillEl) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');
  state.currentGenre = genre;
  fetchCatalog(state.searchQuery, state.currentGenre);
}

// ==========================================================================
// Authentication & RBAC Session Management
// ==========================================================================
async function checkAuthSession() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      state.user = data.user;
    } else {
      state.user = null;
    }
  } catch (err) {
    state.user = null;
  }
  updateAuthUI();
}

function updateAuthUI() {
  const avatarInitials = document.getElementById('user-avatar-initials');
  const displayName = document.getElementById('user-display-name');
  const displayRole = document.getElementById('user-display-role');
  const toggleBtnText = document.getElementById('role-toggle-text');
  const authButtons = document.getElementById('auth-buttons-wrapper');
  const loggedActions = document.getElementById('logged-user-actions');
  const studioRolePill = document.getElementById('studio-role-pill');

  if (state.user) {
    const name = state.user.username || 'User';
    avatarInitials.textContent = name.substring(0, 1).toUpperCase();
    displayName.textContent = name;
    
    if (state.user.role === 'artist') {
      displayRole.textContent = 'Artist Studio';
      displayRole.className = 'user-card-role role-artist';
      toggleBtnText.textContent = 'Switch to Listener Role';
      studioRolePill.textContent = 'CREATOR';
    } else {
      displayRole.textContent = 'Listener';
      displayRole.className = 'user-card-role role-listener';
      toggleBtnText.textContent = 'Upgrade to Artist Role';
      studioRolePill.textContent = 'LISTENER';
    }

    authButtons.style.display = 'none';
    loggedActions.style.display = 'flex';
  } else {
    avatarInitials.textContent = 'G';
    displayName.textContent = 'Guest Explorer';
    displayRole.textContent = 'Visitor';
    displayRole.className = 'user-card-role role-listener';
    toggleBtnText.textContent = 'Sign In to Switch Role';
    studioRolePill.textContent = 'RBAC';

    authButtons.style.display = 'flex';
    loggedActions.style.display = 'none';
  }

  // If currently in studio view, update RBAC controls
  const studioView = document.getElementById('view-studio');
  if (studioView.style.display !== 'none') {
    setupStudioView();
  }
}

async function toggleUserRole() {
  if (!state.user) {
    openAuthModal('login');
    showToast("Please sign in first to switch RBAC role", "info");
    return;
  }

  try {
    const nextRole = state.user.role === 'artist' ? 'user' : 'artist';
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
      credentials: 'include'
    });

    if (!res.ok) throw new Error("Could not switch role");
    const data = await res.json();
    state.user = data.user;
    updateAuthUI();
    showToast(`Role switched to ${state.user.role.toUpperCase()} successfully!`, "success");
  } catch (err) {
    showToast("Failed to switch role", "error");
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    state.user = null;
    updateAuthUI();
    showToast("Signed out successfully");
    switchView('discover');
  } catch (err) {
    showToast("Error signing out", "error");
  }
}

// 1-Click Demo Login
async function handleDemoLogin(username) {
  if (!username) return;
  await fillAndLogin(username, 'test');
  document.getElementById('demo-account-select').value = '';
}

async function fillAndLogin(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, password }),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    state.user = data.user;
    updateAuthUI();
    closeAuthModal();
    showToast(`Welcome back, ${data.user.username}! (${data.user.role.toUpperCase()})`, "success");

    if (data.user.role === 'artist') {
      switchView('studio');
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ==========================================================================
// Auth Modal Logic
// ==========================================================================
function openAuthModal(mode = 'login') {
  state.authMode = mode;
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const emailGroup = document.getElementById('auth-email-group');
  const roleGroup = document.getElementById('auth-role-group');
  const submitBtn = document.getElementById('btn-auth-submit');
  const prompt = document.getElementById('auth-toggle-prompt');
  const link = document.getElementById('auth-toggle-link');

  if (mode === 'register') {
    title.textContent = 'Create SoundWave Account';
    emailGroup.style.display = 'flex';
    roleGroup.style.display = 'flex';
    submitBtn.textContent = 'Register Account';
    prompt.textContent = 'Already have an account?';
    link.textContent = 'Sign In';
  } else {
    title.textContent = 'Sign In to SoundWave';
    emailGroup.style.display = 'none';
    roleGroup.style.display = 'none';
    submitBtn.textContent = 'Sign In';
    prompt.textContent = "Don't have an account?";
    link.textContent = 'Create Account';
  }

  modal.classList.add('active');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('active');
}

function toggleAuthMode(e) {
  if (e) e.preventDefault();
  openAuthModal(state.authMode === 'login' ? 'register' : 'login');
}

function selectRole(role) {
  document.getElementById('auth-role-input').value = role;
  document.getElementById('role-choice-user').classList.toggle('selected', role === 'user');
  document.getElementById('role-choice-artist').classList.toggle('selected', role === 'artist');
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;

  if (state.authMode === 'register') {
    const email = document.getElementById('auth-email').value.trim();
    const role = document.getElementById('auth-role-input').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      state.user = data.user;
      updateAuthUI();
      closeAuthModal();
      showToast(`Account registered as ${data.user.role.toUpperCase()}!`, "success");

      if (data.user.role === 'artist') {
        switchView('studio');
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  } else {
    await fillAndLogin(username, password);
  }
}

// ==========================================================================
// Artist Studio Workflows (Multer + ImageKit + Album Curation)
// ==========================================================================
function setupStudioView() {
  const listenerGuard = document.getElementById('studio-listener-guard');
  const artistWorkspace = document.getElementById('studio-artist-workspace');

  if (!state.user || state.user.role !== 'artist') {
    listenerGuard.style.display = 'flex';
    artistWorkspace.style.display = 'none';
  } else {
    listenerGuard.style.display = 'none';
    artistWorkspace.style.display = 'block';
    populateAlbumChecklist();
  }
}

function handleFileSelect(input) {
  const preview = document.getElementById('audio-file-name');
  if (input.files && input.files[0]) {
    const file = input.files[0];
    preview.style.display = 'block';
    preview.textContent = `🎵 Selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  } else {
    preview.style.display = 'none';
  }
}

function selectPresetCover(context, src, el) {
  const parent = el.closest('.cover-picker-grid');
  parent.querySelectorAll('.cover-option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  if (context === 'track') {
    document.getElementById('track-cover-value').value = src;
  } else {
    document.getElementById('album-cover-value').value = src;
  }
}

// Upload Track via Multer -> ImageKit
async function handleTrackUpload(event) {
  event.preventDefault();
  const fileInput = document.getElementById('audio-file-input');
  const titleInput = document.getElementById('track-title-input');
  const genreSelect = document.getElementById('track-genre-select');
  const durationInput = document.getElementById('track-duration-input');
  const coverValue = document.getElementById('track-cover-value').value;
  const submitBtn = document.getElementById('btn-submit-upload');

  if (!fileInput.files || fileInput.files.length === 0) {
    showToast("Please choose an audio file to upload", "error");
    return;
  }

  const formData = new FormData();
  formData.append('music', fileInput.files[0]);
  formData.append('title', titleInput.value.trim());
  formData.append('genre', genreSelect.value);
  formData.append('duration', durationInput.value.trim() || '03:30');
  formData.append('coverImage', coverValue);

  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>⏳ Uploading to ImageKit Cloud...</span>`;

  try {
    const res = await fetch('/api/music/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload track");

    showToast(`Track "${data.music.title}" uploaded to ImageKit CDN!`, "success");

    // Reset Form
    document.getElementById('track-upload-form').reset();
    document.getElementById('audio-file-name').style.display = 'none';

    // Refresh catalog and artist tracks
    fetchCatalog();
    populateAlbumChecklist();
    loadArtistCatalog();
    switchStudioTab('manage');
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
  }
}

// Populate Checklist for Album Creation
async function populateAlbumChecklist() {
  const checklist = document.getElementById('album-tracks-checklist');
  if (!checklist) return;

  try {
    const res = await fetch('/api/music/artist/tracks', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    state.artistTracks = data.tracks || [];

    if (state.artistTracks.length === 0) {
      checklist.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.85rem; padding: 12px; text-align: center;">
          You haven't uploaded any tracks yet. First upload tracks in the "Upload Track" tab!
        </div>
      `;
      return;
    }

    checklist.innerHTML = state.artistTracks.map(t => `
      <label class="track-check-item">
        <input type="checkbox" name="album-tracks" value="${t._id}">
        <div style="flex: 1;">
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${escapeHtml(t.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${t.genre || 'Pastel'} • ${t.duration || '03:20'}</div>
        </div>
      </label>
    `).join('');
  } catch (err) {
    console.error("populateAlbumChecklist error:", err);
  }
}

// Handle Curate & Publish Album
async function handleAlbumCreate(event) {
  event.preventDefault();
  const title = document.getElementById('album-title-input').value.trim();
  const genre = document.getElementById('album-genre-select').value;
  const desc = document.getElementById('album-desc-input').value.trim();
  const cover = document.getElementById('album-cover-value').value;

  const checkedBoxes = document.querySelectorAll('input[name="album-tracks"]:checked');
  const trackIds = Array.from(checkedBoxes).map(cb => cb.value);

  if (trackIds.length === 0) {
    showToast("Please select at least one track to include in the album", "error");
    return;
  }

  const submitBtn = document.getElementById('btn-submit-album');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/music/album', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        genre,
        description: desc,
        coverImage: cover,
        musics: trackIds
      }),
      credentials: 'include'
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create album");

    showToast(`Album "${data.album.title}" published with ${trackIds.length} tracks!`, "success");
    document.getElementById('album-create-form').reset();
    fetchAlbums();
    switchView('albums');
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// Load Artist Published Catalog in Studio Tab 3
async function loadArtistCatalog() {
  const container = document.getElementById('artist-tracks-manager-list');
  if (!container) return;

  try {
    const res = await fetch('/api/music/artist/tracks', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    const tracks = data.tracks || [];

    if (tracks.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); padding: 20px;">You have no published tracks.</div>`;
      return;
    }

    container.innerHTML = tracks.map(t => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background-color: var(--bg-surface); border: 1px solid var(--border-light); border-radius: 14px; box-shadow: var(--shadow-subtle);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${t.coverImage || DEFAULT_COVER}" style="width: 46px; height: 46px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border-light);">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(t.title)}</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">${t.genre || 'Pastel'} • ${t.plays || 0} plays • <a href="${t.uri}" target="_blank" style="color: var(--pastel-lavender); text-decoration: none; font-weight: 600;">ImageKit Link ↗</a></div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-icon-subtle" onclick="playTrack(${JSON.stringify(t).replace(/"/g, '&quot;')})" title="Play Track">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="btn-icon-subtle" onclick="deleteTrack('${t._id}')" title="Delete Track" style="color: var(--pastel-rose);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("loadArtistCatalog error:", err);
  }
}

async function deleteTrack(trackId) {
  if (!confirm("Are you sure you want to delete this track from your catalog?")) return;

  try {
    const res = await fetch(`/api/music/${trackId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) throw new Error("Could not delete track");
    showToast("Track deleted from catalog", "success");
    fetchCatalog();
    loadArtistCatalog();
    populateAlbumChecklist();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================================================
// Theme Management (Light Pastel ↔ Dark Pastel)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('soundwave_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(currentTheme, false);
}

function applyTheme(theme, notify = true) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('soundwave_theme', theme);

  const icon = document.getElementById('theme-toggle-icon');
  const btn = document.getElementById('theme-toggle-btn');
  if (icon && btn) {
    if (theme === 'dark') {
      // Sun icon to switch to light mode
      icon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
      btn.title = "Switch to Light Pastel Mode";
    } else {
      // Moon icon to switch to dark mode
      icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
      btn.title = "Switch to Dark Pastel Mode";
    }
  }

  if (notify) {
    showToast(theme === 'dark' ? "Dark Mode enabled 🌙" : "Light Pastel Mode enabled 🌸", "info");
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme, true);
}

// ==========================================================================
// Initialization on DOMContentLoaded
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await checkAuthSession();
  await fetchCatalog();
  await fetchAlbums();
});

