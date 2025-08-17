// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const TMDB_API_KEY = (process.env.TMDB_API_KEY || '').trim();
if (!TMDB_API_KEY) {
  console.error('❌ Missing TMDB_API_KEY in .env');
  process.exit(1);
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

// ---- API proxy routes (keep key on server) ----
app.get('/api/trending', async (_req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/trending/movie/day`, {
      params: { api_key: TMDB_API_KEY }
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.query || '').trim();
    if (!q) return res.json({ results: [] });
    const { data } = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query: q }
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.get('/api/trailer/:movieId', async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/${req.params.movieId}/videos`, {
      params: { api_key: TMDB_API_KEY }
    });
    // pick best YouTube video (trailer > teaser > clip, prefer EN & newer)
    const vids = (data.results || []).filter(v => v.site === 'YouTube');
    const score = (v) => {
      const t = (v.type || '').toLowerCase();
      let s = 0;
      if (t === 'trailer') s += 100;
      else if (t === 'teaser') s += 60;
      else if (t === 'clip') s += 30;
      if (v.official) s += 25;
      if ((v.name || '').toLowerCase().includes('official')) s += 10;
      if (v.iso_639_1 === 'en') s += 5;
      const ts = Date.parse(v.published_at || v.created_at || '') || 0;
      s += Math.floor(ts / 1e9);
      return s;
    };
    vids.sort((a, b) => score(b) - score(a));
    res.json({ trailer: vids[0] || null });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

// ---- serve the single-file app ----
app.use(express.static(path.join(__dirname))); // serves index.html in this folder

app.listen(PORT, () => {
  console.log(`🎬 Server running on http://localhost:${PORT}`);
});
