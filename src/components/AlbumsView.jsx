import React, { useState, useEffect, useMemo } from 'react';
import { getPlaylist } from '../services/spotifyApi';
import albumsData from '../data/albums.json';
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
    const t = new Set(["All"]);
    const l = new Set(["All"]);

    Object.values(albumsData).forEach(album => {
        if (album.type) t.add(album.type);
        if (album.language) l.add(album.language);
    });

    return {
        types: Array.from(t).sort(),
        languages: Array.from(l).sort()
    };
}, []);

// Initial Load - Metadata for list (Treating them as Playlists now)
useEffect(() => {
    const fetchMetadata = async () => {
        setLoading(true);
        const metadata = {};
        for (const [spotifyId, localData] of Object.entries(albumsData)) {
            try {
                // USER CLARIFIED: These are Playlist IDs
                const playlist = await getPlaylist(spotifyId);
                metadata[spotifyId] = {
                    ...localData,
                    spotifyName: playlist.name,
                    images: playlist.images,
                    owner: playlist.owner?.display_name,
                    description: playlist.description
                };
            } catch (err) {
                console.error(`Failed to fetch playlist ${spotifyId}`, err);
                metadata[spotifyId] = { ...localData, error: true };
            }
        }
        setItemsMetadata(metadata);
        setLoading(false);
    };

    if (!selectedId) {
        fetchMetadata();
    }
}, [selectedId]);

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
            linked_format: albumsData[selectedId].format
        };
    }).filter(Boolean);

    handlePlay(trackUri, queue.map(t => t.uri), 0, queue);
};

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


if (loading) return <div className="albums-loading">Loading...</div>;

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

// List View
return (
    <div className="albums-view-container">
        <div className="albums-header">
            <h2>Collections</h2>
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
    </div>
);
};

export default AlbumsView;
