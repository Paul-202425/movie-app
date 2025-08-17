// backend/index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const BASE_URL = 'https://api.themoviedb.org/3';

const V3_KEY = (process.env.TMDB_API_KEY || '').trim();
const V4_BEARER = (process.env.TMDB_BEARER || '').trim();

function tmdbClient() {
  if (V4_BEARER) {
    return axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${V4_BEARER}` },
    });
  }
  if (V3_KEY) {
    return axios.create({
      baseURL: BASE_URL,
      params: { api_key: V3_KEY },
    });
  }
  throw new Error('TMDB credentials missing. Set TMDB_BEARER (v4) or TMDB_API_KEY (v3) in .env');
}
const tmdb = tmdbClient();

// ---- Helpers ----
const scoreVideo = (v) => {
  const t = (v.type || '').toLowerCase();
  const name = (v.name || '').toLowerCase();
  let s = 0;

  // type preference
  if (t === 'trailer') s += 100;
  else if (t === 'teaser') s += 60;
  else if (t === 'clip') s += 30;
  else if (t === 'featurette') s += 20;

  // cues
  if (v.official) s += 25;
  if (name.includes('official')) s += 10;
  if (name.includes('trailer')) s += 8;

  // language and recency
  if (v.iso_639_1 === 'en') s += 5;
  const ts = Date.parse(v.published_at || v.created_at || '') || 0;
  s += Math.floor(ts / 1e9);

  return s;
};

async function getBestYouTubeVideo(movieId) {
  // Pass 1: ask for EN videos first
  let results = [];
  try {
    const { data } = await tmdb.get(`/movie/${movieId}/videos`, {
      params: { language: 'en-US' },
    });
    results = (data?.results || []).filter((v) => v.site === 'YouTube');
  } catch (e) {
    // fall through to pass 2
  }

  // Pass 2: no language filter (get everything)
  if (!results.length) {
    const { data } = await tmdb.get(`/movie/${movieId}/videos`);
    results = (data?.results || []).filter((v) => v.site === 'YouTube');
  }

  // Rank and pick
  results.sort((a, b) => scoreVideo(b) - scoreVideo(a));
  return results[0] || null;
}

// ---- Routes ----

// Health check (for HAProxy / k8s / monitors)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/trending', async (_req, res) => {
  try {
    const { data } = await tmdb.get('/trending/movie/day');
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('Trending error:', status, err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch trending movies', status });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.query || '').trim();
    if (!q) return res.json({ results: [] });
    const { data } = await tmdb.get('/search/movie', { params: { query: q } });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('Search error:', status, err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to search movies', status });
  }
});

// Smarter trailer endpoint with fallback passes
app.get('/api/trailer/:movieId', async (req, res) => {
  try {
    const best = await getBestYouTubeVideo(req.params.movieId);
    if (!best) {
      console.warn(`No YouTube video found for movie ${req.params.movieId}`);
    }
    res.json({ trailer: best });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('Trailer error:', status, err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch movie trailer', status });
  }
});

app.listen(PORT, () => {
  console.log(`🎬 Backend server running on http://localhost:${PORT}`);
  console.log('TMDB_API_KEY present?', Boolean(V3_KEY));
  console.log('TMDB_BEARER present?', Boolean(V4_BEARER));
});
