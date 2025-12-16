import React, { useEffect, useState } from "react";
import {
    getUserPlaylists,
    getPlaylistTracks,
    playTrack,
    searchTracks,
    removeTrackFromPlaylist,
    checkUserSavedTracks,
    saveTracks,
    removeSavedTracks,
    getUserSavedTracks
} from "../services/spotifyApi";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import HomeView from "./HomeView";
import PlaylistView from "./PlaylistView";
import YouTubeView from "./YouTubeView";
import PlayerBar from "./PlayerBar";
import StatsView from "./StatsView";

import FullPlayer from "./FullPlayer";
import ZenMode from "./ZenMode";
import UserProfile from "./UserProfile";
import "../styles/Dashboard.css";

const Dashboard = () => {
    const { player, paused, currentTrack, duration, position } =
        useSpotifyPlayer();

    // Data State
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [deviceId, setDeviceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search State
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // UI State
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'card'
    const [currentTheme, setCurrentTheme] = useState("ocean-depths");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [likedTrackIds, setLikedTrackIds] = useState(new Set()); // Set of strings

    const [searchTerm, setSearchTerm] = useState("");
    const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
    const [showYoutube, setShowYoutube] = useState(false);
    const [isZenModeOpen, setIsZenModeOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const themes = [
        { id: "ocean-depths", name: "Ocean Depths" },
        { id: "sunset-vibes", name: "Sunset Vibes" },
        { id: "midnight-nebula", name: "Midnight Nebula" },
        { id: "forest-rain", name: "Forest Rain" },
        { id: "cyber-city", name: "Cyber City" },
        { id: "royal-velvet", name: "Royal Velvet" },
    ];

    // Fetch Playlists on Mount
    useEffect(() => {
        setLoading(true);
        getUserPlaylists()
            .then((data) => {
                const userPlaylists = data.items || [];
                const likedSongsPlaylist = {
                    id: 'liked-songs',
                    name: 'Liked Songs',
                    images: [{ url: 'https://misc.scdn.co/liked-songs/liked-songs-300.png' }], // Standard Spotify Liked Songs cover or similar
                    owner: { display_name: 'You' },
                    description: 'Your saved tracks'
                };
                setPlaylists([likedSongsPlaylist, ...userPlaylists]);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load playlists. Please refresh or login again.");
            })
            .finally(() => setLoading(false));
    }, []);

    // Listen for Player Ready
    useEffect(() => {
        if (player) {
            player.addListener("ready", ({ device_id }) => {
                setDeviceId(device_id);
            });
        }
    }, [player]);

    // Check Favorites Status
    useEffect(() => {
        const checkFavorites = async () => {
            if (tracks.length === 0) return;
            // Get unique IDs only
            const ids = [...new Set(tracks.map(t => t.id).filter(id => id))];
            if (ids.length === 0) return;

            try {
                const results = await checkUserSavedTracks(ids);
                const newLiked = new Set();
                results.forEach((isLiked, index) => {
                    if (isLiked) newLiked.add(ids[index]);
                });
                setLikedTrackIds(newLiked);
            } catch (err) {
                console.error("Failed to check favorites", err);
            }
        };
        checkFavorites();
    }, [tracks]); // Re-run when tracks change

    // Handlers
    const handleSelectPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        setSearchResults(null); // Clear search results when selecting playlist

        try {
            let data;
            if (playlist.id === 'liked-songs') {
                data = await getUserSavedTracks();
            } else {
                data = await getPlaylistTracks(playlist.id);
            }

            setTracks(
                data.items.map((item) => ({
                    ...item.track,
                    added_at: item.added_at,
                }))
            );
        } catch (err) {
            console.error("Failed to load tracks", err);
        }
    };

    const performSearch = async () => {
        if (!searchTerm) return;
        setIsSearching(true);
        setSearchResults(null);
        setSelectedPlaylist(null); // Clear playlist selection

        try {
            const data = await searchTracks(searchTerm);
            setSearchResults(data.tracks.items);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePlay = (trackUri, contextUri = null, offset = 0) => {
        if (!deviceId) return;

        // Determine which list of tracks to use
        const activeTracks = searchResults || tracks;

        // If contextUri is provided (playlist/album) and it's a real Spotify context, play that
        // However, for search results, contextUri is usually empty or custom.
        if (contextUri && !Array.isArray(contextUri) && contextUri.includes("spotify:")) {
            playTrack(deviceId, contextUri, offset);
        } else {
            // Otherwise, play the current list of tracks (search results or playlist) as a queue
            // If contextUri is an array (e.g. from Shuffle), use it.
            // Otherwise derive from active tracks.
            const uris = Array.isArray(contextUri) ? contextUri : activeTracks.map(t => t.uri);

            // If the passed trackUri is in our list, use its index as offset
            // otherwise fallback to passed offset or 0
            const trackIndex = trackUri ? uris.indexOf(trackUri) : -1;
            const finalOffset = trackIndex !== -1 ? trackIndex : offset;

            if (uris.length > 0) {
                playTrack(deviceId, uris, finalOffset);
            }
        }
    };

    const handleSeek = (e) => {
        if (player) player.seek(e.target.value * 1000);
    };

    const handleVolume = (e) => {
        if (player) player.setVolume(e.target.value / 100);
    };

    const handleRemoveTrack = async (trackUri) => {
        if (!selectedPlaylist) return;

        // Optimistic UI update
        const originalTracks = [...tracks];
        setTracks(tracks.filter(t => t.uri !== trackUri));

        try {
            if (selectedPlaylist.id === 'liked-songs') {
                // Determine track ID from URI (spotify:track:ID)
                const trackId = trackUri.split(':').pop();
                await removeSavedTracks([trackId]);
                // Update liked state map too
                const nextLiked = new Set(likedTrackIds);
                nextLiked.delete(trackId);
                setLikedTrackIds(nextLiked);
            } else {
                await removeTrackFromPlaylist(selectedPlaylist.id, trackUri);
            }
        } catch (err) {
            console.error("Failed to remove track", err);
            setTracks(originalTracks);
            alert("Failed to remove track");
        }
    };

    const handleToggleFavorite = async (trackId) => {
        const isLiked = likedTrackIds.has(trackId);
        // Optimistic update
        const nextLiked = new Set(likedTrackIds);
        if (isLiked) nextLiked.delete(trackId);
        else nextLiked.add(trackId);
        setLikedTrackIds(nextLiked);

        try {
            if (isLiked) {
                await removeSavedTracks([trackId]);
            } else {
                await saveTracks([trackId]);
            }
        } catch (err) {
            console.error("Failed to toggle favorite", err);
            // Revert
            setLikedTrackIds(likedTrackIds);
        }
    }

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const goHome = () => {
        setSelectedPlaylist(null);
        setSearchTerm(""); // Optional: clear search on home
        setSearchResults(null);
        setIsSearching(false);
        setShowYoutube(false);
        setIsStatsOpen(false);
        setIsProfileOpen(false);
    };

    const handleShowYoutube = () => {
        setSelectedPlaylist(null);
        setSearchResults(null);
        setIsSearching(false);
        setShowYoutube(true);
        setIsStatsOpen(false);
        setIsProfileOpen(false);
    };

    const handleShowZenMode = () => {
        setIsZenModeOpen(true);
    };

    const handleShowStats = () => {
        setSelectedPlaylist(null);
        setSearchResults(null);
        setIsSearching(false);
        setShowYoutube(false);
        setIsStatsOpen(true);
        setIsProfileOpen(false);
    }

    const handleShowProfile = () => {
        setSelectedPlaylist(null);
        setSearchResults(null);
        setIsSearching(false);
        setShowYoutube(false);
        setIsStatsOpen(false);
        setIsProfileOpen(true);
    }

    const getActiveModule = () => {
        if (isZenModeOpen) return 'zen';
        if (showYoutube) return 'youtube';
        if (isStatsOpen) return 'stats';
        if (isProfileOpen) return 'profile';
        return 'home';
    };

    const handleModuleSelect = (moduleId) => {
        if (moduleId === 'home') {
            goHome();
            setIsZenModeOpen(false);
        } else if (moduleId === 'youtube') {
            handleShowYoutube();
            setIsZenModeOpen(false);
        } else if (moduleId === 'zen') {
            handleShowZenMode();
        } else if (moduleId === 'stats') {
            handleShowStats();
            setIsZenModeOpen(false);
        } else if (moduleId === 'profile') {
            handleShowProfile();
            setIsZenModeOpen(false);
        }
    };

    // Helper for add track (missing function in view but logic likely similar to other handlers)
    const handleAddTrackToPlaylist = async (trackUri, playlistId) => {
        try {
            await import("../services/spotifyApi").then(module => module.addTrackToPlaylist(playlistId, trackUri));
            alert("Track added to playlist!");
        } catch (err) {
            console.error("Failed to add track", err);
            alert("Failed to add track to playlist.");
        }
    };

    return (
        <div
            className={`dashboard-container ${currentTheme} ${!isSidebarOpen ? "sidebar-collapsed" : ""
                }`}
        >
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                activeModule={getActiveModule()}
                onModuleSelect={handleModuleSelect}
            />

            <div className="main-content">
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="sidebar-open-floating"
                        title="Show Library"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                )}

                <TopBar
                    currentTheme={currentTheme}
                    setCurrentTheme={setCurrentTheme}
                    themes={themes}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    goHome={goHome}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    performSearch={performSearch}
                    onShowYoutube={handleShowYoutube}
                    onShowZenMode={handleShowZenMode}
                />

                {/* Content Rendering Logic */}
                {isSearching ? (
                    <div className="dashboard-searching">
                        Searching...
                    </div>
                ) : showYoutube ? (
                    <YouTubeView handlePlay={handlePlay} searchTerm={searchTerm} />
                ) : isStatsOpen ? (
                    <StatsView handlePlay={handlePlay} formatTime={formatTime} />
                ) : isProfileOpen ? (
                    <UserProfile />
                ) : searchResults ? (
                    <PlaylistView
                        selectedPlaylist={{
                            name: `Search Results for ${searchTerm}`,
                            description: "Songs from Spotify",
                            images: [],
                            owner: { display_name: "Spotify" },
                            uri: "",
                        }}
                        tracks={searchResults}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        handlePlay={handlePlay}
                        deviceId={deviceId}
                        formatTime={formatTime}
                        onAddTrack={handleAddTrackToPlaylist}
                        playlists={playlists}
                        likedTrackIds={likedTrackIds}
                        onToggleFavorite={handleToggleFavorite}
                    />
                ) : selectedPlaylist ? (
                    <PlaylistView
                        selectedPlaylist={selectedPlaylist}
                        tracks={tracks}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        handlePlay={handlePlay}
                        formatTime={formatTime}
                        searchTerm={searchTerm}
                        deviceId={deviceId}
                        onRemoveTrack={handleRemoveTrack}
                        likedTrackIds={likedTrackIds}
                        onToggleFavorite={handleToggleFavorite}
                    />
                ) : (
                    <HomeView
                        playlists={playlists}
                        handleSelectPlaylist={handleSelectPlaylist}
                        loading={loading}
                        error={error}
                        searchTerm={searchTerm}
                    />
                )}
            </div>

            <PlayerBar
                currentTrack={currentTrack}
                paused={paused}
                player={player}
                duration={duration}
                position={position}
                handleVolume={handleVolume}
                handleSeek={handleSeek}
                formatTime={formatTime}
                onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
            />

            {isFullPlayerOpen && (
                <FullPlayer
                    currentTrack={currentTrack}
                    paused={paused}
                    player={player}
                    duration={duration}
                    position={position}
                    handleVolume={handleVolume}
                    handleSeek={handleSeek}
                    formatTime={formatTime}
                    onClose={() => setIsFullPlayerOpen(false)}
                />
            )}

            {isZenModeOpen && (
                <ZenMode
                    onClose={() => setIsZenModeOpen(false)}
                    deviceId={deviceId}
                />
            )}
        </div>
    );
};

export default Dashboard;
