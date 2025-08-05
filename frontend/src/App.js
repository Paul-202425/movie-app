// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieList from './components/MovieList';
import MovieModal from './components/MovieModal';
import DarkModeToggle from './components/DarkModeToggle';
import { auth, provider, signInWithPopup, signOut } from './firebase';
import './App.css';

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

  const fetchTrendingMovies = async () => {
    try {
      const response = await axios.get('/api/trending');
      setMovies(response.data.results);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(`/api/search?query=${searchQuery}`);
      setMovies(response.data.results);
    } catch (error) {
      console.error('Error searching movies:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.className = !darkMode ? 'dark-mode' : '';
  };

  const toggleFavorite = (movie) => {
    const updatedFavorites = { ...favorites };
    if (favorites[movie.id]) {
      delete updatedFavorites[movie.id];
    } else {
      updatedFavorites[movie.id] = movie;
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const rateMovie = (movieId, value) => {
    const updatedRatings = { ...ratings, [movieId]: value };
    setRatings(updatedRatings);
    localStorage.setItem('ratings', JSON.stringify(updatedRatings));
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
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
              <img src={user.photoURL} alt="User" className="user-photo" />
              <span>{user.displayName}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={handleLogin}>Login with Google</button>
          )}
          <button onClick={() => setMovies(Object.values(favorites))}>⭐ View Favorites</button>
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

      {selectedMovie && selectedMovie.id && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          toggleFavorite={toggleFavorite}
          isFavorite={favorites[selectedMovie.id]}
          setRating={rateMovie}
          rating={ratings[selectedMovie.id] || 0}
        />
      )}
    </div>
  );
}

export default App;
