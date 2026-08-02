import React from 'react';
import '../../styles/albums/AlbumDetail.css';

function formatRevenue(amount) {
    if (!amount) return null;
    if (amount >= 1e9) {
        return `$${(amount / 1e9).toFixed(2)}B`;
    }
    if (amount >= 1e6) {
        return `$${(amount / 1e6).toFixed(1)}M`;
    }
    return `$${amount.toLocaleString()}`;
}

function formatReleaseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const AlbumHeader = ({
    fullItemData,
    localData = {},
    tracksCount,
    totalDuration,
    releaseYear,
    viewMode,
    setViewMode,
    onPlayContext,
    onShuffleContext,
    onBack,
    hasOthers,
    backdropUrl,
    tmdbInfo,
    trailerId,
    onWatchTrailer
}) => {
    const formattedRelease = tmdbInfo?.release_date ? formatReleaseDate(tmdbInfo.release_date) : null;
    const formattedRevenue = tmdbInfo?.revenue ? formatRevenue(tmdbInfo.revenue) : null;
    const rating = tmdbInfo?.vote_average ? tmdbInfo.vote_average.toFixed(1) : null;

    return (
        <div className={`album-banner-hero-container ${backdropUrl ? 'has-backdrop' : ''}`}>
            {backdropUrl && (
                <div 
                    className="album-banner-bg" 
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                />
            )}
            <div className="album-banner-overlay" />

            <div className="albums-header-nav">
                <button className="back-btn-hero" onClick={onBack}>
                    <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Back to Collections
                </button>
            </div>

            <div className="album-details-header">
                <img
                    src={fullItemData.images?.[0]?.url}
                    alt={fullItemData.name}
                    className="album-details-cover"
                />
                <div className="album-details-info">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="album-type-badge">{localData.type || "Playlist"}</span>
                        {localData.watched && (
                            <span className="album-type-badge" style={{ background: 'rgba(100, 189, 172, 0.15)', borderColor: 'rgba(100, 189, 172, 0.35)', color: '#7dd4c0' }}>
                                Watched
                            </span>
                        )}
                    </div>
                    <h1>{fullItemData.name}</h1>
                    <p className="album-meta-text">
                        {fullItemData.owner?.display_name} • {tracksCount} songs, {totalDuration}
                        {formattedRelease && ` • Released: ${formattedRelease}`}
                        {formattedRevenue && ` • Box Office: ${formattedRevenue}`}
                        {rating && ` • ★ ${rating}`}
                    </p>
                    {fullItemData.description && (
                        <p className="description" dangerouslySetInnerHTML={{ __html: fullItemData.description }}></p>
                    )}

                    <div className="album-actions">
                        <button className="play-btn-primary" onClick={onPlayContext}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Play
                        </button>
                        <button className="shuffle-btn-secondary" onClick={onShuffleContext}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                            </svg>
                            Shuffle
                        </button>
                        <button
                            className={`shuffle-btn-secondary ${viewMode === 'live' ? 'active' : ''}`}
                            onClick={() => setViewMode(viewMode === 'live' ? 'original' : 'live')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 7l-7 5 7 5V7z" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            Live Performance
                        </button>

                        {trailerId && (
                            <button className="shuffle-btn-secondary" onClick={() => onWatchTrailer(trailerId)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Trailer
                            </button>
                        )}

                        {hasOthers && (
                            <button
                                className={`shuffle-btn-secondary ${viewMode === 'others' ? 'active' : ''}`}
                                onClick={() => setViewMode(viewMode === 'others' ? 'original' : 'others')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                Others
                            </button>
                        )}
                        {(localData?.type === 'Movie' || localData?.type === 'Private') && (
                            <button
                                className={`shuffle-btn-secondary ${viewMode === 'info' ? 'active' : ''}`}
                                onClick={() => setViewMode(viewMode === 'info' ? 'original' : 'info')}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                                Info
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlbumHeader;
