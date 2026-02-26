import React, { useEffect, useState } from 'react';
import { getImageUrl, getDetails } from '../../services/tmdbApi';
import '../../styles/movies/FavoriteActors.css';

/**
 * Enriches actors that only have an id (no profile_path / name) by fetching
 * their details from the TMDB people endpoint.
 */
const useEnrichedActors = (actors) => {
    const [enriched, setEnriched] = useState(actors);

    useEffect(() => {
        let cancelled = false;
        const enrich = async () => {
            const results = await Promise.all(
                actors.map(async (actor) => {
                    // Already has enough data
                    if (actor.profile_path && actor.name) return actor;
                    try {
                        const details = await getDetails(actor.id, 'person');
                        if (!details) return actor;
                        return {
                            ...actor,
                            name: actor.name || details.name,
                            profile_path: actor.profile_path || details.profile_path,
                            known_for_department: actor.known_for_department || details.known_for_department,
                        };
                    } catch {
                        return actor;
                    }
                })
            );
            if (!cancelled) setEnriched(results);
        };
        enrich();
        return () => { cancelled = true; };
    }, [actors]);

    return enriched;
};

const FavoriteActorsPage = ({ favoriteActors, onActorClick, onRemove, onClearAll }) => {
    const actors = useEnrichedActors(favoriteActors);

    return (
        <div className="fav-actors-page">
            {/* Header */}
            <div className="fav-actors-header">
                <div className="fav-actors-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <h2>Favourite Actors</h2>
                    {actors.length > 0 && (
                        <span className="fav-actors-count-badge">{actors.length}</span>
                    )}
                </div>
                {actors.length > 0 && (
                    <button className="fav-actors-clear-btn" onClick={onClearAll}>
                        Clear All
                    </button>
                )}
            </div>

            {/* Empty State */}
            {actors.length === 0 ? (
                <div className="fav-actors-empty">
                    <div className="fav-actors-empty-icon">🎬</div>
                    <h3>No favourite actors yet</h3>
                    <p>
                        Tap the ❤️ button on any actor card or profile page to add them here,
                        or add their TMDB ID to <code>favoriteActors.json</code>.
                    </p>
                </div>
            ) : (
                <div className="fav-actors-grid">
                    {actors.map((actor) => (
                        <div
                            key={actor.id}
                            className="fav-actor-card"
                            onClick={() => onActorClick && onActorClick(actor)}
                        >
                            <div className="fav-actor-poster-wrap">
                                {actor.profile_path ? (
                                    <img
                                        src={getImageUrl(actor.profile_path, 'w342')}
                                        alt={actor.name || `Actor ${actor.id}`}
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
                                <div className="fav-actor-name">{actor.name || `Actor #${actor.id}`}</div>
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
