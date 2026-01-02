import React, { useState, useRef, useEffect } from 'react';
import YouTubeCard from '../youtube/YouTubeCard';
import AlbumCard from './AlbumCard';
import '../../styles/albums/AlbumDetail.css';
import '../../styles/YouTubeFilters.css'; // Reuse dropdown styles

import othersData from '../../data/others.json';

const AlbumDetail = ({
    fullItemData,
    localData,
    itemsMetadata,
    onBack,
    onPlay,
    onPlayContext,
    onShuffleContext,
    onAlbumClick,
    formatTime
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("Original"); // 'Original' | 'Title' | 'Duration' | 'Date Added' | 'Date Published'

    const [viewMode, setViewMode] = useState("original"); // 'original' | 'live' | 'others'

    const [playingVideo, setPlayingVideo] = useState(null);

    // Basic Metadata
    const tracks = fullItemData.tracks.items;

    // Check for Others Data
    const albumOthers = othersData[fullItemData.id];

    // Shuffle Others Data
    const shuffledOthers = useMemo(() => {
        if (!albumOthers) return [];
        const shuffled = [...albumOthers];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, [albumOthers]);

    // Calculate Total Duration
    const totalDurationMs = tracks.reduce((acc, item) => acc + (item.track?.duration_ms || 0), 0);
    const formattedTotalDuration = formatTime ? formatTime(totalDurationMs) :
        `${Math.floor(totalDurationMs / 60000)} min`;

    // Get Year
    let releaseYear = "";
    if (tracks.length > 0 && tracks[0].track?.album?.release_date) {
        releaseYear = tracks[0].track.album.release_date.split('-')[0];
    } else if (fullItemData.release_date) {
        releaseYear = fullItemData.release_date.split('-')[0];
    }

    // --- Filter & Sort Logic ---
    let visibleTracks = [...tracks];

    // 1. Filter by Local Search
    if (localSearchTerm) {
        visibleTracks = visibleTracks.filter(item =>
            item.track && item.track.name.toLowerCase().includes(localSearchTerm.toLowerCase())
        );
    }

    // 2. Sort
    if (sortOrder === 'Title') {
        visibleTracks.sort((a, b) => a.track.name.localeCompare(b.track.name));
    } else if (sortOrder === 'Duration') {
        visibleTracks.sort((a, b) => (a.track.duration_ms || 0) - (b.track.duration_ms || 0));
    } else if (sortOrder === 'Date Added') {
        visibleTracks.sort((a, b) => {
            const dateA = new Date(a.added_at || 0); // specific for playlist tracks
            const dateB = new Date(b.added_at || 0);
            return dateB - dateA; // Newest first
        });
    } else if (sortOrder === 'Date Published') {
        visibleTracks.sort((a, b) => {
            // Check specific track album release date, fallback to 0
            const dateA = new Date(a.track?.album?.release_date || 0);
            const dateB = new Date(b.track?.album?.release_date || 0);
            return dateB - dateA; // Newest first
        });
    }

    // --- More By Artist Logic ---
    const currentArtistName = fullItemData.owner?.display_name || (tracks[0]?.track?.artists?.[0]?.name);
    const currentType = localData.type;
    const currentLanguage = localData.language;

    const moreByArtist = React.useMemo(() => {
        return Object.entries(itemsMetadata).filter(([id, meta]) => {
            if (id === fullItemData.id) return false;
            if (meta.type !== currentType) return false; // Filter by same type (Movie/Private)
            if (meta.language !== currentLanguage) return false; // Filter by same language

            const targetName = currentArtistName?.toLowerCase();
            if (!targetName) return false;

            return (meta.name && meta.name.toLowerCase().includes(targetName)) ||
                (meta.owner && meta.owner.toLowerCase().includes(targetName)) ||
                (meta.spotifyName && meta.spotifyName.toLowerCase().includes(targetName));
        }).sort(() => 0.5 - Math.random()).slice(0, 10);
    }, [itemsMetadata, fullItemData.id, currentArtistName, currentType, currentLanguage]);

    const handleVideoClick = (id, title) => {
        setPlayingVideo({ id, title });
    };

    const closePlayer = () => {
        setPlayingVideo(null);
    };

    return (
        <div className="albums-view-container detail-mode">
            {/* Embedded Player Modal */}
            {playingVideo && (
                <div className="live-player-modal-overlay" onClick={closePlayer}>
                    <div className="live-player-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="live-player-close-btn" onClick={closePlayer}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div className="live-player-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&rel=0`}
                                title={playingVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="live-player-iframe"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

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
                    <p>{fullItemData.owner?.display_name} • {releaseYear ? `${releaseYear} • ` : ""}{tracks.length} songs, {formattedTotalDuration}</p>
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
                                <path d="M23 7l-7 5 7 5V7z"></path>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            Live Performance
                        </button>

                        {albumOthers && albumOthers.length > 0 && (
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
                    </div>
                </div>
            </div>

            <div className="album-controls-bar">
                <div className="search-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Find in this album..."
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                </div>

                <div className="sort-dropdown">
                    <DetailDropdown
                        label="Sort by"
                        selected={sortOrder}
                        onSelect={setSortOrder}
                        options={['Original', 'Title', 'Duration', 'Date Added', 'Date Published']}
                    />
                </div>
            </div>

            <div className="album-tracks-grid">
                {viewMode === 'others' ? (
                    albumOthers.map((item, index) => (
                        <YouTubeCard
                            key={item.id}
                            trackId={`other-${index}`}
                            data={{
                                name: item.name,
                                youtubelinkID: item.id,
                                genre: item.type,
                                format: "HD"
                            }}
                            handlePlay={() => handleVideoClick(item.id, item.name)}
                        />
                    ))
                ) : (
                    visibleTracks.map((item) => {
                        const track = item.track;
                        if (!track) return null;

                        // Locate original index for Youtube Mapping
                        const originalIndex = tracks.findIndex(raw => raw.track && raw.track.id === track.id);
                        if (originalIndex === -1) return null;

                        const ytIdRaw = localData.youtubeIDs[originalIndex];
                        if (!ytIdRaw) return null;

                        const ytIds = ytIdRaw.split(',');

                        if (viewMode === 'live') {
                            // Display live versions (index 1+)
                            const liveIds = ytIds.slice(1);
                            if (liveIds.length === 0) return null; // Or return a placeholder?

                            return liveIds.map((liveId, i) => {
                                const cardData = {
                                    name: `${track.name} (Live ${i + 1})`,
                                    youtubelinkID: liveId.trim(),
                                    genre: "Live",
                                    format: localData.format || "HD"
                                };
                                return (
                                    <YouTubeCard
                                        key={`${track.id}-live-${i}`}
                                        trackId={track.id} // Reusing trackId might cause duplicate keys if managed globally, but here we add a unique suffix to the map key. 
                                        // However, the Player might need a unique ID for the queue. 
                                        // For now, let's pass the same trackId as it maps to Spotify metadata.
                                        data={cardData}
                                        handlePlay={() => handleVideoClick(liveId.trim(), cardData.name)}
                                    />
                                );
                            });

                        } else {
                            // Display original version (index 0)
                            const originalId = ytIds[0];
                            const cardData = {
                                name: track.name,
                                youtubelinkID: originalId.trim(),
                                genre: track.album && track.album.release_date ? new Date(track.album.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : (localData.type || "Playlist"),
                                format: localData.format || "HD"
                            };

                            return (
                                <YouTubeCard
                                    key={track.id}
                                    trackId={track.id}
                                    data={cardData}
                                    handlePlay={() => onPlay(track.uri)}
                                />
                            );
                        }
                    })
                )}
            </div>



            {moreByArtist.length > 0 && (
                <div className="more-by-artist-section">
                    <h2>More by {currentArtistName}</h2>
                    <div className="albums-grid">
                        {moreByArtist.map(([id, meta]) => (
                            <AlbumCard
                                key={id}
                                meta={meta}
                                onClick={() => onAlbumClick(id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Reused Dropdown logic from AlbumFilters/YouTubeFilters styling
const DetailDropdown = ({ label, selected, onSelect, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="yt-filter-dropdown" ref={dropdownRef}>
            <button
                className="yt-filter-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
            >
                <span className="yt-dropdown-label" style={{ marginRight: 6 }}>{label}:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selected}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`yt-arrow-icon ${isOpen ? 'open' : ''}`}
                    style={{ marginLeft: 6 }}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="yt-dropdown-menu" style={{ minWidth: 160, right: 0, left: 'auto' }}>
                    {options.map((option) => (
                        <div
                            key={option}
                            className={`yt-dropdown-item ${selected === option ? "active" : ""}`}
                            onClick={() => {
                                onSelect(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                            {selected === option && <span>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlbumDetail;
