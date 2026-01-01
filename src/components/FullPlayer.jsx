import React, { useState } from 'react';
import '../styles/FullPlayer.css';
import { getAvailableDevices, nextTrack, prevTrack, pauseTrack, resumePlayback } from '../services/spotifyApi';
import { getYoutubeLinkData } from '../utils/youtubeUtils';

import FPQueue from './FullPlayerComponents/FPQueue';
import FPDevices from './FullPlayerComponents/FPDevices';
import FPSplitLayout from './FullPlayerComponents/FPSplitLayout';
import FPStandardLayout from './FullPlayerComponents/FPStandardLayout';
import FPVibeLayout from './FullPlayerComponents/FPVibeLayout';

import useFPDevices from '../hooks/useFPDevices';
import useFPQueue from '../hooks/useFPQueue';

const FullPlayer = ({ currentTrack, paused, player, duration, position, handleVolume, handleSeek, formatTime, onClose, savedContext, trackList, deviceId, queueContext }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);

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

    // Resolve the track from the local queue/trackList if possible to get custom properties like linked_youtube_id
    const localTrack = trackList && currentTrack ? trackList.find(t => t.id === currentTrack.id) : null;
    const targetTrack = localTrack || currentTrack;

    const youtubeData = targetTrack ? (
        targetTrack.linked_youtube_id ? {
            youtubelinkID: targetTrack.linked_youtube_id,
            name: targetTrack.name,
            format: targetTrack.linked_format || "HD",
            useEmbed: true,
            lyrics: targetTrack.lyrics
        } :
            (getYoutubeLinkData(targetTrack.id) || (targetTrack.linked_from && getYoutubeLinkData(targetTrack.linked_from.id)))
    ) : null;

    if (!currentTrack) return null;

    let originalAlbumImage = currentTrack.album?.images?.[0]?.url || 'https://via.placeholder.com/300';
    let bgImage = originalAlbumImage;

    // USER REQUEST: In full view mode background should be based on youtube video thumbnail theme only in collections page
    if (targetTrack?.linked_youtube_id) {
        const bgId = targetTrack.linked_youtube_id.split(',')[0].trim();
        bgImage = `https://img.youtube.com/vi/${bgId}/maxresdefault.jpg`;
    }

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
            <div className="fp-background" style={{ backgroundImage: `url(${bgImage})` }}></div>
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
                        albumImage={originalAlbumImage}
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
                        onToggleLyrics={() => setShowLyrics(prev => !prev)}
                        showLyrics={showLyrics}
                        hasLyrics={!!youtubeData?.lyrics}
                    />
                ) : (
                    <FPStandardLayout
                        currentTrack={currentTrack}
                        artistNames={artistNames}
                        albumImage={originalAlbumImage}
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
