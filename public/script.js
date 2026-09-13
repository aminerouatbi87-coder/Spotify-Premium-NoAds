class RapPlayerPremium {
    constructor() {
        this.songs = [];
        this.playlists = [];
        this.currentSong = null;
        this.isPlaying = false;
        this.queue = [];
        this.favorites = JSON.parse(localStorage.getItem('rapFavorites')) || [];
        this.currentGenre = 'all';
        this.audio = document.getElementById('audioPlayer');
        
        this.init();
    }

    async init() {
        this.setupDOM();
        this.attachEventListeners();
        await this.loadSongs();
        await this.loadPlaylists();
        this.render();
    }

    setupDOM() {
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerArtist = document.getElementById('playerArtist');
        this.progressSlider = document.getElementById('progressSlider');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.searchInput = document.getElementById('searchInput');
        this.genreBtns = document.querySelectorAll('.genre-btn');
        this.navItems = document.querySelectorAll('.nav-item');
        this.pages = document.querySelectorAll('.page');
    }

    attachEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());
        this.progressSlider.addEventListener('change', (e) => this.seek(e.target.value));
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.searchInput.addEventListener('input', (e) => this.search(e.target.value));

        this.genreBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.genreBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentGenre = e.target.dataset.genre;
                this.render();
            });
        });

        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navItems.forEach(i => i.classList.remove('active'));
                e.target.closest('.nav-item').classList.add('active');
                const page = e.target.closest('.nav-item').dataset.page;
                this.switchPage(page);
            });
        });

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextSong());
    }

    async loadSongs() {
        try {
            const response = await fetch('/api/songs');
            this.songs = await response.json();
            this.queue = [...this.songs];
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    }

    async loadPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            this.playlists = await response.json();
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    }

    playSong(song) {
        this.currentSong = song;
        this.playerTitle.textContent = song.title;
        this.playerArtist.textContent = song.artist;
        this.audio.src = `data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==`; // Dummy audio
        this.play();
    }

    play() {
        this.isPlaying = true;
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        this.audio.play();
    }

    pause() {
        this.isPlaying = false;
        this.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.audio.pause();
    }

    togglePlay() {
        if (!this.currentSong) {
            this.playSong(this.queue[0]);
        } else if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    nextSong() {
        const currentIndex = this.queue.findIndex(s => s.id === this.currentSong?.id);
        if (currentIndex < this.queue.length - 1) {
            this.playSong(this.queue[currentIndex + 1]);
        }
    }

    previousSong() {
        const currentIndex = this.queue.findIndex(s => s.id === this.currentSong?.id);
        if (currentIndex > 0) {
            this.playSong(this.queue[currentIndex - 1]);
        }
    }

    seek(value) {
        const time = (value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }

    setVolume(value) {
        this.audio.volume = value / 100;
    }

    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressSlider.value = progress;
            document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
            document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
        }
    }

    toggleFavorite(songId) {
        const index = this.favorites.indexOf(songId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(songId);
        }
        localStorage.setItem('rapFavorites', JSON.stringify(this.favorites));
        this.render();
    }

    async search(query) {
        if (!query) {
            this.render();
            return;
        }

        try {
            const response = await fetch(`/api/songs/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Aucun résultat trouvé</p></div>';
            return;
        }
        container.innerHTML = results.map(song => this.createSongItem(song)).join('');
        this.attachSongListeners();
    }

    render() {
        this.renderTopSongs();
        this.renderPlaylists();
        this.renderRapFr();
        this.renderRapIntl();
    }

    async renderTopSongs() {
        try {
            const response = await fetch('/api/top-songs');
            const topSongs = await response.json();
            const container = document.getElementById('topSongsGrid');
            container.innerHTML = topSongs.map(song => this.createSongCard(song)).join('');
            this.attachSongListeners();
        } catch (error) {
            console.error('Error rendering top songs:', error);
        }
    }

    renderPlaylists() {
        const container = document.getElementById('playlistsGrid');
        container.innerHTML = this.playlists.map(pl => `
            <div class="playlist-card" onclick="window.player.playPlaylist(${pl.id})">
                <div style="font-size: 3em; text-align: center; margin-bottom: 10px;">📋</div>
                <div class="song-title">${pl.name}</div>
                <div class="song-artist">${pl.description}</div>
                <div class="song-meta">${pl.songIds?.length || 0} chansons</div>
            </div>
        `).join('');
    }

    renderRapFr() {
        const rapFr = this.songs.filter(s => s.genre === 'Rap FR');
        const container = document.getElementById('rapFrList');
        container.innerHTML = rapFr.slice(0, 5).map((song, i) => this.createSongItem(song, i + 1)).join('');
        this.attachSongListeners();
    }

    renderRapIntl() {
        const rapIntl = this.songs.filter(s => s.genre !== 'Rap FR');
        const container = document.getElementById('rapIntlList');
        container.innerHTML = rapIntl.slice(0, 5).map((song, i) => this.createSongItem(song, i + 1)).join('');
        this.attachSongListeners();
    }

    createSongCard(song) {
        return `
            <div class="song-card">
                <div class="song-cover">${song.cover}</div>
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-meta">👂 ${song.plays} plays</div>
            </div>
        `;
    }

    createSongItem(song, number) {
        const isFavorite = this.favorites.includes(song.id);
        return `
            <div class="song-item">
                <div class="song-number">${number || ''}</div>
                <div class="song-info">
                    <div class="song-name">${song.title}</div>
                    <div class="song-by">${song.artist}</div>
                </div>
                <div class="song-duration">${this.formatTime(song.duration)}</div>
                <button class="play-btn-small" onclick="window.player.playSong({id: ${song.id}, title: '${song.title}', artist: '${song.artist}', duration: ${song.duration}})">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
    }

    switchPage(page) {
        this.pages.forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    playPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            this.queue = playlist.songIds.map(id => this.songs.find(s => s.id === id));
            this.playSong(this.queue[0]);
        }
    }

    attachSongListeners() {
        document.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = Array.from(document.querySelectorAll('.song-card')).indexOf(card);
                if (this.queue[index]) this.playSong(this.queue[index]);
            });
        });
    }
}

window.player = new RapPlayerPremium();