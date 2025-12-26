import React, { useState, useEffect, useRef } from 'react';
import '../styles/FullPlayer.css';
import { getAvailableDevices, transferPlayback, playTrack, setRepeat, nextTrack, prevTrack, pauseTrack, resumePlayback } from '../services/spotifyApi';
import { getYoutubeLinkData, openYoutubeLink } from '../utils/youtubeUtils';

import FPQueue from './FullPlayerComponents/FPQueue';
import FPDevices from './FullPlayerComponents/FPDevices';
import FPControls from './FullPlayerComponents/FPControls';
import FPProgress from './FullPlayerComponents/FPProgress';

const FullPlayer = ({ currentTrack, paused, player, duration, position, handleVolume, handleSeek, formatTime, onClose, savedContext, trackList, deviceId, queueContext }) => {
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

    const toggleQueue = () => {
        setShowQueue(!showQueue);
    };

    const handleQueueTrackClick = async (trackUri) => {
        if (!player) return;

        try {
            const devicesData = await getAvailableDevices();
            const activeDevice = devicesData.devices.find(d => d.is_active);
            const targetDeviceId = activeDevice ? activeDevice.id : devicesData.devices[0]?.id;

            if (targetDeviceId) {
                // Priority 1: Use the Passed Queue Context (from Dashboard)
                // Priority 2: Use the Captured Queue Context (from API - legacy/backup)
                // Priority 3: Fallback to sticky context

                let contextUriToUse = queueContext;

                if (!contextUriToUse && savedContext) {
                    contextUriToUse = savedContext;
                }

                // If context is an array (list of URIs), find the index
                if (Array.isArray(contextUriToUse)) {
                    const trackIndex = contextUriToUse.indexOf(trackUri);
                    if (trackIndex !== -1) {
                        await playTrack(targetDeviceId, contextUriToUse, trackIndex);
                    } else {
                        // Fallback: just play the track if not in list
                        await playTrack(targetDeviceId, trackUri);
                    }
                }
                // If context is a string (Playlist/Album URI)
                else if (typeof contextUriToUse === 'string') {
                    await playTrack(targetDeviceId, contextUriToUse, { uri: trackUri });
                }
                // Fallback: No context
                else {
                    await playTrack(targetDeviceId, trackUri);
                }

                // Close queue immediately
                setShowQueue(false);

                // AGGRESSIVE FIX: Force Repeat OFF again after delay
                setTimeout(async () => {
                    try {
                        await setRepeat('off', targetDeviceId);
                    } catch (err) {
                        console.error("Post-play repeat disable failed:", err);
                    }
                }, 1000);
            }
        } catch (e) {
            console.error("Error playing queue track:", e);
        }
    };
    const handleNext = async () => {
        try {
            if (deviceId) {
                await nextTrack(deviceId);
            } else {
                const devices = await getAvailableDevices();
                const activeDevice = devices.devices.find(d => d.is_active);
                if (activeDevice) await nextTrack(activeDevice.id);
            }
        } catch (e) { console.error(e); }
    };

    const handlePrev = async () => {
        try {
            if (deviceId) {
                await prevTrack(deviceId);
            } else {
                const devices = await getAvailableDevices();
                const activeDevice = devices.devices.find(d => d.is_active);
                if (activeDevice) await prevTrack(activeDevice.id);
            }
        } catch (e) { console.error(e); }
    };

    const handleTogglePlay = async () => {
        try {
            let targetDeviceId = deviceId;

            if (!targetDeviceId) {
                const devices = await getAvailableDevices();
                const activeDevice = devices.devices.find(d => d.is_active);
                if (activeDevice) targetDeviceId = activeDevice.id;
            }

            if (!targetDeviceId) return;

            if (paused) {
                await resumePlayback(targetDeviceId); // Simple resume
            } else {
                await pauseTrack(targetDeviceId);
            }
        } catch (e) { console.error(e); }
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
            queue={trackList}
            onTrackClick={handleQueueTrackClick}
            queueRef={queueRef}
            currentTrackId={currentTrack?.id}
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
                                onNext={handleNext}
                                onPrev={handlePrev}
                                onTogglePlay={handleTogglePlay}
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
                            onNext={handleNext}
                            onPrev={handlePrev}
                            onTogglePlay={handleTogglePlay}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default FullPlayer;
