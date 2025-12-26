import React, { useState } from 'react';
import '../styles/FullPlayer.css';
import { getAvailableDevices, nextTrack, prevTrack, pauseTrack, resumePlayback } from '../services/spotifyApi';
import { getYoutubeLinkData } from '../utils/youtubeUtils';

import FPQueue from './FullPlayerComponents/FPQueue';
import FPDevices from './FullPlayerComponents/FPDevices';
import FPSplitLayout from './FullPlayerComponents/FPSplitLayout';
import FPStandardLayout from './FullPlayerComponents/FPStandardLayout';

import useFPDevices from '../hooks/useFPDevices';
import useFPQueue from '../hooks/useFPQueue';

const FullPlayer = ({ currentTrack, paused, player, duration, position, handleVolume, handleSeek, formatTime, onClose, savedContext, trackList, deviceId, queueContext }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 400); // Match animation duration
    };

    // Use Loops
    const {
        devices,
        showDevices,
        setShowDevices,
        devicesRef,
        handleDeviceSelect
    } = useFPDevices();

    const {
        showQueue,
        toggleQueue,
        handleQueueTrackClick,
        queueRef
    } = useFPQueue({ player, savedContext, queueContext });

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
        <div className={`full-player-overlay ${youtubeData ? 'fp-split-layout' : ''} ${isClosing ? 'closing' : ''}`}>
            <div className="fp-background" style={{ backgroundImage: `url(${albumImage})` }}></div>
            <div className="fp-backdrop"></div>

            <button className="fp-close-btn" onClick={handleClose}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <div className="fp-content">
                {youtubeData ? (
                    <FPSplitLayout
                        currentTrack={currentTrack}
                        artistNames={artistNames}
                        albumImage={albumImage}
                        youtubeData={youtubeData}
                        position={position}
                        duration={duration}
                        handleSeek={handleSeek}
                        formatTime={formatTime}
                        player={player}
                        paused={paused}
                        queueComponent={queueComponent}
                        devicesComponent={devicesComponent}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        onTogglePlay={handleTogglePlay}
                    />
                ) : (
                    <FPStandardLayout
                        currentTrack={currentTrack}
                        artistNames={artistNames}
                        albumImage={albumImage}
                        position={position}
                        duration={duration}
                        handleSeek={handleSeek}
                        formatTime={formatTime}
                        player={player}
                        paused={paused}
                        queueComponent={queueComponent}
                        devicesComponent={devicesComponent}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        onTogglePlay={handleTogglePlay}
                    />
                )}
            </div>
        </div>
    );
};

export default FullPlayer;
