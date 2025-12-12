import React, { useEffect, useState } from 'react';
import { logout } from '../services/auth';
import { getUserPlaylists, getPlaylistTracks, playTrack } from '../services/spotifyApi';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { player, paused, currentTrack, duration, position } = useSpotifyPlayer();
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [deviceId, setDeviceId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'
    const [currentTheme, setCurrentTheme] = useState('ocean-depths'); // New Default theme
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);

    const themes = [
        { id: 'ocean-depths', name: 'Ocean Depths' },
        { id: 'sunset-vibes', name: 'Sunset Vibes' }
    ];

    useEffect(() => {
        getUserPlaylists().then(data => {
            setPlaylists(data.items);
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (player) {
            player.addListener('ready', ({ device_id }) => {
                setDeviceId(device_id);
            });
        }
    }, [player]);

    const handleSelectPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        const data = await getPlaylistTracks(playlist.id);
        setTracks(data.items.map(item => item.track));
    };

    const handlePlay = (trackUri, contextUri = null, offset = 0) => {
        if (!deviceId) return;
        // If we have a context (playlist), play that context starting at the offset
        if (contextUri) {
            playTrack(deviceId, contextUri, offset);
        } else {
            // Fallback for single track
            playTrack(deviceId, trackUri);
        }
    };

    const handleSeek = (e) => {
        if (player) {
            player.seek(e.target.value * 1000);
        }
    };

    const handleVolume = (e) => {
        if (player) {
            player.setVolume(e.target.value / 100);
        }
    }

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`dashboard-container ${currentTheme}`}>
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Library</h2>
                </div>
                <ul className="playlist-list">
                    {playlists.map(p => (
                        <li key={p.id} onClick={() => handleSelectPlaylist(p)} className={selectedPlaylist?.id === p.id ? 'active' : ''}>
                            {p.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="main-content">
                <div className="top-bar-controls">

                    {/* Custom Dropdown for Modern Look */}
                    <div className="custom-theme-dropdown" onClick={() => setThemeMenuOpen(!themeMenuOpen)}>
                        <button className="theme-btn-trigger">
                            {themes.find(t => t.id === currentTheme)?.name}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px', transform: themeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {themeMenuOpen && (
                            <div className="theme-dropdown-menu">
                                {themes.map(t => (
                                    <div
                                        key={t.id}
                                        className={`theme-dropdown-item ${currentTheme === t.id ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentTheme(t.id);
                                            setThemeMenuOpen(false);
                                        }}
                                    >
                                        {t.name}
                                        {currentTheme === t.id && <span className="check">✓</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={logout} className="logout-btn-top">Logout</button>
                </div>
                <header className="main-header">
                    {selectedPlaylist ? (
                        <div className="playlist-info">
                            {selectedPlaylist.images?.[0] && <img src={selectedPlaylist.images[0].url} alt={selectedPlaylist.name} />}
                            <div>
                                <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>{selectedPlaylist.name}</h1>
                                <p style={{ color: '#aaa' }}>{selectedPlaylist.description || `By ${selectedPlaylist.owner.display_name}`}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="welcome-banner">
                            <h1>Welcome Back</h1>
                            <p>Select a playlist to start listening</p>
                        </div>
                    )}

                    {selectedPlaylist && (
                        <div className="view-controls">
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                ≡ List
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                            >
                                :: Grid
                            </button>
                        </div>
                    )}
                </header>

                <div className={`content-area ${viewMode}`}>
                    {tracks.map((track, index) => (
                        <div key={track.id} className={`track-item ${viewMode}`} onClick={() => handlePlay(track.uri, selectedPlaylist?.uri, index)}>
                            {viewMode === 'list' && <div className="track-index">{index + 1}</div>}

                            {/* Card view needs big image, List view needs small/none or layout change */}
                            <div className="track-art">
                                <img src={track.album.images[0]?.url} alt="" />
                                {viewMode === 'card' && <div className="play-overlay">▶</div>}
                            </div>

                            <div className="track-details">
                                <div className="track-name">{track.name}</div>
                                <div className="track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                            </div>

                            {viewMode === 'list' && (
                                <>
                                    <div className="track-album">{track.album.name}</div>
                                    <div className="track-duration">{formatTime(track.duration_ms)}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="player-bar">
                {/* LEFT: Album Art + Info + Volume */}
                <div className="player-section-left">
                    {currentTrack ? (
                        <>
                            <img src={currentTrack.album.images[0].url} alt="Album Art" className="pb-art" />
                            <div className="pb-info">
                                <div className="pb-name">{currentTrack.name}</div>
                                <div className="pb-artist">{currentTrack.artists.map(a => a.name).join(', ')}</div>
                            </div>
                        </>
                    ) : (
                        <div className="pb-placeholder">Select a song</div>
                    )}

                    <div className="pb-volume">
                        <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor" className="vol-icon"><path d="M9.741.534a.75.75 0 0 1 .53-.534h.016a5.55 5.55 0 0 1 2.373 1.053 7.72 7.72 0 0 1 2.622 3.82c.48 1.432.48 3.557 0 4.989a7.72 7.72 0 0 1-2.622 3.82 5.55 5.55 0 0 1-2.373 1.054.75.75 0 0 1-.546-1.464 4.05 4.05 0 0 0 1.737-.77 6.22 6.22 0 0 0 2.13-3.134 6.7 6.7 0 0 0 0-3.834 6.22 6.22 0 0 0-2.13-3.134 4.05 4.05 0 0 0-1.737-.77.75.75 0 0 1 .016-.134zm-6.071 3.52a.75.75 0 0 1 .53-.22h2.25a.75.75 0 0 1 .53.22l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-.53.22H4.2a.75.75 0 0 1-.53-.22L.42 8.364a.75.75 0 0 1 0-1.06l3.25-3.25z"></path></svg>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="50"
                            onChange={handleVolume}
                            className="volume-slider"
                            style={{ '--progress': '50%' }}
                        />
                    </div>
                </div>

                {/* CENTER: Progress Bar Only */}
                <div className="player-section-center">
                    <span className="time-text">{formatTime(position)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration / 1000}
                        value={position / 1000}
                        onChange={handleSeek}
                        className="progress-slider"
                        style={{ '--progress': `${duration ? (position / duration * 100) : 0}%` }}
                    />
                    <span className="time-text">{formatTime(duration)}</span>
                </div>

                {/* RIGHT: Controls + Context */}
                <div className="player-section-right">
                    <button className="control-btn secondary" onClick={() => player?.previousTrack()}>
                        <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path></svg>
                    </button>
                    <button className="control-btn primary-play" onClick={() => player?.togglePlay()}>
                        {paused ? (
                            <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        ) : (
                            <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        )}
                    </button>
                    <button className="control-btn secondary" onClick={() => player?.nextTrack()}>
                        <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path></svg>
                    </button>

                    {currentTrack && <div className="pb-context">{currentTrack.album.name}</div>}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
