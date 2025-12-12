import React, { useEffect, useState } from 'react';
import { getUserPlaylists, getPlaylistTracks, playTrack } from '../services/spotifyApi';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import HomeView from './HomeView';
import PlaylistView from './PlaylistView';
import PlayerBar from './PlayerBar';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { player, paused, currentTrack, duration, position } = useSpotifyPlayer();

    // Data State
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [deviceId, setDeviceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'
    const [currentTheme, setCurrentTheme] = useState('ocean-depths');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const themes = [
        { id: 'ocean-depths', name: 'Ocean Depths' },
        { id: 'sunset-vibes', name: 'Sunset Vibes' }
    ];

    // Fetch Playlists on Mount
    useEffect(() => {
        setLoading(true);
        getUserPlaylists()
            .then(data => {
                setPlaylists(data.items || []);
                setError(null);
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load playlists. Please refresh or login again.");
            })
            .finally(() => setLoading(false));
    }, []);

    // Listen for Player Ready
    useEffect(() => {
        if (player) {
            player.addListener('ready', ({ device_id }) => {
                setDeviceId(device_id);
            });
        }
    }, [player]);

    // Handlers
    const handleSelectPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        const data = await getPlaylistTracks(playlist.id);
        setTracks(data.items.map(item => item.track));
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
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const goHome = () => {
        setSelectedPlaylist(null);
    };

    return (
        <div className={`dashboard-container ${currentTheme} ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>

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

            <div className="main-content" style={{ position: 'relative' }}>
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="sidebar-open-floating"
                        title="Show Library"
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            zIndex: 100,
                            margin: 0
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                )}

                <TopBar
                    currentTheme={currentTheme}
                    setCurrentTheme={setCurrentTheme}
                    themes={themes}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    goHome={goHome}
                />

                {selectedPlaylist ? (
                    <PlaylistView
                        selectedPlaylist={selectedPlaylist}
                        tracks={tracks}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        handlePlay={handlePlay}
                        formatTime={formatTime}
                    />
                ) : (
                    <HomeView
                        playlists={playlists}
                        handleSelectPlaylist={handleSelectPlaylist}
                        loading={loading}
                        error={error}
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
            />
        </div>
    );
};

export default Dashboard;

