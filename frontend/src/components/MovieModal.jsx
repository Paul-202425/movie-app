// frontend/src/components/MovieModal.jsx
import React, { useEffect, useState } from 'react';
import './MovieModal.css';

function MovieModal({ movie, onClose, isFavorite, toggleFavorite, setRating, rating }) {
  const [trailerUrl, setTrailerUrl] = useState('');

  useEffect(() => {
    const fetchTrailer = async () => {
      if (!movie) return;
      try {
        const response = await fetch(`/api/trailer/${movie.id}`);
        const data = await response.json();
        const trailer = data.results.find(
          (video) => video.type === 'Trailer' && video.site === 'YouTube'
        );
        setTrailerUrl(trailer ? `https://www.youtube.com/embed/${trailer.key}` : '');
      } catch (error) {
        console.error('Error fetching trailer:', error);
      }
    };

    fetchTrailer();
  }, [movie]);

  if (!movie) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content dark">
        <button className="close-button" onClick={onClose}>
          ✖
        </button>
        <h2>{movie.title}</h2>
        <p>{movie.overview}</p>

        {trailerUrl ? (
          <iframe
            width="100%"
            height="315"
            src={trailerUrl}
            title="YouTube trailer"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        ) : (
          <p className="no-trailer">Trailer not available</p>
        )}

        <div className="modal-actions">
          <button className="favorite-button" onClick={() => toggleFavorite(movie)}>
            {isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
          </button>

          <div className="rating-section">
            <p>Rate this movie:</p>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? 'selected' : ''}`}
                onClick={() => setRating(movie.id, star)}
              >
                ★
              </span>
            ))}
            <p className="rating-value">{rating}/5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
