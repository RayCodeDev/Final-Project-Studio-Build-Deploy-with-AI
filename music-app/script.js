// --- Music Player avec recherche réelle (iTunes, CORS OK) ---
class MusicPlayer {
  constructor() {
    // Etat
    this.tracks = [];
    this.currentTrack = 0;
    this.isPlaying = false;
    this.isDragging = false;

    // Audio
    this.audio = new Audio();
    this.audio.preload = "metadata";

    // DOM (ids existants côté HTML)
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.playPauseIcon = document.getElementById('play-pause-icon');
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');

    this.songTitle = document.getElementById('song-title');
    this.artistName = document.getElementById('artist-name');
    this.albumArt  = document.getElementById('current-album-art');

    this.progressBar    = document.getElementById('progress-bar');
    this.progressFill   = document.getElementById('progress-fill');
    this.progressHandle = document.getElementById('progress-handle');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.totalTimeDisplay   = document.getElementById('total-time');

    this.searchInput = document.getElementById('search-input');
    this.tracksContainer = document.getElementById('tracks-container');

    this.bindEvents();

    // Recherche initiale (morceaux réels)
    this.loadFromITunes('lofi');
  }

  // ====== Events ======
  bindEvents() {
    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.previousTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());

    // Clavier
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
      else if (e.code === 'ArrowLeft') { this.previousTrack(); }
      else if (e.code === 'ArrowRight') { this.nextTrack(); }
    });

    // Audio
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('loadedmetadata', () => {
      this.totalTimeDisplay.textContent = this.formatTime(Math.floor(this.audio.duration || 0));
      this.updateProgress();
    });
    this.audio.addEventListener('ended', () => this.nextTrack());

    // Progress bar click
    this.progressBar.addEventListener('click', (e) => {
      const pct = this.getBarPercentFromEvent(e);
      if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
    });

    // Drag seek
    this.progressHandle.addEventListener('mousedown', (e) => this.startDragging(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.stopDragging());

    // Recherche avec debounce
    if (this.searchInput) {
      const debounced = this.debounce((q) => {
        const query = q.trim();
        this.loadFromITunes(query || 'lofi');
      }, 400);
      this.searchInput.addEventListener('input', (e) => debounced(e.target.value));
    }
  }

  // ====== Recherche iTunes (préviews réels) ======
  async loadFromITunes(query = 'lofi') {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=25`;
      const res = await fetch(url);
      const data = await res.json();

      this.tracks = (data.results || [])
        .filter(t => t.previewUrl) // on veut des previews jouables
        .map(t => ({
          title: t.trackName,
          artist: t.artistName,
          cover: (t.artworkUrl100 || '').replace('100x100bb.jpg', '300x300bb.jpg'),
          preview: t.previewUrl,
          durationSecs: Math.round((t.trackTimeMillis || 0) / 1000)
        }));

      this.currentTrack = 0;
      this.renderTrackList();
      // Charge sans autoplay (l’utilisateur déclenche lecture)
      if (this.tracks.length) this.loadTrack(0, false);
      else this.clearPlayerUI(`Aucun résultat pour “${query}”`);
    } catch (err) {
      console.error(err);
      this.clearPlayerUI("Erreur de recherche.");
    }
  }

  renderTrackList() {
    if (!this.tracksContainer) return;
    this.tracksContainer.innerHTML = '';

    if (!this.tracks.length) {
      this.tracksContainer.innerHTML = `<div class="track-item muted">Aucun résultat</div>`;
      return;
    }

    this.tracks.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'track-item';
      item.innerHTML = `
        <img class="track-cover" src="${t.cover}" alt="">
        <div class="track-meta">
          <div class="track-title">${t.title}</div>
          <div class="track-artist">${t.artist}</div>
        </div>
      `;
      item.addEventListener('click', () => this.selectTrack(i));
      this.tracksContainer.appendChild(item);
    });
  }

  clearPlayerUI(message) {
    this.songTitle.textContent = message || '';
    this.artistName.textContent = '';
    this.albumArt.src = '';
    this.audio.src = '';
    this.isPlaying = false;
    this.syncPlayIcon();
    this.progressFill.style.width = '0%';
    this.progressHandle.style.left = '0%';
    this.currentTimeDisplay.textContent = '0:00';
    this.totalTimeDisplay.textContent = '0:00';
  }

  // ====== Contrôles ======
  async togglePlay() {
    if (!this.audio.src) return;
    if (!this.isPlaying) {
      try { await this.audio.play(); this.isPlaying = true; }
      catch {}
    } else {
      this.audio.pause();
      this.isPlaying = false;
    }
    this.syncPlayIcon();
    this.bump(this.playPauseBtn);
    this.setPlayingAnimation(this.isPlaying);
  }

  previousTrack() {
    if (!this.tracks.length) return;
    this.currentTrack = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
    this.loadTrack(this.currentTrack, true);
  }

  nextTrack() {
    if (!this.tracks.length) return;
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    this.loadTrack(this.currentTrack, true);
  }

  selectTrack(index) {
    this.currentTrack = index;
    this.loadTrack(index, true);
  }

  loadTrack(index, autoplay = false) {
    const t = this.tracks[index];
    if (!t) return;

    this.songTitle.textContent = t.title;
    this.artistName.textContent = t.artist;
    this.albumArt.src = t.cover || '';

    this.audio.src = t.preview; // URL preview réelle
    this.animateTrackChange();

    if (autoplay) { this.isPlaying = true; this.audio.play().catch(()=>{}); }
    else          { this.isPlaying = false; this.audio.pause(); }

    this.syncPlayIcon();
  }

  syncPlayIcon() {
    this.playPauseIcon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
  }

  // ====== Progress / Seek ======
  updateProgress() {
    if (this.isDragging) return;
    const dur = this.audio.duration || 0;
    const cur = this.audio.currentTime || 0;
    const pct = dur ? (cur / dur) * 100 : 0;

    this.progressFill.style.width = `${pct}%`;
    this.progressHandle.style.left = `${pct}%`;
    this.currentTimeDisplay.textContent = this.formatTime(Math.floor(cur));
    if (dur && this.totalTimeDisplay.textContent === '0:00') {
      this.totalTimeDisplay.textContent = this.formatTime(Math.floor(dur));
    }
  }

  getBarPercentFromEvent(e) {
    const rect = this.progressBar.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    return rect.width ? x / rect.width : 0;
  }

  startDragging(e) {
    e.preventDefault();
    this.isDragging = true;
    this.onDrag(e);
  }

  onDrag(e) {
    if (!this.isDragging) return;
    const pct = this.getBarPercentFromEvent(e) * 100;
    this.progressFill.style.width = `${pct}%`;
    this.progressHandle.style.left = `${pct}%`;
  }

  stopDragging() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const width = parseFloat(this.progressFill.style.width) || 0;
    const pct = width / 100;
    if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
  }

  // ====== FX ======
  bump(el) {
    if (!el) return;
    el.style.transform = 'scale(0.95)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 150);
  }
  setPlayingAnimation(on) {
    if (!this.albumArt) return;
    this.albumArt.style.animation = on ? 'pulse 2s ease-in-out infinite alternate' : 'none';
    const glow = document.querySelector('.album-glow');
    if (glow) glow.style.animationDuration = on ? '1.5s' : '2s';
  }
  animateTrackChange() {
    if (!this.albumArt) return;
    this.albumArt.style.transform = 'scale(0.9) rotate(5deg)';
    this.albumArt.style.opacity = '0.7';
    setTimeout(() => {
      this.albumArt.style.transform = 'scale(1) rotate(0deg)';
      this.albumArt.style.opacity = '1';
    }, 300);
  }

  // ====== Utils ======
  formatTime(s) {
    const m = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${m}:${secs.toString().padStart(2,'0')}`;
  }
  debounce(fn, delay=300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  new MusicPlayer();
});
