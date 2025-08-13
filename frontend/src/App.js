// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './components/MovieList';
import MovieModal from './components/MovieModal';
import DarkModeToggle from './components/DarkModeToggle';
import { auth, provider, signInWithPopup, signOut } from './firebase';
import './App.css';

// ---- API base: prefer env, else rely on proxy/same-origin ----
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  ''; // when using CRA proxy, keep this empty

const api = axios.create({ baseURL: API_BASE });

function App() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : {};
  });
  const [ratings, setRatings] = useState(() => {
    const stored = localStorage.getItem('ratings');
    return stored ? JSON.parse(stored) : {};
  });
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTrendingMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/trending');
      setMovies(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      console.error('Error fetching trending movies:', err);
      setError(`Failed to load trending movies (${err?.response?.status || 'network'}).`);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/api/search?query=${encodeURIComponent(q)}`);
      setMovies(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError(`Search failed (${err?.response?.status || 'network'}).`);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => setDarkMode((d) => !d);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  const toggleFavorite = (movie) => {
    const updated = { ...favorites };
    if (updated[movie.id]) delete updated[movie.id];
    else updated[movie.id] = movie;
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const rateMovie = (movieId, value) => {
    const updated = { ...ratings, [movieId]: value };
    setRatings(updated);
    localStorage.setItem('ratings', JSON.stringify(updated));
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
  };

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <h1>🎬 Welcome to Movie Explorer – Discover, Rate & Save Your Favorites</h1>

        <div className="toggle-bar">
          <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

          {user ? (
            <div className="user-section">
              {user.photoURL && <img src={user.photoURL} alt="User" className="user-photo" />}
              <span>{user.displayName}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={handleLogin}>Login with Google</button>
          )}

          <button onClick={() => setMovies(Object.values(favorites))}>⭐ View Favorites</button>
          <button onClick={fetchTrendingMovies}>🔥 Show Trending</button>
        </div>

        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'salmon' }}>{error}</p>}
        {!loading && !error && movies.length === 0 && (
          <p>No movies found. Try searching or showing trending.</p>
        )}
      </header>

      <MovieList
        movies={movies}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        isLoggedIn={!!user}
        onMovieClick={setSelectedMovie}
        ratings={ratings}
        onRate={rateMovie}
      />

      {selectedMovie?.id && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          toggleFavorite={toggleFavorite}
          isFavorite={!!favorites[selectedMovie.id]}
          setRating={rateMovie}
          rating={ratings[selectedMovie.id] || 0}
        />
      )}
    </div>
  );
}

export default App;
