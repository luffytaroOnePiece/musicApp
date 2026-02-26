import React from 'react';
import { getImageUrl } from '../../services/tmdbApi';
import '../../styles/movies/FavoriteActors.css';

const FavoriteActorsPage = ({ favoriteActors, onActorClick, onRemove, onClearAll }) => {
    return (
        <div className="fav-actors-page">
            {/* Header */}
            <div className="fav-actors-header">
                <div className="fav-actors-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <h2>Favourite Actors</h2>
                    {favoriteActors.length > 0 && (
                        <span className="fav-actors-count-badge">{favoriteActors.length}</span>
                    )}
                </div>
                {favoriteActors.length > 0 && (
                    <button className="fav-actors-clear-btn" onClick={onClearAll}>
                        Clear All
                    </button>
                )}
            </div>

            {/* Empty State */}
            {favoriteActors.length === 0 ? (
                <div className="fav-actors-empty">
                    <div className="fav-actors-empty-icon">🎬</div>
                    <h3>No favourite actors yet</h3>
                    <p>
                        Tap the ❤️ button on any actor card or their profile page to add them here.
                    </p>
                </div>
            ) : (
                /* Grid */
                <div className="fav-actors-grid">
                    {favoriteActors.map((actor) => (
                        <div
                            key={actor.id}
                            className="fav-actor-card"
                            onClick={() => onActorClick && onActorClick(actor)}
                        >
                            <div className="fav-actor-poster-wrap">
                                {actor.profile_path ? (
                                    <img
                                        src={getImageUrl(actor.profile_path, 'w342')}
                                        alt={actor.name}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="fav-actor-no-photo">🧑‍🎤</div>
                                )}
                                {/* Remove button */}
                                <button
                                    className="fav-actor-remove-btn"
                                    title="Remove from favourites"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove && onRemove(actor.id);
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="fav-actor-info">
                                <div className="fav-actor-name">{actor.name}</div>
                                {actor.known_for_department && (
                                    <div className="fav-actor-dept">{actor.known_for_department}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoriteActorsPage;
