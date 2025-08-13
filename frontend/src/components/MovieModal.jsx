// frontend/src/components/MovieModal.jsx
import React, { useEffect, useState } from 'react';
import './MovieModal.css';

function MovieModal({ movie, onClose, isFavorite, toggleFavorite, setRating, rating }) {
  const [trailerUrl, setTrailerUrl] = useState('');
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (!movie?.id) return;
      setLoadingTrailer(true);
      try {
        const res = await fetch(`/api/trailer/${movie.id}`);
        const data = await res.json();
        const key = data?.trailer?.key || null;
        setTrailerUrl(key ? `https://www.youtube.com/embed/${key}` : '');
      } catch (err) {
        console.error('Error fetching trailer:', err);
        setTrailerUrl('');
      } finally {
        setLoadingTrailer(false);
      }
    };
    fetchTrailer();
  }, [movie?.id]);

  if (!movie) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content dark">
        <button className="close-button" onClick={onClose} aria-label="Close">✖</button>

        <h2>{movie.title}</h2>
        <p>{movie.overview}</p>

        {loadingTrailer ? (
          <p className="no-trailer" style={{ opacity: 0.8 }}>Loading trailer…</p>
        ) : trailerUrl ? (
          <iframe
            title="YouTube trailer"
            width="100%"
            height="360"
            src={trailerUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '12px' }}
          />
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
                role="button"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
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
