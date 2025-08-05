// frontend/src/components/MovieList.jsx
import React from 'react';
import './MovieList.css';

function MovieList({ movies, favorites, toggleFavorite, isLoggedIn, onMovieClick }) {
  if (!movies || movies.length === 0) {
    return <p>No movies found. Try searching or showing trending.</p>;
  }

  return (
    <div className="movie-list">
      {movies.map((movie) => {
        const isFav = favorites?.[movie.id];

        return (
          <div
            key={movie.id}
            className="movie-item"
            onClick={() => onMovieClick(movie)}
          >
            <img
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
              alt={movie.title}
            />
            <h3>{movie.title}</h3>

            {isLoggedIn && (
              <button
                className={`favorite-button ${isFav ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(movie);
                }}
              >
                {isFav ? '★ Unfavorite' : '☆ Favorite'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MovieList;
