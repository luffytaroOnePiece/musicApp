import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPlaylist } from '../services/spotifyApi';
import albumsData from '../data/albums.json';
import othersData from '../data/others.json';
import AlbumsList from './albums/AlbumsList';
import AlbumDetail from './albums/AlbumDetail';
import AlbumsHeader from './albums/AlbumsHeader';
import AggregatedGrid from './albums/AggregatedGrid';
import VideoModal from './common/VideoModal';
import '../styles/AlbumsView.css';

const AlbumsView = ({ handlePlay, searchTerm, formatTime, resetToken }) => {
    // Selection state
    const [selectedId, setSelectedId] = useState(null);
    const [itemsMetadata, setItemsMetadata] = useState({});
    const [fullItemData, setFullItemData] = useState(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('albums'); // 'albums' | 'all-songs' | 'live' | 'others'

    // Filter States
    const [selectedType, setSelectedType] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");

    // Computed Lists State
    const [songsList, setSongsList] = useState([]);
    const [loadingSongs, setLoadingSongs] = useState(false);

    // Modal Playback State
    const [playingVideo, setPlayingVideo] = useState(null);

    // 1. Extract Filter Options
    const { types, languages } = useMemo(() => {
        const t = new Set(["All"]);
        const l = new Set(["All"]);

        if (albumsData) {
            Object.values(albumsData).forEach(album => {
                if (album.type) t.add(album.type);
                if (album.language) l.add(album.language);
            });
        }

        return {
            types: Array.from(t).sort(),
            languages: Array.from(l).sort()
        };
    }, []); // albumsData is static imported json, so empty dependency is fine

    // 2. Initial Load - Metadata
    useEffect(() => {
        let isMounted = true;

        const fetchMetadata = async () => {
            // Avoid re-fetching if we already have data
            if (Object.keys(itemsMetadata).length > 0) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                if (!albumsData) throw new Error("Albums data is missing");
                const entries = Object.entries(albumsData);

                if (entries.length === 0) {
                    if (isMounted) setLoading(false);
                    return;
                }

                if (isMounted) setLoading(true); // Ensure loading is true before start

                const results = await Promise.all(
                    entries.map(async ([spotifyId, localData]) => {
                        try {
                            const playlist = await getPlaylist(spotifyId);
                            if (!playlist) throw new Error("Playlist not found");

                            return [spotifyId, {
                                ...localData,
                                spotifyName: playlist.name,
                                images: playlist.images,
                                owner: playlist.owner?.display_name,
                                release_date: playlist.release_date || (playlist.tracks?.items?.[0]?.track?.album?.release_date),
                                description: playlist.description
                            }];
                        } catch (err) {
                            console.error(`Failed to fetch playlist ${spotifyId}`, err);
                            // Return local data even if Spotify fetch fails, so we don't crash
                            return [spotifyId, { ...localData, error: true, name: localData.name || "Unknown Album" }];
                        }
                    })
                );

                // Shuffle results to randomize album order
                for (let i = results.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [results[i], results[j]] = [results[j], results[i]];
                }

                if (isMounted) {
                    const metadata = Object.fromEntries(results);
                    setItemsMetadata(metadata);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Critical error in AlbumsView", err);
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchMetadata();

        return () => {
            isMounted = false;
        };
        // DEPENDENCY FIX: Remove itemsMetadata from dependency to prevent loop if it updates but length check fails somehow. 
        // Actually, empty dependency is better for "Initial Load".
    }, []);

    // 3. Detail Load
    useEffect(() => {
        const fetchFullData = async () => {
            if (!selectedId) return;
            setLoading(true);
            try {
                const data = await getPlaylist(selectedId);
                setFullItemData(data);
            } catch (err) {
                console.error("Failed to load full playlist", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFullData();
    }, [selectedId]);

    // 4. Reset View when token changes
    useEffect(() => {
        if (resetToken > 0) {
            setSelectedId(null);
            setFullItemData(null);
            setViewMode('albums');
        }
    }, [resetToken]);

    // 5. Fetch Songs Based on viewMode
    useEffect(() => {
        if (viewMode === 'albums') {
            setSongsList([]);
            return;
        }

        const fetchSongs = async () => {
            setLoadingSongs(true);
            const songs = [];

            // Helper: Filter matches
            const isMatch = (meta) => {
                if (!meta) return false;
                const matchesType = selectedType === "All" || meta.type === selectedType;
                const matchesLanguage = selectedLanguage === "All" || meta.language === selectedLanguage;
                return matchesType && matchesLanguage;
            };

            // CASE: OTHERS
            if (viewMode === 'others') {
                // Iterate over othersData
                Object.entries(othersData).forEach(([albumId, videoList]) => {
                    const meta = itemsMetadata[albumId];
                    // Only include if album matches filter (or if we decide Others ignores filters? Let's respect filters)
                    // If itemsMetadata isn't ready, we might miss items. But loading should be done.
                    if (meta && isMatch(meta)) {
                        videoList.forEach(video => {
                            songs.push({
                                id: video.id,
                                name: video.name,
                                type: video.type,
                                albumName: meta.name,
                                videoId: video.id, // Normalized
                                format: "HD",
                                keyId: `other-${video.id}`
                            });
                        });
                    } else if (!meta) {
                        // Fallback if metadata missing but we have others data?
                        // Maybe beneficial to show it anyway?
                        // videoList.forEach(...)
                    }
                });
            }
            // CASE: LIVE OR ALL SONGS
            else {
                // Filter relevant albums logic
                const relevantAlbumIds = Object.keys(itemsMetadata).filter(id => isMatch(itemsMetadata[id]));

                const promises = relevantAlbumIds.map(async (id) => {
                    const meta = itemsMetadata[id];
                    try {
                        // We need full playlist tracks. 
                        // Optimization: Cache this? For now, fetch.
                        const playlist = await getPlaylist(id);
                        if (!playlist || !playlist.tracks) return [];

                        const rawTracks = playlist.tracks.items;
                        const youtubeIDs = albumsData[id]?.youtubeIDs || [];
                        const localFormat = albumsData[id]?.format || "HD";

                        if (viewMode === 'live') {
                            const liveTracks = [];
                            rawTracks.forEach((item, i) => {
                                if (!item.track || !youtubeIDs[i]) return;
                                const ytIds = youtubeIDs[i].split(',');
                                if (ytIds.length > 1) {
                                    const liveIds = ytIds.slice(1);
                                    liveIds.forEach((liveId, liveIndex) => {
                                        liveTracks.push({
                                            id: item.track.id,
                                            name: `${item.track.name} (Live ${liveIndex + 1})`,
                                            videoId: liveId.trim(),
                                            type: "Live Performance",
                                            format: localFormat,
                                            keyId: `${item.track.id}-live-${liveIndex}`,
                                            // context for playback
                                            trackUri: item.track.uri
                                        });
                                    });
                                }
                            });
                            return liveTracks;

                        } else { // all-songs
                            return rawTracks.map((item, i) => {
                                if (!item.track || !youtubeIDs[i]) return null;
                                return {
                                    id: item.track.id,
                                    name: item.track.name,
                                    videoId: youtubeIDs[i], // Full ID string for now
                                    type: meta.type || "Song",
                                    format: localFormat,
                                    keyId: item.track.id,
                                    trackUri: item.track.uri
                                };
                            }).filter(Boolean);
                        }
                    } catch (e) {
                        console.warn("Error fetching tracks for album", id, e);
                        return [];
                    }
                });

                const results = await Promise.all(promises);
                results.forEach(s => songs.push(...s));
            }

            // Shuffle songs
            for (let i = songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }

            setSongsList(songs);
            setLoadingSongs(false);
        };

        fetchSongs();

    }, [viewMode, itemsMetadata, selectedType, selectedLanguage]);


    // Handlers
    const handleItemClick = (id) => {
        setFullItemData(null);
        setLoading(true);
        setSelectedId(id);
    };
    const handleBack = () => {
        setSelectedId(null);
        setFullItemData(null);
    };
    const handleResetFilters = () => {
        setSelectedType("All");
        setSelectedLanguage("All");
    };

    // Playback Handlers
    // 1. All Songs Playback (Play in Spotify)
    const handlePlayAllSongsItem = (item) => {
        // item has trackUri
        // Logic requires playing with context of the 'allSongs' list?
        // Original code: handlePlay(trackUri, allSongs.map(t => t.uri), 0, allSongs);
        // So we play this track, with the current shuffled list as queue.
        if (item.trackUri) {
            const queueUris = songsList.map(s => s.trackUri).filter(Boolean);
            handlePlay(item.trackUri, queueUris, 0, songsList);
        }
    };

    // 2. Default Playback (Modal for Live/Others)
    const handleVideoClick = (id, title) => {
        setPlayingVideo({ id, title });
    };

    // Unified Play Handler for Grid
    const handleGridPlay = (item) => {
        if (viewMode === 'all-songs') {
            handlePlayAllSongsItem(item);
        } else {
            handleVideoClick(item.videoId, item.name);
        }
    };

    // Detail View Handlers (Pass-through)
    const handlePlayTrack = useCallback((trackUri) => {
        if (!fullItemData) return;
        const rawTracks = fullItemData.tracks.items;
        const youtubeIDs = albumsData[selectedId].youtubeIDs;
        const clickedIndex = rawTracks.findIndex(item => item.track.uri === trackUri);
        if (clickedIndex === -1) return;

        const queue = rawTracks.map((item, i) => {
            if (!item.track || !youtubeIDs[i]) return null;
            return {
                ...item.track,
                linked_youtube_id: youtubeIDs[i],
                linked_format: albumsData[selectedId].format,
            };
        }).filter(Boolean);

        handlePlay(trackUri, queue.map(t => t.uri), 0, queue);
    }, [fullItemData, selectedId, handlePlay]); // Re-create only if data changes

    const handlePlayContext = useCallback(() => {
        if (!fullItemData || !albumsData[selectedId]) return;
        const rawTracks = fullItemData.tracks.items;
        const youtubeIDs = albumsData[selectedId].youtubeIDs;
        const queue = rawTracks.map((item, i) => {
            if (!item.track || !youtubeIDs[i]) return null;
            return {
                ...item.track,
                linked_youtube_id: youtubeIDs[i],
                linked_format: albumsData[selectedId].format,
            };
        }).filter(Boolean);

        if (queue.length > 0) {
            handlePlay(queue[0].uri, queue.map(t => t.uri), 0, queue);
        }
    }, [fullItemData, selectedId, handlePlay]);

    const handleShuffleContext = useCallback(() => {
        if (!fullItemData || !albumsData[selectedId]) return;
        const rawTracks = fullItemData.tracks.items;
        const youtubeIDs = albumsData[selectedId].youtubeIDs;
        const queue = rawTracks.map((item, i) => {
            if (!item.track || !youtubeIDs[i]) return null;
            return {
                ...item.track,
                linked_youtube_id: youtubeIDs[i],
                linked_format: albumsData[selectedId].format,
            };
        }).filter(Boolean);

        const shuffledQueue = [...queue];
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }

        if (shuffledQueue.length > 0) {
            handlePlay(shuffledQueue[0].uri, shuffledQueue.map(t => t.uri), 0, shuffledQueue);
        }
    }, [fullItemData, selectedId, handlePlay]);


    // RENDER
    if (error) {
        return (
            <div className="albums-error">
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} >Reload Page</button>
            </div>
        );
    }

    // Detail View
    if (selectedId && fullItemData) {
        return (
            <AlbumDetail
                fullItemData={fullItemData}
                localData={albumsData[selectedId]}
                itemsMetadata={itemsMetadata}
                onBack={handleBack}
                onPlay={handlePlayTrack}
                onPlayContext={handlePlayContext}
                onShuffleContext={handleShuffleContext}
                onAlbumClick={handleItemClick} // For "More by Artist"
                formatTime={formatTime}
            />
        );
    }

    // List View
    const filteredItems = Object.entries(itemsMetadata).filter(([id, meta]) => {
        const matchesType = selectedType === "All" || meta.type === selectedType;
        const matchesLanguage = selectedLanguage === "All" || meta.language === selectedLanguage;
        const matchesSearch = !searchTerm || (meta.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (meta.spotifyName || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesLanguage && matchesSearch;
    });

    return (
        <div className="albums-view-container">
            <VideoModal
                video={playingVideo}
                onClose={() => setPlayingVideo(null)}
            />

            <AlbumsHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                types={types}
                languages={languages}
                onReset={handleResetFilters}
            />

            {/* Check global loading only for initial metadata, BUT show UI if we have data or if ViewMode != albums */}
            {/* Improving UX: If loading is true but we are switching views, we might want to show loading spinner inside the grid area, not replace whole screen optionally */}

            {loading ? (
                <div className="albums-loading">Loading Collections...</div>
            ) : (
                <>
                    {viewMode === 'albums' ? (
                        <AlbumsList
                            items={filteredItems}
                            onItemClick={handleItemClick}
                        />
                    ) : (
                        <AggregatedGrid
                            viewMode={viewMode}
                            items={songsList}
                            loading={loadingSongs}
                            searchTerm={searchTerm}
                            onPlay={handleGridPlay}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default AlbumsView;
