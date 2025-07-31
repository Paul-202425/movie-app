// ✅ backend/index.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// ✅ Trending movies
app.get('/api/trending', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/trending/movie/week`, {
      params: { api_key: API_KEY }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// ✅ Search movies
app.get('/api/search', async (req, res) => {
  const query = req.query.query;
  try {
    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: { api_key: API_KEY, query }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// ✅ Get movie trailer (YouTube)
app.get('/api/trailer/:movieId', async (req, res) => {
  const movieId = req.params.movieId;
  try {
    const response = await axios.get(`${BASE_URL}/movie/${movieId}/videos`, {
      params: { api_key: API_KEY }
    });
    const trailer = response.data.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    );
    res.json({ trailer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie trailer' });
  }
});

app.listen(PORT, () => {
  console.log(`🎬 Backend server running on port ${PORT}`);
});
