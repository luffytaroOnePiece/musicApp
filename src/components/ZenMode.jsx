import React, { useState, useEffect } from 'react';
import '../styles/ZenMode.css';
import GlossySelect from './GlossySelect';
import zenData from '../data/zenMode.json';
import { playTrack, setRepeat } from '../services/spotifyApi';

const ZenMode = ({ onClose, deviceId }) => {
    const [selectedSongIndex, setSelectedSongIndex] = useState(0);
    const [selectedLwpIndex, setSelectedLwpIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initial setup
    useEffect(() => {
        if (!deviceId) return;

        // Play the initial song
        playSelectedSong(0);

        // Cleanup on unmount
        return () => {
            // We don't necessarily want to stop playback, but maybe reset repeat?
            // The user said "until i exist from full model" implying the loopback is bound to this mode.
            if (deviceId) {
                setRepeat('off', deviceId).catch(err => console.error("Failed to turn off repeat", err));
            }
        };
    }, [deviceId]);

    const playSelectedSong = async (index) => {
        if (!deviceId) return;
        const song = zenData.songs[index];
        if (!song) return;

        try {
            const trackUri = `spotify:track:${song.trackid}`;
            await playTrack(deviceId, trackUri);

            // Set repeat to track (loop one song)
            // Small delay to ensure playback started might be safer, but try immediately
            setTimeout(() => {
                setRepeat('track', deviceId).catch(err => console.error("Repeat error", err));
            }, 500);

            setIsPlaying(true);
        } catch (err) {
            console.error("Failed to play song in Zen Mode", err);
        }
    };

    const handleSongChange = (e) => {
        const newIndex = parseInt(e.target.value);
        setSelectedSongIndex(newIndex);
        playSelectedSong(newIndex);
    };

    const handleLwpChange = (e) => {
        setSelectedLwpIndex(parseInt(e.target.value));
    };

    const currentLwp = zenData.lwps[selectedLwpIndex];

    return (
        <div className="zen-mode-overlay">
            {/* Video Background */}
            <video
                key={currentLwp?.url} // Remount video when url changes to ensure autoplay
                className="zen-video-background"
                src={currentLwp?.url}
                autoPlay
                loop
                muted
                playsInline
            />

            {/* Header */}
            <div className="zen-header">
                <h2>Zen Mode</h2>
            </div>

            {/* Close Button */}
            <button className="zen-close-btn" onClick={onClose} title="Exit Zen Mode">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Controls */}
            <div className="zen-controls-container">
                <div className="zen-selectors">
                    <div className="zen-select-group">
                        {/* <label>Live Wallpaper</label> */}
                        <GlossySelect
                            label="Live Wallpaper"
                            value={selectedLwpIndex}
                            onChange={handleLwpChange}
                            options={zenData.lwps.map((lwp, idx) => ({
                                value: idx,
                                label: lwp.name
                            }))}
                        />
                    </div>

                    <div className="zen-select-group">
                        {/* <label>Soundtrack</label> */}
                        <GlossySelect
                            label="Soundtrack"
                            value={selectedSongIndex}
                            onChange={handleSongChange}
                            options={zenData.songs.map((song, idx) => ({
                                value: idx,
                                label: song.name
                            }))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZenMode;
