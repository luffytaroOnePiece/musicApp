import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { getImageUrl, getDetails, getImages, getVideos, getAccountDetails, getAccountStates, markAsFavorite, toggleWatchlist, rateMedia, deleteRating } from '../../services/tmdbApi';
import VideoModal from '../common/VideoModal';
import VidKingModal from '../common/VidKingModal';
import ActorPage from './ActorPage';

const MovieDetail = ({
    movie,
    details,
    credits,
    images,
    loading,
    onBack
}) => {
    // State
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedActor, setSelectedActor] = useState(null);
    const [showActorPage, setShowActorPage] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [seasonDetails, setSeasonDetails] = useState(null);
    const [loadingSeason, setLoadingSeason] = useState(false);
    const [trailer, setTrailer] = useState(null);
    const [showTrailerModal, setShowTrailerModal] = useState(false);

    // Watched, Favorite, Rating State
    const [isWatched, setIsWatched] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [rating, setRating] = useState(0);
    const [accountId, setAccountId] = useState(null);
    const [updatingWatched, setUpdatingWatched] = useState(false);
    const [updatingFavorite, setUpdatingFavorite] = useState(false);
    const [updatingRating, setUpdatingRating] = useState(false);

    // VidKing Player State
    const [showPlayer, setShowPlayer] = useState(false);
    const [playerConfig, setPlayerConfig] = useState({ type: 'movie', season: 1, episode: 1 });

    // Effect to fetch trailer
    React.useEffect(() => {
        const fetchTrailer = async () => {
            if (details?.id) {
                const videoData = await getVideos(details.id, details.title ? 'movie' : 'tv');
                if (videoData?.results) {
                    const trailerVideo = videoData.results.find(
                        vid => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
                    );
                    setTrailer(trailerVideo);
                }
            }
        };
        fetchTrailer();
    }, [details]);

    // Effect to fetch account states (watched/favorite status)
    React.useEffect(() => {
        const fetchAccountStates = async () => {
            if (details?.id) {
                try {
                    const accDetails = await getAccountDetails();
                    if (accDetails?.id) {
                        setAccountId(accDetails.id);
                        const mediaType = details.title ? 'movie' : 'tv';
                        const states = await getAccountStates(details.id, mediaType);
                        if (states) {
                            setIsWatched(states.watchlist);
                            setIsFavorite(states.favorite);
                            setRating(states.rated ? states.rated.value : 0);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch account states:", error);
                }
            }
        };
        fetchAccountStates();
    }, [details]);

    // Handlers
    const handleToggleWatched = async () => {
        if (!accountId || !details) return;
        setUpdatingWatched(true);
        const mediaType = details.title ? 'movie' : 'tv';
        const newWatchedState = !isWatched;

        try {
            const result = await toggleWatchlist(accountId, mediaType, details.id, newWatchedState);
            if (result && result.success) {
                setIsWatched(newWatchedState);
            }
        } catch (error) {
            console.error("Failed to toggle watched (watchlist) state:", error);
        } finally {
            setUpdatingWatched(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!accountId || !details) return;
        setUpdatingFavorite(true);
        const mediaType = details.title ? 'movie' : 'tv';
        const newFavState = !isFavorite;

        try {
            const result = await markAsFavorite(accountId, mediaType, details.id, newFavState);
            if (result && result.success) {
                setIsFavorite(newFavState);
            }
        } catch (error) {
            console.error("Failed to toggle favorite state:", error);
        } finally {
            setUpdatingFavorite(false);
        }
    };

    const handleRatingChange = async (e) => {
        const newRating = parseFloat(e.target.value);
        if (!details || !accountId) return;
        setUpdatingRating(true);
        const mediaType = details.title ? 'movie' : 'tv';
        try {
            if (newRating === 0 || isNaN(newRating)) {
                await deleteRating(details.id, mediaType);
                setRating(0);
            } else {
                await rateMedia(details.id, mediaType, newRating);
                setRating(newRating);
            }
        } catch (error) {
            console.error("Failed to update rating:", error);
        } finally {
            setUpdatingRating(false);
        }
    };

    const openLightbox = (imgUrl) => setSelectedImage(imgUrl);
    const closeLightbox = () => setSelectedImage(null);

    const handleActorClick = (actor) => {
        setSelectedActor(actor);
        setShowActorPage(true);
    };

    const handleSeasonClick = async (season) => {
        setSelectedSeason(season);
        setLoadingSeason(true);
        setSeasonDetails(null);
        try {
            const data = await import('../../services/tmdbApi').then(mod => mod.getSeasonDetails(details.id, season.season_number));
            setSeasonDetails(data);
        } catch (error) {
            console.error("Failed to fetch season details:", error);
        } finally {
            setLoadingSeason(false);
        }
    };

    const closeSeasonModal = () => {
        setSelectedSeason(null);
        setSeasonDetails(null);
    };

    const closeActorPage = () => {
        setShowActorPage(false);
        setSelectedActor(null);
    };
    // Helper formats
    const formatMoney = (amount) => {
        if (!amount) return '$0';
        if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
        if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
        return `$${amount.toLocaleString()}`;
    };

    const formatRuntime = (minutes) => {
        if (!minutes) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    if (loading || !details) {
        return (
            <div className="movies-view-container movie-detail-view">
                <div className="movies-view-loading apple-loader">Loading Movie Details...</div>
            </div>
        );
    }

    const backdropUrl = getImageUrl(details.backdrop_path || movie.backdrop_path, 'original');
    const posterUrl = getImageUrl(details.poster_path || movie.poster_path, 'w500');

    // Trim Top Cast to 6 (keep limit for display, maybe add 'See All' later if needed, but for now user said 'click on actor')
    // Actually user said "Show all images in gallery", so we remove gallery slice.
    const topCast = credits?.cast?.slice(0, 6) || []; // Reverted to 6
    const gallery = images?.backdrops || []; // Removed slice

    return (
        <div className="movies-view-container movie-detail-view animate-fade-in">
            {/* Lightbox Modal */}
            {selectedImage && ReactDOM.createPortal(
                <div className="lightbox-modal-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close-btn" onClick={closeLightbox}>×</button>
                        <img src={selectedImage} alt="Full View" className="lightbox-image" />
                    </div>
                </div>,
                document.body
            )}

            {/* Full-Screen Actor Page */}
            {showActorPage && selectedActor && ReactDOM.createPortal(
                <ActorPage
                    actor={selectedActor}
                    onBack={closeActorPage}
                    onMovieClick={(item) => {
                        closeActorPage();
                        // navigate back to movie list — caller can handle this
                    }}
                />,
                document.body
            )}

            {/* Video Trailer Modal */}
            {showTrailerModal && trailer && ReactDOM.createPortal(
                <VideoModal
                    video={{ id: trailer.key, title: trailer.name || 'Trailer' }}
                    onClose={() => setShowTrailerModal(false)}
                />,
                document.body
            )}

            {/* VidKing Player Modal */}
            {showPlayer && ReactDOM.createPortal(
                <VidKingModal
                    tmdbId={details.id}
                    type={playerConfig.type}
                    season={playerConfig.season}
                    episode={playerConfig.episode}
                    onClose={() => setShowPlayer(false)}
                />,
                document.body
            )}

            {/* Season Detail Modal */}
            {selectedSeason && ReactDOM.createPortal(
                <div className="actor-modal-overlay" onClick={closeSeasonModal}>
                    <div className="actor-modal-content glass-panel season-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="actor-modal-close-btn" onClick={closeSeasonModal}>×</button>

                        <div className="actor-modal-header">
                            <img
                                src={selectedSeason.poster_path ? getImageUrl(selectedSeason.poster_path, 'w185') : 'https://via.placeholder.com/150x225?text=No+Image'}
                                alt={selectedSeason.name}
                                className="season-modal-poster"
                            />
                            <div className="actor-modal-title">
                                <h2>{selectedSeason.name}</h2>
                                <p className="actor-modal-role">{selectedSeason.episode_count} Episodes</p>
                                {selectedSeason.air_date && (
                                    <p className="actor-modal-birth">
                                        Premiered: {new Date(selectedSeason.air_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="actor-modal-body custom-scrollbar">
                            {loadingSeason ? (
                                <div className="loading-spinner">Loading Episodes...</div>
                            ) : seasonDetails ? (
                                <div className="episodes-list">
                                    {seasonDetails.episodes?.map(episode => (
                                        <div key={episode.id} className="episode-item">
                                            <div className="episode-still-wrapper">
                                                <img
                                                    src={episode.still_path ? getImageUrl(episode.still_path, 'w300') : 'https://via.placeholder.com/200x112?text=No+Image'}
                                                    alt={episode.name}
                                                    className="episode-still"
                                                />
                                            </div>
                                            <div className="episode-info">
                                                <div className="episode-header">
                                                    <span className="episode-number">{episode.episode_number}.</span>
                                                    <span className="episode-title">{episode.name}</span>
                                                    <button
                                                        className="episode-play-btn glass-btn icon-only-small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPlayerConfig({
                                                                type: 'tv',
                                                                season: selectedSeason.season_number,
                                                                episode: episode.episode_number
                                                            });
                                                            setShowPlayer(true);
                                                        }}
                                                        style={{ marginLeft: '10px', padding: '4px 8px', minWidth: 'auto', height: 'auto' }}
                                                        title="Play Episode"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <span className="episode-date">
                                                    {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                                                </span>
                                                <p className="episode-overview">{episode.overview || 'No overview available.'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="error-message">Failed to load season details.</div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div
                className="movie-backdrop-layer"
                style={{ backgroundImage: `url(${backdropUrl})` }}
            />

            <div className="movie-detail-content">
                <button className="back-btn glass-btn" onClick={onBack} style={{ marginBottom: '20px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to List
                </button>

                <div className="movie-hero animate-slide-up">
                    <img
                        src={posterUrl}
                        alt={details.title || details.name}
                        className="detail-poster"
                    />

                    <div className="detail-info">
                        <h1 className="detail-title">{details.title || details.name}</h1>

                        <div className="detail-meta">
                            <span>{(details.release_date || details.first_air_date || '').split('-')[0]}</span>
                            <span>•</span>
                            <span>{details.genres?.map(g => g.name).join(', ')}</span>
                            {details.runtime > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{formatRuntime(details.runtime)}</span>
                                </>
                            )}
                        </div>

                        <div className="detail-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '15px', marginBottom: '32px' }}>
                            <button
                                className="play-trailer-btn glass-btn primary-action-btn"
                                onClick={() => {
                                    setPlayerConfig({
                                        type: details.name ? 'tv' : 'movie',
                                        season: 1,
                                        episode: 1
                                    });
                                    setShowPlayer(true);
                                }}
                                style={{
                                    backgroundColor: 'rgba(229, 9, 20, 0.8)', // Netflix Red-ish
                                    border: 'none'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ marginRight: '8px' }}>
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                {details.name ? 'Start Watching' : 'Watch Movie'}
                            </button>

                            {/* Mark as Watched (Watchlist) */}
                            {accountId && (
                                <button
                                    className={`play-trailer-btn glass-btn ${isWatched ? 'watched-active' : ''}`}
                                    onClick={handleToggleWatched}
                                    disabled={updatingWatched}
                                    style={{
                                        backgroundColor: isWatched ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        borderColor: isWatched ? 'rgba(46, 204, 113, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                                        color: isWatched ? '#2ecc71' : 'white',
                                        minWidth: '160px',
                                        opacity: updatingWatched ? 0.7 : 1,
                                        cursor: updatingWatched ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isWatched ? "rgba(46, 204, 113, 0.2)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    {updatingWatched ? 'Updating...' : (isWatched ? 'Watched' : 'Mark Watched')}
                                </button>
                            )}

                            {/* Favorite */}
                            {accountId && (
                                <button
                                    className={`play-trailer-btn glass-btn ${isFavorite ? 'favorite-active' : ''}`}
                                    onClick={handleToggleFavorite}
                                    disabled={updatingFavorite}
                                    style={{
                                        backgroundColor: isFavorite ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                        borderColor: isFavorite ? 'rgba(231, 76, 60, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                                        color: isFavorite ? '#e74c3c' : 'white',
                                        minWidth: '140px',
                                        opacity: updatingFavorite ? 0.7 : 1,
                                        cursor: updatingFavorite ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "#e74c3c" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                    {updatingFavorite ? 'Updating...' : (isFavorite ? 'Favorited' : 'Favorite')}
                                </button>
                            )}

                            {/* Rating */}
                            {accountId && (
                                <div className="glass-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '40px', cursor: 'pointer', position: 'relative' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill={rating > 0 ? "#f1c40f" : "none"} stroke={rating > 0 ? "#f1c40f" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    {updatingRating ? (
                                        <span style={{ color: 'white', fontSize: '14px', fontStyle: 'italic' }}>Saving...</span>
                                    ) : (
                                        <select
                                            value={rating}
                                            onChange={handleRatingChange}
                                            className="rating-select-dropdown"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: rating > 0 ? '#f1c40f' : 'white',
                                                fontSize: '15px',
                                                fontWeight: '500',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                appearance: 'none',
                                                paddingRight: '4px',
                                                fontFamily: 'inherit'
                                            }}
                                        >
                                            <option value={0} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Rate</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                <option key={num} value={num} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>{num} / 10</option>
                                            ))}
                                        </select>
                                    )}
                                    {/* Small dropdown arrow */}
                                    {!updatingRating && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, marginLeft: '-2px' }}>
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="detail-stats-row">
                            <div className="stat-pill glass-pill">
                                <span className="pill-label">Rating</span>
                                <span className="pill-value rating-text">{(details.vote_average * 10).toFixed(0)}%</span>
                            </div>
                            {details.status && (
                                <div className="stat-pill glass-pill">
                                    <span className="pill-label">Status</span>
                                    <span className="pill-value">{details.status}</span>
                                </div>
                            )}
                            {details.revenue > 0 && (
                                <div className="stat-pill glass-pill">
                                    <span className="pill-label">Revenue</span>
                                    <span className="pill-value revenue-text">{formatMoney(details.revenue)}</span>
                                </div>
                            )}
                        </div>

                        <p className="detail-overview">{details.overview}</p>

                        {/* Cast Section */}
                        <div className="detail-section animate-slide-up delay-1">
                            <h3>Top Cast</h3>
                            <div className="cast-scroll-container">
                                {topCast.map(actor => (
                                    <div
                                        key={actor.id}
                                        className="cast-card-minimal clickable"
                                        onClick={() => handleActorClick(actor)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <img
                                            src={actor.profile_path ? getImageUrl(actor.profile_path, 'w185') : 'https://via.placeholder.com/100x100?text=?'}
                                            alt={actor.name}
                                            className="cast-avatar"
                                        />
                                        <div className="cast-text">
                                            <span className="cast-name">{actor.name}</span>
                                            <span className="cast-role">{actor.character}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Seasons Section (for TV Shows) */}
                {details.seasons && details.seasons.length > 0 && (
                    <div className="detail-section animate-slide-up delay-2">
                        <h3>Seasons</h3>
                        <div className="seasons-scroll-container">
                            {details.seasons.map(season => (
                                <div
                                    key={season.id}
                                    className="season-card clickable"
                                    onClick={() => handleSeasonClick(season)}
                                >
                                    <div className="season-poster-wrapper">
                                        <img
                                            src={season.poster_path ? getImageUrl(season.poster_path, 'w300') : 'https://via.placeholder.com/150x225?text=No+Image'}
                                            alt={season.name}
                                            className="season-poster"
                                        />
                                        <div className="season-overlay">
                                            <span className="season-episode-count">{season.episode_count} Episodes</span>
                                        </div>
                                    </div>
                                    <div className="season-info">
                                        <span className="season-name">{season.name}</span>
                                        <span className="season-year">
                                            {season.air_date ? season.air_date.split('-')[0] : 'TBA'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Images Section */}
                {gallery.length > 0 && (
                    <div className="detail-gallery-section animate-slide-up delay-2">
                        <h3>Gallery</h3>
                        <div className="gallery-masonry">
                            {gallery.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="gallery-item clickable"
                                    onClick={() => openLightbox(getImageUrl(img.file_path, 'original'))}
                                >
                                    <img
                                        src={getImageUrl(img.file_path, 'w780')}
                                        alt="Gallery"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieDetail;
