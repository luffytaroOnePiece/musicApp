import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPlaylist } from '../../services/spotifyApi';
import othersData from '../../data/others.json';
import AlbumCard from "./AlbumCard";
import privateAlbums from '../../data/privateAlbums.json';
import movieAlbums from '../../data/movieAlbums.json';
import '../../styles/albums/AlbumDetail.css';

// Sub-components
import AlbumHeader from './AlbumHeader';
// NewsSection removed
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
        // Force "Srikar" for local collections to show "More by Srikar"
        if (localData && (localData.type === 'Private' || localData.type === 'Movie')) {
            return "Srikar";
        }

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

        // Special Case: "Srikar" -> Show 10 random albums matching Type & Language
        if (currentArtistName.toLowerCase().includes("srikar")) {
            const targetType = localData?.type;
            const targetLang = localData?.language;

            const filteredEntries = Object.entries(allAlbums).filter(([id, meta]) => {
                if (id === fullItemData.id) return false;
                // Filter by Type if exists
                if (targetType && meta.type !== targetType) return false;
                // Filter by Language if exists
                if (targetLang && meta.language !== targetLang) return false;
                return true;
            });

            // Shuffle
            for (let i = filteredEntries.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredEntries[i], filteredEntries[j]] = [filteredEntries[j], filteredEntries[i]];
            }
            return filteredEntries.slice(0, 10);
        }

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

    // -- Fetch Images for "More by Artist" --
    const [enrichedMoreByArtist, setEnrichedMoreByArtist] = useState([]);

    useEffect(() => {
        let mounted = true;
        if (moreByArtist.length === 0) {
            setEnrichedMoreByArtist([]);
            return;
        }

        const fetchImages = async () => {
            const promises = moreByArtist.map(async ([id, meta]) => {
                // If we already have images images (unlikely for local), use them
                if (meta.images) return [id, meta];

                try {
                    // Start with placeholder to avoid flicker if API is slow
                    // But we want the real image
                    const data = await getPlaylist(id);
                    if (data && mounted) {
                        return [id, { ...meta, images: data.images }];
                    }
                } catch (e) {
                    console.warn("Failed to fetch image for", id, e);
                }
                return [id, meta];
            });

            const results = await Promise.all(promises);
            if (mounted) setEnrichedMoreByArtist(results);
        };

        fetchImages();

        return () => { mounted = false; };
    }, [moreByArtist]);

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

            {enrichedMoreByArtist.length > 0 && (
                <div className="more-by-artist-section">
                    <h2>More by {currentArtistName}</h2>
                    <div className="albums-grid">
                        {enrichedMoreByArtist.map(([id, meta]) => (
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
