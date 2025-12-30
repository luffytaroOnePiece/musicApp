import React, { useState, useEffect, useMemo } from 'react';
import { getPlaylist } from '../services/spotifyApi';
import albumsData from '../data/albums.json';
import youtubeLinks from '../data/youtubeLinks.json';
import YouTubeCard from './youtube/YouTubeCard';
import AlbumFilters from './albums/AlbumFilters';
import '../styles/AlbumsView.css';

const AlbumsView = ({ handlePlay, searchTerm }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [itemsMetadata, setItemsMetadata] = useState({});
    const [fullItemData, setFullItemData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [selectedType, setSelectedType] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");

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

    // All Songs State
    const [viewMode, setViewMode] = useState('albums'); // 'albums' | 'all-songs'
    const [allSongs, setAllSongs] = useState([]);
    const [loadingSongs, setLoadingSongs] = useState(false);

    // Initial Load - Metadata for list (Treating them as Playlists now)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Cache check: if we already have data, don't re-fetch
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

                // Parallel Fetching
                const results = await Promise.all(
                    entries.map(async ([spotifyId, localData]) => {
                        try {
                            const playlist = await getPlaylist(spotifyId);
                            // If playlist is null from API?
                            if (!playlist) throw new Error("Playlist not found");

                            return [spotifyId, {
                                ...localData,
                                spotifyName: playlist.name,
                                images: playlist.images,
                                owner: playlist.owner?.display_name,
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

    // Filter Logic
    const filteredItems = useMemo(() => {
        return Object.entries(itemsMetadata).filter(([id, meta]) => {
            const matchesType = selectedType === "All" || meta.type === selectedType;
            const matchesLanguage = selectedLanguage === "All" || meta.language === selectedLanguage;

            // Also Filter by Search Term from top bar if present
            const matchesSearch = !searchTerm || (meta.name || "").toLowerCase().includes(searchTerm.toLowerCase());

            return matchesType && matchesLanguage && matchesSearch;
        });
    }, [itemsMetadata, selectedType, selectedLanguage, searchTerm]);

    // Fetch All Songs for current filter
    useEffect(() => {
        const fetchAllSongs = async () => {
            if (viewMode !== 'all-songs') return;

            setLoadingSongs(true);
            const songs = [];

            // Limit concurrent requests to avoid rate limits?
            // For now, simple Promise.all on filtered items
            const promises = filteredItems.map(async ([id, meta]) => {
                try {
                    // Optimisation: If we have full data cached somewhere use it, else fetch
                    // Note: We don't cache full playlist bodies in itemsMetadata to save memory,
                    // so we likely need to fetch or implement a bigger cache if this is slow.
                    const playlist = await getPlaylist(id);
                    const rawTracks = playlist.tracks.items;
                    const youtubeIDs = albumsData[id].youtubeIDs;

                    return rawTracks.map((item, i) => {
                        if (!item.track || !youtubeIDs[i]) return null;

                        return {
                            ...item.track,
                            linked_youtube_id: youtubeIDs[i],
                            linked_format: albumsData[id].format,
                            related_album_type: meta.type,
                            lyrics: `${item.track.id}.lrc`
                        };
                    }).filter(Boolean);
                } catch (e) {
                    console.error("Failed to fetch tracks for All Songs", id, e);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            results.forEach(tracks => songs.push(...tracks));

            // Fisher-Yates Shuffle
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
    }, [viewMode, filteredItems]); // Re-fetch if filters change

    const handleItemClick = (id) => {
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

    const onPlayWrapper = async (trackUri) => {
        if (!fullItemData) return;
        // Playlist tracks are wrapped in an object: { track: {...} }
        const rawTracks = fullItemData.tracks.items;
        const youtubeIDs = albumsData[selectedId].youtubeIDs;

        const clickedIndex = rawTracks.findIndex(item => item.track.uri === trackUri);
        if (clickedIndex === -1) return;

        // Construct queue
        const queue = rawTracks.map((item, i) => {
            if (!item.track) return null;

            return {
                ...item.track,
                // Inject the YouTube ID and Format
                linked_youtube_id: youtubeIDs[i],
                linked_format: albumsData[selectedId].format,
                lyrics: `${item.track.id}.lrc`
            };
        }).filter(Boolean);

        handlePlay(trackUri, queue.map(t => t.uri), 0, queue);
    };

    const onPlayAllSongs = (trackUri) => {
        // Find index
        const index = allSongs.findIndex(t => t.uri === trackUri);
        if (index === -1) return;

        // Windowed queue for performance if list is huge?
        // For now, pass all. 
        handlePlay(trackUri, allSongs.map(t => t.uri), 0, allSongs);
    };


    const [error, setError] = useState(null);

    if (error) {
        return (
            <div className="albums-error" style={{ padding: '80px', color: 'white', textAlign: 'center' }}>
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', marginTop: '16px' }}>
                    Reload Page
                </button>
            </div>
        );
    }

    if (loading) return <div className="albums-loading">Loading Collections...</div>;

    if (selectedId && fullItemData) {
        // Detail View
        const localData = albumsData[selectedId];
        const tracks = fullItemData.tracks.items;

        return (
            <div className="albums-view-container detail-mode">
                <div className="albums-header">
                    <button className="back-btn" onClick={handleBack}>
                        ← Back to Collections
                    </button>
                    {/* Could disable search or filters here, or let them persist but hide them UI wise */}
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
                        <p>{fullItemData.owner?.display_name} • {localData.language || ""} • {tracks.length} songs</p>
                        <p className="description">{fullItemData.description}</p>
                    </div>
                </div>

                <div className="album-tracks-grid">
                    {tracks.map((item, i) => {
                        const track = item.track;
                        if (!track) return null;

                        const ytId = localData.youtubeIDs[i];
                        // If no user-mapping, we skip/don't show? Or show normal card?
                        // Requirement says "same order as songs". 
                        if (!ytId) return null;

                        const cardData = {
                            name: track.name,
                            youtubelinkID: ytId,
                            genre: localData.type || "Playlist",
                            format: localData.format || "HD"
                        };

                        return (
                            <YouTubeCard
                                key={track.id}
                                trackId={track.id}
                                data={cardData}
                                handlePlay={() => onPlayWrapper(track.uri)}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    // List View (Albums OR All Songs)
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
                <div className="albums-grid">
                    {filteredItems.map(([id, meta]) => (
                        <div key={id} className="album-card" onClick={() => handleItemClick(id)}>
                            <img
                                src={meta.images?.[0]?.url || 'https://via.placeholder.com/300'}
                                alt={meta.name}
                                className="album-cover"
                            />
                            <div className="album-info">
                                <h3>{meta.spotifyName || meta.name}</h3>

                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="no-albums-msg">
                            No collections found matching your filters.
                        </div>
                    )}
                </div>
            ) : (
                <div className="all-songs-grid">
                    {loadingSongs ? (
                        <div className="albums-loading">Loading Songs...</div>
                    ) : (
                        <div className="album-tracks-grid">
                            {allSongs.map((track) => {
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
                                        handlePlay={() => onPlayAllSongs(track.uri)}
                                    />
                                );
                            })}
                            {allSongs.length === 0 && (
                                <div className="no-albums-msg">
                                    No songs found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AlbumsView;
