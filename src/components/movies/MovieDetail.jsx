import React from 'react';
import { getImageUrl } from '../../services/tmdbApi';

const MovieDetail = ({
    movie,
    details,
    credits,
    images,
    loading,
    onBack
}) => {
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

    // Trim Top Cast to 6
    const topCast = credits?.cast?.slice(0, 6) || [];
    const gallery = images?.backdrops?.slice(0, 6) || [];

    return (
        <div className="movies-view-container movie-detail-view animate-fade-in">
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
                                    <div key={actor.id} className="cast-card-minimal">
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

                {/* Images Section */}
                {gallery.length > 0 && (
                    <div className="detail-gallery-section animate-slide-up delay-2">
                        <h3>Gallery</h3>
                        <div className="gallery-masonry">
                            {gallery.map((img, idx) => (
                                <div key={idx} className="gallery-item">
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
