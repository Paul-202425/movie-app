// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MovieList from './components/MovieList';
import MovieModal from './components/MovieModal';
import DarkModeToggle from './components/DarkModeToggle';
import { auth, provider, signInWithPopup, signOut } from './firebase';
import './App.css';

/**
 * API base:
 * - In dev with CRA, keep baseURL '' and let the "proxy" in package.json forward /api/*.
 * - In prod, set REACT_APP_API_BASE (e.g., https://your-domain.com) and the app will use it.
 */
const API_BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  '';

const api = axios.create({ baseURL: API_BASE });

// LocalStorage keys
const LS_KEYS = {
  favorites: 'movieapp_favorites',
  ratings: 'movieapp_ratings',
  darkMode: 'movieapp_darkmode',
};

function App() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(LS_KEYS.darkMode);
    return saved ? JSON.parse(saved) : false;
  });

  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem(LS_KEYS.favorites);
    return stored ? JSON.parse(stored) : {};
  });

  const [ratings, setRatings] = useState(() => {
    const stored = localStorage.getItem(LS_KEYS.ratings);
    return stored ? JSON.parse(stored) : {};
  });

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [user, setUser] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Persist dark mode and apply body class
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
    localStorage.setItem(LS_KEYS.darkMode, JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  const fetchTrendingMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Use AbortController to avoid setState after unmount
    const controller = new AbortController();
    try {
      const { data } = await api.get('/api/trending', { signal: controller.signal });
      setMovies(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('Error fetching trending movies:', err);
      setError(`Failed to load trending movies (${err?.response?.status || 'network'}).`);
      setMovies([]);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  const handleSearch = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const q = searchQuery.trim();
      if (!q) return;
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      try {
        // cleaner params style (axios handles encoding)
        const { data } = await api.get('/api/search', {
          params: { query: q },
          signal: controller.signal,
        });
        setMovies(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error('Error searching movies:', err);
        setError(`Search failed (${err?.response?.status || 'network'}).`);
        setMovies([]);
      } finally {
        setLoading(false);
      }
      return () => controller.abort();
    },
    [searchQuery]
  );

  const toggleFavorite = useCallback((movie) => {
    setFavorites((prev) => {
      const updated = { ...prev };
      if (updated[movie.id]) delete updated[movie.id];
      else updated[movie.id] = movie;
      localStorage.setItem(LS_KEYS.favorites, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const rateMovie = useCallback((movieId, value) => {
    setRatings((prev) => {
      const updated = { ...prev, [movieId]: value };
      localStorage.setItem(LS_KEYS.ratings, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTrendingMovies();
  }, [fetchTrendingMovies]);

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

          <button
            onClick={() => {
              const favs = Object.values(favorites);
              setMovies(favs);
              if (!favs.length) {
                setError('No favorites yet. Add some ⭐ and they’ll show up here.');
                setTimeout(() => setError(null), 2500);
              }
            }}
            title="Show your saved favorites"
          >
            ⭐ View Favorites
          </button>

          <button onClick={fetchTrendingMovies} title="Show daily trending movies">
            🔥 Show Trending
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search movies"
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
