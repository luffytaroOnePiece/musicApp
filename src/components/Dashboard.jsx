import React, { useEffect, useState } from "react";
import {
    getUserPlaylists,
    getPlaylistTracks,
    playTrack,
    searchTracks,
} from "../services/spotifyApi";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import HomeView from "./HomeView";
import PlaylistView from "./PlaylistView";
import PlayerBar from "./PlayerBar";

import FullPlayer from "./FullPlayer";
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

    const [searchTerm, setSearchTerm] = useState("");
    const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

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
                setPlaylists(data.items || []);
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

    // Handlers
    const handleSelectPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        setSearchResults(null); // Clear search results when selecting playlist
        const data = await getPlaylistTracks(playlist.id);
        setTracks(
            data.items.map((item) => ({
                ...item.track,
                added_at: item.added_at,
            }))
        );
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
        if (contextUri) {
            playTrack(deviceId, contextUri, offset);
        } else {
            playTrack(deviceId, trackUri);
        }
    };

    const handleSeek = (e) => {
        if (player) player.seek(e.target.value * 1000);
    };

    const handleVolume = (e) => {
        if (player) player.setVolume(e.target.value / 100);
    };

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
    };

    return (
        <div
            className={`dashboard-container ${currentTheme} ${!isSidebarOpen ? "sidebar-collapsed" : ""
                }`}
        >
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                playlists={playlists}
                selectedPlaylist={selectedPlaylist}
                handleSelectPlaylist={handleSelectPlaylist}
                loading={loading}
                error={error}
                goHome={goHome}
            />

            <div className="main-content" style={{ position: "relative" }}>
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="sidebar-open-floating"
                        title="Show Library"
                        style={{
                            position: "absolute",
                            top: "20px",
                            left: "20px",
                            zIndex: 100,
                            margin: 0,
                        }}
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
                />

                {/* Content Rendering Logic */}
                {isSearching ? (
                    <div
                        style={{ paddingTop: "80px", textAlign: "center", color: "#fff" }}
                    >
                        Searching...
                    </div>
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
                        formatTime={formatTime}
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
        </div>
    );
};

export default Dashboard;
