import React, { useState, useEffect } from 'react';
import '../styles/ZenMode.css';
import GlossySelect from './GlossySelect';
import zenData from '../data/zenMode.json';
import { playTrack, setRepeat, getPlaylistTracks } from '../services/spotifyApi';

const ZenMode = ({ onClose, deviceId }) => {
    const [selectedSongIndex, setSelectedSongIndex] = useState(0);
    const [selectedLwpIndex, setSelectedLwpIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [songs, setSongs] = useState([]);

    // Fetch songs from playlist
    useEffect(() => {
        const fetchSongs = async () => {
            if (!zenData.playlistId) return;
            try {
                const data = await getPlaylistTracks(zenData.playlistId);
                if (data && data.items) {
                    const fetchedSongs = data.items
                        .filter(item => item.track) // Ensure track exists
                        .map(item => ({
                            name: item.track.name,
                            trackid: item.track.id,
                            uri: item.track.uri
                        }));
                    setSongs(fetchedSongs);
                }
            } catch (err) {
                console.error("Failed to fetch Zen Mode songs", err);
            }
        };
        fetchSongs();
    }, []);

    // Initial setup - Play once songs are loaded
    useEffect(() => {
        if (!deviceId || songs.length === 0) return;

        // Play the initial song if not already playing
        // We check !isPlaying to avoid restarting on re-renders if logic overlaps
        if (!isPlaying) {
            playSelectedSong(0);
        }

        // Cleanup on unmount
        return () => {
            if (deviceId) {
                setRepeat('off', deviceId).catch(err => console.error("Failed to turn off repeat", err));
            }
        };
    }, [deviceId, songs]); // Depend on songs so it triggers after fetch

    const playSelectedSong = async (index) => {
        if (!deviceId) return;
        const song = songs[index];
        if (!song) return;

        try {
            const trackUri = song.uri || `spotify:track:${song.trackid}`;
            await playTrack(deviceId, trackUri);

            // Set repeat to track (loop one song)
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
                            options={songs.map((song, idx) => ({
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
