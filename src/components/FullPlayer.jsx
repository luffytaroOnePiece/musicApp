import React, { useState, useEffect, useRef } from 'react';
import '../styles/FullPlayer.css';
import { getAvailableDevices, transferPlayback, getUserQueue, playTrack, setRepeat } from '../services/spotifyApi';
import { getYoutubeLinkData, openYoutubeLink } from '../utils/youtubeUtils';

import FPQueue from './FullPlayerComponents/FPQueue';
import FPDevices from './FullPlayerComponents/FPDevices';
import FPControls from './FullPlayerComponents/FPControls';
import FPProgress from './FullPlayerComponents/FPProgress';

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

    const [queue, setQueue] = useState([]);
    const [showQueue, setShowQueue] = useState(false);
    const queueRef = useRef(null);

    // Close queue when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside BOTH queue popup AND the toggle button (to avoid immediate reopen)
            if (queueRef.current && !queueRef.current.contains(event.target)) {
                setShowQueue(false);
            }
        };

        if (showQueue) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showQueue]);

    const toggleQueue = async () => {
        if (!showQueue) {
            try {
                const data = await getUserQueue();
                if (data && data.queue) {
                    setQueue(data.queue.slice(0, 20)); // Show top 20
                }
            } catch (error) {
                console.error("Failed to fetch queue", error);
            }
        }
        setShowQueue(!showQueue);
    };

    const handleQueueTrackClick = async (trackUri) => {
        if (!player) return;

        try {
            const devicesData = await getAvailableDevices();
            const activeDevice = devicesData.devices.find(d => d.is_active);
            const targetDeviceId = activeDevice ? activeDevice.id : devicesData.devices[0]?.id;

            if (targetDeviceId) {
                await playTrack(targetDeviceId, trackUri);

                // Close queue immediately for better UX
                setShowQueue(false);
                setQueue([]);

                // Wait 500ms for context to establish before forcing repeat off
                setTimeout(async () => {
                    try {
                        await setRepeat('off', targetDeviceId);
                    } catch (err) {
                        console.error("Error setting repeat off:", err);
                    }
                }, 500);
            }
        } catch (e) {
            console.error("Error playing queue track:", e);
        }
    };

    const youtubeData = currentTrack ? (getYoutubeLinkData(currentTrack.id) || (currentTrack.linked_from && getYoutubeLinkData(currentTrack.linked_from.id))) : null;

    if (!currentTrack) return null;

    const albumImage = currentTrack.album?.images?.[0]?.url || 'https://via.placeholder.com/300';
    const artistNames = currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist';

    // Prepare sub-components
    const queueComponent = (
        <FPQueue
            showQueue={showQueue}
            toggleQueue={toggleQueue}
            queue={queue}
            onTrackClick={handleQueueTrackClick}
            queueRef={queueRef}
        />
    );

    const devicesComponent = (
        <FPDevices
            showDevices={showDevices}
            setShowDevices={setShowDevices}
            devices={devices}
            handleDeviceSelect={handleDeviceSelect}
            devicesRef={devicesRef}
        />
    );

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

                            <FPProgress
                                position={position}
                                duration={duration}
                                handleSeek={handleSeek}
                                formatTime={formatTime}
                            />

                            <FPControls
                                player={player}
                                paused={paused}
                                queueComponent={queueComponent}
                                devicesComponent={devicesComponent}
                            />
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

                        <FPProgress
                            position={position}
                            duration={duration}
                            handleSeek={handleSeek}
                            formatTime={formatTime}
                        />

                        <FPControls
                            player={player}
                            paused={paused}
                            queueComponent={queueComponent}
                            devicesComponent={devicesComponent}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default FullPlayer;
