import React, { useState, useEffect, useCallback, useMemo } from 'react';
import othersData from '../../data/others.json';
import AlbumCard from "./AlbumCard";
import privateAlbums from '../../data/privateAlbums.json';
import movieAlbums from '../../data/movieAlbums.json';
import '../../styles/albums/AlbumDetail.css';

// Sub-components
import AlbumHeader from './AlbumHeader';
import NewsSection from './NewsSection';
import AlbumTracks from './AlbumTracks';

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
    const [viewMode, setViewMode] = useState("original"); // 'original' | 'live' | 'others' | 'news'
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("Original");
    const [playingVideo, setPlayingVideo] = useState(null);

    // Basic Metadata
    const tracks = fullItemData.tracks.items;
    const albumOthers = othersData[fullItemData.id];

    // Stats
    const totalDurationMs = tracks.reduce((acc, curr) => acc + (curr.track?.duration_ms || 0), 0);
    const formattedTotalDuration = formatTime(totalDurationMs);
    const releaseYear = fullItemData.release_date?.split('-')[0];

    // "More by Artist"
    // IMPROVED: For playlists, artists array might be empty or generic. Try to get from first track.
    const currentArtistName = useMemo(() => {
        if (fullItemData.artists && fullItemData.artists.length > 0 && fullItemData.artists[0].name !== "Spotify") {
            return fullItemData.artists[0].name;
        }
        // Fallback: Check first track
        if (fullItemData.tracks?.items?.[0]?.track?.artists?.[0]?.name) {
            return fullItemData.tracks.items[0].track.artists[0].name;
        }
        return localData.name;
    }, [fullItemData, localData]);

    const moreByArtist = useMemo(() => {
        if (!currentArtistName) return [];
        const allAlbums = { ...movieAlbums, ...privateAlbums };
        return Object.entries(allAlbums)
            .filter(([id, meta]) => id !== fullItemData.id && meta.name === currentArtistName)
            .slice(0, 10);
    }, [currentArtistName, fullItemData.id]);


    // -- Filter/Sort Logic for Tracks --
    const getFilteredTracks = useCallback(() => {
        let filtered = tracks.filter(item => {
            if (!localSearchTerm) return true;
            return item.track.name.toLowerCase().includes(localSearchTerm.toLowerCase());
        });

        if (sortOrder === "Title") {
            filtered.sort((a, b) => a.track.name.localeCompare(b.track.name));
        } else if (sortOrder === "Duration") {
            filtered.sort((a, b) => b.track.duration_ms - a.track.duration_ms);
        } else if (sortOrder === "Date Added") {
            filtered.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
        }
        // Original/Date Published - effectively original order for now or needs more data
        return filtered;
    }, [tracks, localSearchTerm, sortOrder]);

    const visibleTracks = getFilteredTracks();


    const handleVideoClick = useCallback((id, title) => {
        setPlayingVideo({ id, title });
    }, []);

    const closePlayer = useCallback(() => {
        setPlayingVideo(null);
    }, []);

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

            <AlbumHeader
                fullItemData={fullItemData}
                localData={localData}
                tracksCount={tracks.length}
                totalDuration={formattedTotalDuration}
                releaseYear={releaseYear}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onPlayContext={onPlayContext}
                onShuffleContext={onShuffleContext}
                onBack={onBack}
                hasOthers={albumOthers && albumOthers.length > 0}
            />

            {viewMode === 'news' ? (
                <NewsSection artistName={localData.name} />
            ) : (
                <AlbumTracks
                    viewMode={viewMode}
                    albumOthers={albumOthers}
                    visibleTracks={visibleTracks}
                    tracks={tracks}
                    localData={localData}
                    handleVideoClick={handleVideoClick}
                    onPlay={onPlay}
                    localSearchTerm={localSearchTerm}
                    setLocalSearchTerm={setLocalSearchTerm}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                />
            )}

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

export default AlbumDetail;
