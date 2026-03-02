/**
 * YouTubeMusicView.jsx
 *
 * An EXACT clone of AlbumsView.jsx — same components, same FullPlayer, same
 * Spotify audio playback — but the data comes from movieYoutubeMapper.json
 * (keyed by TMDB ID) and album covers are fetched from TMDB Instead of Spotify.
 *
 * movieYoutubeMapper.json shape:
 *  {
 *    "<tmdbId>": {
 *      "name": "...",
 *      "language": "...",
 *      "spotifyID": "...",
 *      "youtubeIDs": [...]
 *    }
 *  }
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getPlaylist } from "../services/spotifyApi";
import { getDetails, getImageUrl } from "../services/tmdbApi";
import movieYoutubeMapper from "../data/movieYoutubeMapper.json";

import AlbumsList from "./albums/AlbumsList";
import AlbumDetail from "./albums/AlbumDetail";
import AlbumsHeader from "./albums/AlbumsHeader";
import AggregatedGrid from "./albums/AggregatedGrid";
import VideoModal from "./common/VideoModal";
import "../styles/AlbumsView.css";           // reuse Albums styles 100%

// ─── Build spotifyID-keyed data (matching movieAlbums.json format) ────────────
// This is what AlbumDetail's `localData` and all internal helpers expect.
const ytMusicData = {};
const tmdbIdBySpotifyId = {};   // reverse-lookup: spotifyId → tmdbId

Object.entries(movieYoutubeMapper).forEach(([tmdbId, data]) => {
    if (!data.spotifyID) return;
    const sid = data.spotifyID;
    ytMusicData[sid] = {
        name: data.name,
        language: data.language,
        youtubeIDs: data.youtubeIDs || [],
        type: "Movie",
        tmdbID: tmdbId,       // AlbumDetail uses this to fetch TMDB backdrop/images
        format: "HD",
    };
    tmdbIdBySpotifyId[sid] = tmdbId;
});

// ─── Component ────────────────────────────────────────────────────────────────
const YouTubeMusicView = ({ handlePlay, searchTerm, formatTime, resetToken }) => {
    // ── Selection ──
    const [selectedId, setSelectedId] = useState(null);
    const [itemsMetadata, setItemsMetadata] = useState({});
    const [fullItemData, setFullItemData] = useState(null);

    // ── UI ──
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState("albums");

    // ── Filters ──
    const [selectedType, setSelectedType] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const [selectedSort, setSelectedSort] = useState("Default");

    // ── Songs (aggregated grid – live / all-songs / others) ──
    const [songsList, setSongsList] = useState([]);
    const [loadingSongs, setLoadingSongs] = useState(false);

    // ── Video modal ──
    const [playingVideo, setPlayingVideo] = useState(null);

    // ── Filter options ──────────────────────────────────────────────────────────
    const { types, languages } = useMemo(() => {
        const t = new Set(["All"]);
        const l = new Set(["All"]);
        Object.values(ytMusicData).forEach((album) => {
            if (album.type) t.add(album.type);
            if (album.language) l.add(album.language);
        });
        return { types: Array.from(t).sort(), languages: Array.from(l).sort() };
    }, []);

    // ── 1. Initial load — metadata (Spotify + TMDB poster) ─────────────────────
    useEffect(() => {
        let isMounted = true;

        const fetchMetadata = async () => {
            if (Object.keys(itemsMetadata).length > 0) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                const entries = Object.entries(ytMusicData);
                if (entries.length === 0) { setLoading(false); return; }

                if (isMounted) setLoading(true);

                // Shuffle for random display order
                for (let i = entries.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [entries[i], entries[j]] = [entries[j], entries[i]];
                }

                const BATCH_SIZE = 5;
                const DELAY_MS = 400;
                const chunk = (arr, size) =>
                    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
                        arr.slice(i * size, i * size + size)
                    );

                for (const batch of chunk(entries, BATCH_SIZE)) {
                    if (!isMounted) break;

                    const batchResults = await Promise.all(
                        batch.map(async ([spotifyId, localData]) => {
                            try {
                                // Fetch Spotify playlist (for tracks & fallback name)
                                const playlist = await getPlaylist(spotifyId);
                                if (!playlist) throw new Error("Playlist not found");

                                // Fetch TMDB poster to override Spotify cover art
                                let tmdbPoster = null;
                                if (localData.tmdbID) {
                                    try {
                                        const tmdbData = await getDetails(localData.tmdbID, "movie");
                                        if (tmdbData?.poster_path) {
                                            tmdbPoster = getImageUrl(tmdbData.poster_path, "w500");
                                        }
                                    } catch { /* fallback to Spotify image */ }
                                }

                                return [
                                    spotifyId,
                                    {
                                        ...localData,
                                        spotifyName: playlist.name,
                                        // Inject TMDB poster as primary image — AlbumCard reads images[0].url
                                        images: tmdbPoster
                                            ? [{ url: tmdbPoster }, ...(playlist.images || [])]
                                            : playlist.images,
                                        owner: playlist.owner?.display_name,
                                        release_date:
                                            playlist.release_date ||
                                            playlist.tracks?.items?.[0]?.track?.album?.release_date,
                                        description: playlist.description,
                                    },
                                ];
                            } catch (err) {
                                console.error(`Failed to fetch playlist ${spotifyId}`, err);
                                return [
                                    spotifyId,
                                    { ...localData, error: true, name: localData.name || "Unknown" },
                                ];
                            }
                        })
                    );

                    if (isMounted) {
                        setItemsMetadata((prev) => ({
                            ...prev,
                            ...Object.fromEntries(batchResults),
                        }));
                        setLoading(false);
                    }

                    await new Promise((r) => setTimeout(r, DELAY_MS));
                }
            } catch (err) {
                console.error("Critical error in YouTubeMusicView", err);
                if (isMounted) { setError(err.message); setLoading(false); }
            }
        };

        fetchMetadata();
        return () => { isMounted = false; };
    }, []);

    // ── 2. Detail load ──────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchFull = async () => {
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
        fetchFull();
    }, [selectedId]);

    // ── 3. Reset on token change ────────────────────────────────────────────────
    useEffect(() => {
        if (resetToken > 0) {
            setSelectedId(null);
            setFullItemData(null);
            setViewMode("albums");
        }
    }, [resetToken]);

    // ── 4. Aggregated songs view (all-songs / live — no "others" in this data) ─
    useEffect(() => {
        if (viewMode === "albums") { setSongsList([]); return; }

        const fetchSongs = async () => {
            setLoadingSongs(true);
            const songs = [];

            const isMatch = (meta) => {
                if (!meta) return false;
                const matchType = selectedType === "All" || meta.type === selectedType;
                const matchLang = selectedLanguage === "All" || meta.language === selectedLanguage;
                return matchType && matchLang;
            };

            const relevantIds = Object.keys(itemsMetadata).filter((id) =>
                isMatch(itemsMetadata[id])
            );

            const promises = relevantIds.map(async (id) => {
                const meta = itemsMetadata[id];
                try {
                    const playlist = await getPlaylist(id);
                    if (!playlist?.tracks) return [];

                    const rawTracks = playlist.tracks.items;
                    const youtubeIDs = ytMusicData[id]?.youtubeIDs || [];
                    const localFormat = ytMusicData[id]?.format || "HD";

                    if (viewMode === "live") {
                        const liveTracks = [];
                        rawTracks.forEach((item, i) => {
                            if (!item.track || !youtubeIDs[i]) return;
                            const ytIds = youtubeIDs[i].split(",");
                            if (ytIds.length > 1) {
                                ytIds.slice(1).forEach((liveId, li) => {
                                    liveTracks.push({
                                        ...item.track,
                                        name: `${item.track.name} (Live ${li + 1})`,
                                        videoId: liveId.trim(),
                                        type: "Live Performance",
                                        format: localFormat,
                                        keyId: `${item.track.id}-live-${li}`,
                                        trackUri: item.track.uri,
                                        linked_youtube_id: liveId.trim(),
                                        linked_format: localFormat,
                                    });
                                });
                            }
                        });
                        return liveTracks;
                    } else {
                        return rawTracks
                            .map((item, i) => {
                                if (!item.track || !youtubeIDs[i]) return null;
                                return {
                                    ...item.track,
                                    videoId: youtubeIDs[i],
                                    type: meta.type || "Song",
                                    format: localFormat,
                                    keyId: item.track.id,
                                    trackUri: item.track.uri,
                                    linked_youtube_id: youtubeIDs[i],
                                    linked_format: localFormat,
                                };
                            })
                            .filter(Boolean);
                    }
                } catch (e) {
                    console.warn("Error fetching tracks for", id, e);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            results.forEach((s) => songs.push(...s));

            // Shuffle
            for (let i = songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [songs[i], songs[j]] = [songs[j], songs[i]];
            }

            setSongsList(songs);
            setLoadingSongs(false);
        };

        fetchSongs();
    }, [viewMode, itemsMetadata, selectedType, selectedLanguage]);

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleItemClick = (id) => { setFullItemData(null); setLoading(true); setSelectedId(id); };
    const handleBack = () => { setSelectedId(null); setFullItemData(null); };
    const handleResetFilters = () => { setSelectedType("All"); setSelectedLanguage("All"); setSelectedSort("Default"); };
    const handleVideoClick = (id, title) => setPlayingVideo({ id, title });

    // Aggregated grid play
    const handleGridPlay = (item) => {
        if (viewMode === "all-songs") {
            if (item.trackUri) {
                const uris = songsList.map((s) => s.trackUri).filter(Boolean);
                handlePlay(item.trackUri, uris, 0, songsList);
            }
        } else {
            handleVideoClick(item.videoId, item.name);
        }
    };

    // Detail play (Spotify audio — same as AlbumsView)
    const handlePlayTrack = useCallback(
        (trackUri) => {
            if (!fullItemData) return;
            const rawTracks = fullItemData.tracks.items;
            const youtubeIDs = ytMusicData[selectedId].youtubeIDs;
            const clickedIndex = rawTracks.findIndex((item) => item.track.uri === trackUri);
            if (clickedIndex === -1) return;

            const queue = rawTracks
                .map((item, i) => {
                    if (!item.track || !youtubeIDs[i]) return null;
                    return {
                        ...item.track,
                        linked_youtube_id: youtubeIDs[i],
                        linked_format: ytMusicData[selectedId].format,
                    };
                })
                .filter(Boolean);

            handlePlay(trackUri, queue.map((t) => t.uri), 0, queue);
        },
        [fullItemData, selectedId, handlePlay]
    );

    const handlePlayContext = useCallback(() => {
        if (!fullItemData || !ytMusicData[selectedId]) return;
        const rawTracks = fullItemData.tracks.items;
        const youtubeIDs = ytMusicData[selectedId].youtubeIDs;
        const queue = rawTracks
            .map((item, i) => {
                if (!item.track || !youtubeIDs[i]) return null;
                return {
                    ...item.track,
                    linked_youtube_id: youtubeIDs[i],
                    linked_format: ytMusicData[selectedId].format,
                };
            })
            .filter(Boolean);
        if (queue.length > 0) handlePlay(queue[0].uri, queue.map((t) => t.uri), 0, queue);
    }, [fullItemData, selectedId, handlePlay]);

    const handleShuffleContext = useCallback(() => {
        if (!fullItemData || !ytMusicData[selectedId]) return;
        const rawTracks = fullItemData.tracks.items;
        const youtubeIDs = ytMusicData[selectedId].youtubeIDs;
        const queue = rawTracks
            .map((item, i) => {
                if (!item.track || !youtubeIDs[i]) return null;
                return {
                    ...item.track,
                    linked_youtube_id: youtubeIDs[i],
                    linked_format: ytMusicData[selectedId].format,
                };
            })
            .filter(Boolean);

        const shuffled = [...queue];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        if (shuffled.length > 0) handlePlay(shuffled[0].uri, shuffled.map((t) => t.uri), 0, shuffled);
    }, [fullItemData, selectedId, handlePlay]);

    // ── Filter + sort for list view ─────────────────────────────────────────────
    const filteredItems = Object.entries(itemsMetadata).filter(([id, meta]) => {
        const matchType = selectedType === "All" || meta.type === selectedType;
        const matchLang = selectedLanguage === "All" || meta.language === selectedLanguage;
        const matchSearch =
            !searchTerm ||
            (meta.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (meta.spotifyName || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchLang && matchSearch;
    });

    const sortedItems = useMemo(() => {
        if (selectedSort === "Default") return filteredItems;
        return [...filteredItems].sort((a, b) => {
            const dateA = new Date(a[1].release_date || 0);
            const dateB = new Date(b[1].release_date || 0);
            return selectedSort === "Date (Newest)" ? dateB - dateA : dateA - dateB;
        });
    }, [filteredItems, selectedSort]);

    // ── Render ───────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="albums-error">
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Reload Page</button>
            </div>
        );
    }

    // Detail view — EXACT same as AlbumsView
    if (selectedId && fullItemData) {
        return (
            <AlbumDetail
                fullItemData={fullItemData}
                localData={ytMusicData[selectedId]}
                itemsMetadata={itemsMetadata}
                onBack={handleBack}
                onPlay={handlePlayTrack}
                onPlayContext={handlePlayContext}
                onShuffleContext={handleShuffleContext}
                onAlbumClick={handleItemClick}
                formatTime={formatTime}
            />
        );
    }

    // List view — EXACT same as AlbumsView
    return (
        <div className="albums-view-container">
            <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />

            <AlbumsHeader
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
                types={types}
                languages={languages}
                onReset={handleResetFilters}
            />

            {loading ? (
                <div className="albums-loading">Loading YT Music Collections...</div>
            ) : (
                <>
                    {viewMode === "albums" ? (
                        <AlbumsList items={sortedItems} onItemClick={handleItemClick} />
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

export default YouTubeMusicView;
