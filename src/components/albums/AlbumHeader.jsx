import React from 'react';
import '../../styles/albums/AlbumDetail.css';

const AlbumHeader = ({
    fullItemData,
    localData,
    tracksCount,
    totalDuration,
    releaseYear,
    viewMode,
    setViewMode,
    onPlayContext,
    onShuffleContext,
    onBack,
    hasOthers
}) => {
    return (
        <>
            <div className="albums-header">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Collections
                </button>
            </div>

            <div className="album-details-header">
                <img
                    src={fullItemData.images?.[0]?.url}
                    alt={fullItemData.name}
                    className="album-details-cover"
                />
                <div className="album-details-info">
                    <p>{localData.type || "Playlist"}</p>
                    <h1>{fullItemData.name}</h1>
                    <p>{fullItemData.owner?.display_name} • {releaseYear ? `${releaseYear} • ` : ""}{tracksCount} songs, {totalDuration}</p>
                    <p className="description">{fullItemData.description}</p>

                    <div className="album-actions">
                        <button className="play-btn-primary" onClick={onPlayContext}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Play
                        </button>
                        <button className="shuffle-btn-secondary" onClick={onShuffleContext}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                            </svg>
                            Shuffle
                        </button>
                        <button
                            className={`shuffle-btn-secondary ${viewMode === 'live' ? 'active' : ''}`}
                            onClick={() => setViewMode(viewMode === 'live' ? 'original' : 'live')}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 7l-7 5 7 5V7z" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            Live Performance
                        </button>

                        {hasOthers && (
                            <button
                                className={`shuffle-btn-secondary ${viewMode === 'others' ? 'active' : ''}`}
                                onClick={() => setViewMode(viewMode === 'others' ? 'original' : 'others')}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                Others
                            </button>
                        )}
                        {localData?.type === 'Movie' && (
                            <button
                                className={`shuffle-btn-secondary ${viewMode === 'info' ? 'active' : ''}`}
                                onClick={() => setViewMode(viewMode === 'info' ? 'original' : 'info')}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                Info
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AlbumHeader;
