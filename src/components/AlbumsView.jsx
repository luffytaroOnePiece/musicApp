import React, { useState, useEffect, useMemo } from 'react';
import { getPlaylist } from '../services/spotifyApi';
import albumsData from '../data/albums.json';
import youtubeLinks from '../data/youtubeLinks.json';
import YouTubeCard from './youtube/YouTubeCard';
import AlbumFilters from './albums/AlbumFilters';
import AlbumsList from './albums/AlbumsList';
import AlbumDetail from './albums/AlbumDetail';
import '../styles/AlbumsView.css';

const AlbumsView = ({ handlePlay, searchTerm, formatTime, resetToken }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [itemsMetadata, setItemsMetadata] = useState({});
    const [fullItemData, setFullItemData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States
    const [selectedType, setSelectedType] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");

    // All Songs State
    const [viewMode, setViewMode] = useState('albums'); // 'albums' | 'all-songs'
    const [allSongs, setAllSongs] = useState([]);
    const [loadingSongs, setLoadingSongs] = useState(false);

    // Extract Filter Options
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
    }, []);

    // Initial Load - Metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                if (Object.keys(itemsMetadata).length > 0) {
                    setLoading(false);
                    return;
                }

                setLoading(true);
                if (!albumsData) throw new Error("Albums data is missing");

                const entries = Object.entries(albumsData);
                if (entries.length === 0) {
                    setLoading(false);
                    return;
                }

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
                            return [spotifyId, { ...localData, error: true }];
                        }
                    })
                );

                const metadata = Object.fromEntries(results);
                setItemsMetadata(metadata);
            } catch (err) {
                console.error("Critical error in AlbumsView", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (!selectedId) {
            fetchMetadata();
        }
    }, [selectedId, itemsMetadata]);

    // Detail Load
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

    // Reset View when token changes (Albums button clicked again)
    useEffect(() => {
        if (resetToken > 0) {
            setSelectedId(null);
            setFullItemData(null);
            setViewMode('albums');
            // We can also reset filters if desired
            // setSelectedType("All");
            // setSelectedLanguage("All");
        }
    }, [resetToken]);

    // Fetch All Songs
    useEffect(() => {
        const fetchAllSongs = async () => {
            if (viewMode !== 'all-songs') return;

            setLoadingSongs(true);
            const songs = [];

            // Filter items first
            const currentFilteredItems = Object.entries(itemsMetadata).filter(([id, meta]) => {
                const matchesType = selectedType === "All" || meta.type === selectedType;
                const matchesLanguage = selectedLanguage === "All" || meta.language === selectedLanguage;
                // Note: We don't filter all-songs by SEARCH term here to keep "All Songs" truly all, 
                // but we could apply it if desired. Existing logic did apply it.
                // Let's stick to filtering by Type/Language for the "pool" of songs.
                return matchesType && matchesLanguage;
            });

            const promises = currentFilteredItems.map(async ([id, meta]) => {
                try {
                    const playlist = await getPlaylist(id);
                    const rawTracks = playlist.tracks.items;
                    const youtubeIDs = albumsData[id].youtubeIDs;

                    return rawTracks.map((item, i) => {
                        if (!item.track || !youtubeIDs[i]) return null;
                        return {
                            ...item.track,
                            linked_youtube_id: youtubeIDs[i],
                            linked_format: albumsData[id].format,
                            related_album_type: meta.type
                        };
                    }).filter(Boolean);
                } catch (e) {
                    return [];
                }
            });

            const results = await Promise.all(promises);
            results.forEach(tracks => songs.push(...tracks));

            // Shuffle
            for (let i = songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }

            setAllSongs(songs);
            setLoadingSongs(false);
        };

        if (viewMode === 'all-songs') {
            fetchAllSongs();
        }
    }, [viewMode, itemsMetadata, selectedType, selectedLanguage]);


    // Filter Logic for Album List
    const filteredItems = useMemo(() => {
        return Object.entries(itemsMetadata).filter(([id, meta]) => {
            const matchesType = selectedType === "All" || meta.type === selectedType;
            const matchesLanguage = selectedLanguage === "All" || meta.language === selectedLanguage;
            const matchesSearch = !searchTerm || (meta.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (meta.spotifyName || "").toLowerCase().includes(searchTerm.toLowerCase());

            return matchesType && matchesLanguage && matchesSearch;
        });
    }, [itemsMetadata, selectedType, selectedLanguage, searchTerm]);


    // Handlers
    const handleItemClick = (id) => setSelectedId(id);
    const handleBack = () => {
        setSelectedId(null);
        setFullItemData(null);
    };
    const handleResetFilters = () => {
        setSelectedType("All");
        setSelectedLanguage("All");
    };

    const handlePlayTrack = (trackUri) => {
        // Logic to play a specific track from detail view
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
    };

    const handlePlayContext = () => {
        // Play Album Button
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
    };

    const handleShuffleContext = () => {
        // Shuffle Album Button
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
    };

    const handlePlayAllSongsItem = (trackUri) => {
        const index = allSongs.findIndex(t => t.uri === trackUri);
        if (index === -1) return;
        handlePlay(trackUri, allSongs.map(t => t.uri), 0, allSongs);
    };

    if (error) {
        return (
            <div className="albums-error">
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} >Reload Page</button>
            </div>
        );
    }

    if (loading) return <div className="albums-loading">Loading Collections...</div>;

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

    return (
        <div className="albums-view-container">
            <div className="albums-list-header">
                <div className="header-top-row">
                    <h2>Collections</h2>
                    <div className="view-mode-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'albums' ? 'active' : ''}`}
                            onClick={() => setViewMode('albums')}
                        >
                            Albums
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'all-songs' ? 'active' : ''}`}
                            onClick={() => setViewMode('all-songs')}
                        >
                            All Songs
                        </button>
                    </div>
                </div>

                <div className="album-filters-wrapper">
                    <AlbumFilters
                        selectedType={selectedType}
                        setSelectedType={setSelectedType}
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                        types={types}
                        languages={languages}
                        onReset={handleResetFilters}
                    />
                </div>
            </div>

            {viewMode === 'albums' ? (
                <AlbumsList
                    items={filteredItems}
                    onItemClick={handleItemClick}
                />
            ) : (
                <div className="all-songs-grid">
                    {loadingSongs ? (
                        <div className="albums-loading">Loading Songs...</div>
                    ) : (
                        <div className="album-tracks-grid">
                            {allSongs.length > 0 ? (
                                allSongs.map((track) => {
                                    // Re-apply search filter here if needed, currently filtering on Album list metadata not individual songs for perf?
                                    // Logic check: The user requirement was "Search within Album" (Detail view).
                                    // "Search" prop passed to AlbumsView is typically Global Search.
                                    // If Global Search is active, we should filter these songs.
                                    if (searchTerm && !track.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                                        return null;
                                    }

                                    const cardData = {
                                        name: track.name,
                                        youtubelinkID: track.linked_youtube_id,
                                        genre: track.related_album_type || "Playlist",
                                        format: track.linked_format || "HD"
                                    };

                                    return (
                                        <YouTubeCard
                                            key={track.id}
                                            trackId={track.id}
                                            data={cardData}
                                            handlePlay={() => handlePlayAllSongsItem(track.uri)}
                                        />
                                    );
                                })
                            ) : (
                                <div className="no-albums-msg">No songs found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AlbumsView;
