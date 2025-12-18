import React, { useState, useEffect, useRef } from 'react';
import '../styles/FullPlayer.css';
import { getAvailableDevices, transferPlayback } from '../services/spotifyApi';
import { getYoutubeLinkData, openYoutubeLink } from '../utils/youtubeUtils';

const FullPlayer = ({ currentTrack, paused, player, duration, position, handleVolume, handleSeek, formatTime, onClose }) => {
    const [devices, setDevices] = useState([]);
    const [showDevices, setShowDevices] = useState(false);
    const devicesRef = useRef(null);

    // Close devices popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (devicesRef.current && !devicesRef.current.contains(event.target)) {
                setShowDevices(false);
            }
        };

        if (showDevices) {
            document.addEventListener('mousedown', handleClickOutside);
            fetchDevices();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDevices]);

    const fetchDevices = async () => {
        try {
            const data = await getAvailableDevices();
            setDevices(data.devices || []);
        } catch (error) {
            console.error('Error fetching devices:', error);
        }
    };

    const handleDeviceSelect = async (deviceId) => {
        try {
            await transferPlayback(deviceId, true);
            setShowDevices(false);
        } catch (error) {
            console.error('Error transferring playback:', error);
        }
    };

    const youtubeData = currentTrack ? (getYoutubeLinkData(currentTrack.id) || (currentTrack.linked_from && getYoutubeLinkData(currentTrack.linked_from.id))) : null;

    if (!currentTrack) return null;

    const albumImage = currentTrack.album?.images?.[0]?.url || 'https://via.placeholder.com/300';
    const artistNames = currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist';

    return (
        <div className={`full-player-overlay ${youtubeData ? 'fp-split-layout' : ''}`}>
            {/* ... (keep existing background/backdrop) */}
            <div className="fp-background" style={{ backgroundImage: `url(${albumImage})` }}></div>
            <div className="fp-backdrop"></div>

            <button className="fp-close-btn" onClick={onClose}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <div className="fp-content">
                {youtubeData ? (
                    /* --- Split Layout --- */
                    <div className="fp-split-container">
                        {/* Left Side: Player Controls */}
                        <div className="fp-left-section">
                            <div className="fp-art-container small">
                                <img
                                    src={albumImage}
                                    alt={currentTrack.album?.name || "Album Art"}
                                    className="fp-art"
                                />
                            </div>

                            <div className="fp-track-info">
                                <h2 className="fp-title">{currentTrack.name}</h2>
                                <p className="fp-artist">{artistNames}</p>
                            </div>

                            <div className="fp-progress-container">
                                <span className="time-text">{formatTime(position)}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration / 1000}
                                    value={position / 1000}
                                    onChange={handleSeek}
                                    className="progress-slider fp-slider"
                                    style={{ '--progress': `${duration ? (position / duration * 100) : 0}%` }}
                                />
                                <span className="time-text">{formatTime(duration)}</span>
                            </div>

                            <div className="fp-controls">
                                <div className="fp-controls-main">
                                    <button className="control-btn secondary" onClick={() => player?.previousTrack()}>
                                        <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path></svg>
                                    </button>

                                    <button className="control-btn primary-play fp-play-btn" onClick={() => player?.togglePlay()}>
                                        {paused ? (
                                            <svg role="img" height="32" width="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                        ) : (
                                            <svg role="img" height="32" width="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                        )}
                                    </button>

                                    <button className="control-btn secondary" onClick={() => player?.nextTrack()}>
                                        <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path></svg>
                                    </button>
                                </div>

                                <div className="fp-controls-extra">
                                    <div className="fp-devices-container" ref={devicesRef}>
                                        <button
                                            className={`control-btn secondary fp-device-btn ${showDevices || (devices.length > 0 && devices.find(d => d.is_active)?.type !== 'Computer') ? 'active' : ''}`}
                                            onClick={() => setShowDevices(!showDevices)}
                                            title="Connect to a device"
                                        >
                                            <svg role="img" height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5zm-6 0a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 0 1 0 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path>
                                                <path d="M13 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
                                            </svg>
                                        </button>

                                        {showDevices && (
                                            <div className="fp-devices-list">
                                                <div className="fp-devices-header">
                                                    <h3>Connect to a device</h3>
                                                    <img src="https://open.spotifycdn.com/cdn/images/device-picker-header.png" alt="Devices" className="fp-devices-header-img" />
                                                </div>
                                                {devices.length > 0 ? (
                                                    <ul>
                                                        {devices.map(device => (
                                                            <li
                                                                key={device.id}
                                                                className={`fp-device-item ${device.is_active ? 'active-device' : ''}`}
                                                                onClick={() => handleDeviceSelect(device.id)}
                                                            >
                                                                <div className="fp-device-icon">
                                                                    {device.type === 'Smartphone' ? (
                                                                        <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-7zM4 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V3z"></path></svg>
                                                                    ) : device.type === 'Computer' ? (
                                                                        <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3zm2-½a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H3zM1 14.5A1.5 1.5 0 0 1 2.5 13h11a1.5 1.5 0 0 1 1.5 1.5v.5h-15v-.5z"></path></svg>
                                                                    ) : (
                                                                        <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5zm-6 0a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 0 1 0 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path></svg>
                                                                    )}
                                                                </div>
                                                                <div className="fp-device-info">
                                                                    <span className={`fp-device-name ${device.is_active ? 'active-text' : ''}`}>{device.name}</span>
                                                                    <span className="fp-device-model">{device.type} • {device.is_active ? 'Active' : 'Spotify Connect'}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="fp-no-devices">No devices found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="fp-right-section">
                            <div className="fp-youtube-card">
                                <img
                                    src={`https://img.youtube.com/vi/${youtubeData.youtubelinkID}/maxresdefault.jpg`}
                                    alt="YouTube Thumbnail"
                                    className="fp-youtube-thumb"
                                />
                                <div className="fp-youtube-overlay">
                                    <div className="fp-overlay-buttons">
                                        <button className="fp-watch-btn transparent-play" onClick={() => openYoutubeLink(currentTrack.id)}>
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="fp-youtube-info">
                                <h3>Available on YouTube</h3>
                                <p>{youtubeData.name} • {youtubeData.quality || youtubeData.format}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- Standard Layout --- */
                    <>
                        <div className="fp-art-container">
                            <img
                                src={albumImage}
                                alt={currentTrack.album?.name || "Album Art"}
                                className="fp-art"
                            />
                        </div>

                        <div className="fp-track-info">
                            <h2 className="fp-title">{currentTrack.name}</h2>
                            <p className="fp-artist">{artistNames}</p>
                        </div>

                        <div className="fp-progress-container">
                            <span className="time-text">{formatTime(position)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration / 1000}
                                value={position / 1000}
                                onChange={handleSeek}
                                className="progress-slider fp-slider"
                                style={{ '--progress': `${duration ? (position / duration * 100) : 0}%` }}
                            />
                            <span className="time-text">{formatTime(duration)}</span>
                        </div>

                        <div className="fp-controls">
                            <div className="fp-controls-main">
                                <button className="control-btn secondary" onClick={() => player?.previousTrack()}>
                                    <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path></svg>
                                </button>

                                <button className="control-btn primary-play fp-play-btn" onClick={() => player?.togglePlay()}>
                                    {paused ? (
                                        <svg role="img" height="32" width="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                    ) : (
                                        <svg role="img" height="32" width="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    )}
                                </button>

                                <button className="control-btn secondary" onClick={() => player?.nextTrack()}>
                                    <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path></svg>
                                </button>
                            </div>

                            <div className="fp-controls-extra">
                                <div className="fp-devices-container" ref={devicesRef}>
                                    <button
                                        className={`control-btn secondary fp-device-btn ${showDevices || (devices.length > 0 && devices.find(d => d.is_active)?.type !== 'Computer') ? 'active' : ''}`}
                                        onClick={() => setShowDevices(!showDevices)}
                                        title="Connect to a device"
                                    >
                                        <svg role="img" height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5zm-6 0a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 0 1 0 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path>
                                            <path d="M13 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
                                        </svg>
                                    </button>

                                    {showDevices && (
                                        <div className="fp-devices-list">
                                            <div className="fp-devices-header">
                                                <h3>Connect to a device</h3>
                                                <img src="https://open.spotifycdn.com/cdn/images/device-picker-header.png" alt="Devices" className="fp-devices-header-img" />
                                            </div>
                                            {devices.length > 0 ? (
                                                <ul>
                                                    {devices.map(device => (
                                                        <li
                                                            key={device.id}
                                                            className={`fp-device-item ${device.is_active ? 'active-device' : ''}`}
                                                            onClick={() => handleDeviceSelect(device.id)}
                                                        >
                                                            <div className="fp-device-icon">
                                                                {device.type === 'Smartphone' ? (
                                                                    <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-7zM4 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V3z"></path></svg>
                                                                ) : device.type === 'Computer' ? (
                                                                    <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3zm2-½a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5H3zM1 14.5A1.5 1.5 0 0 1 2.5 13h11a1.5 1.5 0 0 1 1.5 1.5v.5h-15v-.5z"></path></svg>
                                                                ) : (
                                                                    <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75C6 1.784 6.784 1 7.75 1h6.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25h-6.5zm-6 0a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25H4V11H1.75A1.75 1.75 0 0 1 0 9.25v-6.5C0 1.784.784 1 1.75 1H4v1.5H1.75zM4 15H2v-1.5h2V15z"></path></svg>
                                                                )}
                                                            </div>
                                                            <div className="fp-device-info">
                                                                <span className={`fp-device-name ${device.is_active ? 'active-text' : ''}`}>{device.name}</span>
                                                                <span className="fp-device-model">{device.type} • {device.is_active ? 'Active' : 'Spotify Connect'}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="fp-no-devices">No devices found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FullPlayer;
