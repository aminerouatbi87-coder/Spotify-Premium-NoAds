import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"]
  }
});

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock Data - Rap FR & International
const rapSongs = [
  // Rap FR
  { id: 1, title: "La Vie d'Artiste", artist: "Booba", genre: "Rap FR", duration: 240, plays: 1250, cover: "🔥" },
  { id: 2, title: "Diesel", artist: "Gims", genre: "Rap FR", duration: 220, plays: 980, cover: "🎤" },
  { id: 3, title: "La Fouine", artist: "La Fouine ft Rohff", genre: "Rap FR", duration: 230, plays: 1100, cover: "🔊" },
  { id: 4, title: "Snapshots", artist: "ALM", genre: "Rap FR", duration: 250, plays: 850, cover: "🎵" },
  { id: 5, title: "Changer", artist: "Keny Arkana", genre: "Rap FR", duration: 210, plays: 920, cover: "💿" },
  { id: 6, title: "Je Suis", artist: "Gradur", genre: "Rap FR", duration: 240, plays: 1050, cover: "🔥" },
  { id: 7, title: "Wallah", artist: "Maître Gims", genre: "Rap FR", duration: 200, plays: 1300, cover: "🎤" },
  { id: 8, title: "Magique", artist: "Youssoupha", genre: "Rap FR", duration: 235, plays: 890, cover: "✨" },
  { id: 9, title: "Freestyle", artist: "Freestyle Mam", genre: "Rap FR", duration: 180, plays: 650, cover: "🎶" },
  { id: 10, title: "Rue Nizan", artist: "Lacrim", genre: "Rap FR", duration: 245, plays: 1180, cover: "🔥" },
  
  // Rap International
  { id: 11, title: "HUMBLE.", artist: "Kendrick Lamar", genre: "Rap US", duration: 220, plays: 5000, cover: "🎤" },
  { id: 12, title: "Sicko Mode", artist: "Travis Scott", genre: "Rap US", duration: 250, plays: 4200, cover: "🔥" },
  { id: 13, title: "GOOSEBUMPZ", artist: "Travis Scott ft Kendrick Lamar", genre: "Rap US", duration: 240, plays: 3800, cover: "🌟" },
  { id: 14, title: "Lose Yourself", artist: "Eminem", genre: "Rap US", duration: 230, plays: 6500, cover: "💿" },
  { id: 15, title: "God's Plan", artist: "Drake", genre: "Rap US", duration: 240, plays: 5200, cover: "👑" },
  { id: 16, title: "Bodak Yellow", artist: "Cardi B", genre: "Rap US", duration: 210, plays: 4100, cover: "💛" },
  { id: 17, title: "Mo' Money Mo' Problems", artist: "Biggie", genre: "Rap US", duration: 220, plays: 3500, cover: "🎵" },
  { id: 18, title: "California Love", artist: "2Pac ft Dr. Dre", genre: "Rap US", duration: 235, plays: 3800, cover: "☀️" },
  { id: 19, title: "Mask Off", artist: "Future", genre: "Rap US", duration: 200, plays: 2900, cover: "😷" },
  { id: 20, title: "Jumpman", artist: "Drake ft Future", genre: "Rap US", duration: 210, plays: 4300, cover: "🚀" },
  
  // Rap Africain
  { id: 21, title: "Essence", artist: "Wizkid ft Tems", genre: "Afrobeats", duration: 240, plays: 3200, cover: "🌍" },
  { id: 22, title: "Ye", artist: "Burna Boy", genre: "Afrobeats", duration: 230, plays: 2800, cover: "🔥" },
  { id: 23, title: "Last Last", artist: "Burna Boy", genre: "Afrobeats", duration: 210, plays: 3100, cover: "💔" },
];

const playlists = [
  { id: 1, name: "🔥 Rap FR Hit", description: "Les meilleurs du Rap Français", songIds: [1, 2, 3, 6, 10] },
  { id: 2, name: "🌟 Rap International", description: "Rap US & International", songIds: [11, 12, 14, 15, 18] },
  { id: 3, name: "🎤 Freestyle Hits", description: "Les meilleurs freestyles", songIds: [9, 5, 8] },
  { id: 4, name: "🎵 Classics", description: "Les classiques du rap", songIds: [17, 18, 19, 20] },
];

// Routes
app.get('/api/songs', (req, res) => {
  res.json(rapSongs);
});

app.get('/api/songs/search', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const results = rapSongs.filter(song =>
    song.title.toLowerCase().includes(query) ||
    song.artist.toLowerCase().includes(query) ||
    song.genre.toLowerCase().includes(query)
  );
  res.json(results);
});

app.get('/api/songs/genre/:genre', (req, res) => {
  const genre = req.params.genre;
  const results = rapSongs.filter(song => song.genre === genre);
  res.json(results);
});

app.get('/api/playlists', (req, res) => {
  res.json(playlists);
});

app.get('/api/playlists/:id', (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.id));
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  
  const songs = playlist.songIds.map(id => rapSongs.find(s => s.id === id));
  res.json({ ...playlist, songs });
});

app.get('/api/top-songs', (req, res) => {
  const topSongs = [...rapSongs].sort((a, b) => b.plays - a.plays).slice(0, 10);
  res.json(topSongs);
});

app.get('/api/health', (req, res) => {
  res.json({ status: '🎤 Rap Player Premium is running!', timestamp: new Date().toISOString() });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('🎧 User connected:', socket.id);
  
  socket.on('play-song', (song) => {
    io.emit('song-playing', { song, userId: socket.id });
  });
  
  socket.on('pause', () => {
    io.emit('player-paused', { userId: socket.id });
  });
  
  socket.on('disconnect', () => {
    console.log('🎧 User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🎤 RAP PLAYER PREMIUM running on http://localhost:${PORT}`);
  console.log(`🔥 No Ads | Pure Rap FR + International`);
  console.log(`🌐 Open your browser at http://localhost:${PORT}\n`);
});

export { app, io };