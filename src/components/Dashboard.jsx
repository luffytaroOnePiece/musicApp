import React, { useEffect, useState } from 'react';
import { logout } from '../services/auth';
import { getUserPlaylists, getPlaylistTracks, playTrack } from '../services/spotifyApi';
import useSpotifyPlayer from '../hooks/useSpotifyPlayer';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { player, paused, currentTrack } = useSpotifyPlayer();
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [deviceId, setDeviceId] = useState(null);

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

    const handlePlay = (trackUri) => {
        if (!deviceId) return;
        playTrack(deviceId, trackUri);
    };

    return (
        <div className="dashboard-container">
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
                <button onClick={logout} className="logout-btn">Logout</button>
            </div>

            <div className="main-content">
                <header className="main-header">
                    {selectedPlaylist && (
                        <div className="playlist-info">
                            {selectedPlaylist.images?.[0] && <img src={selectedPlaylist.images[0].url} alt={selectedPlaylist.name} />}
                            <h1>{selectedPlaylist.name}</h1>
                        </div>
                    )}
                </header>

                <div className="tracks-list">
                    {tracks.map((track, index) => (
                        <div key={track.id} className="track-item" onClick={() => handlePlay(track.uri)}>
                            <div className="track-index">{index + 1}</div>
                            <div className="track-title">
                                <div className="track-name">{track.name}</div>
                                <div className="track-artist">{track.artists.map(a => a.name).join(', ')}</div>
                            </div>
                            <div className="track-album">{track.album.name}</div>
                            <div className="track-duration">{Math.floor(track.duration_ms / 60000)}:{((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="player-bar">
                {currentTrack ? (
                    <div className="now-playing">
                        <img src={currentTrack.album.images[0].url} alt="Album Art" />
                        <div className="now-playing-info">
                            <div className="np-name">{currentTrack.name}</div>
                            <div className="np-artist">{currentTrack.artists.map(a => a.name).join(', ')}</div>
                        </div>
                    </div>
                ) : (
                    <div className="now-playing">
                        <div className="np-placeholder">Select a song to play</div>
                    </div>
                )}

                <div className="player-controls">
                    <button className="control-btn" onClick={() => player?.previousTrack()}>⏮</button>
                    <button className="control-btn play-btn" onClick={() => player?.togglePlay()}>
                        {paused ? '▶' : '⏸'}
                    </button>
                    <button className="control-btn" onClick={() => player?.nextTrack()}>⏭</button>
                </div>

                <div className="player-volume">
                    {/* Volume slider could go here */}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
