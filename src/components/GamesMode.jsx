import React, { useState, useEffect } from 'react';
import '../styles/ZenMode.css';
import GlossySelect from './GlossySelect';
import gamesDataContext from '../data/games.json';
import { playTrack, setRepeat, getPlaylistTracks } from '../services/spotifyApi';

const GamesMode = ({ onClose, deviceId }) => {
    const [selectedGameIndex, setSelectedGameIndex] = useState(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedSongIndex, setSelectedSongIndex] = useState(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [songs, setSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const baseURL = gamesDataContext.baseURL;
    const gamesConfig = gamesDataContext.games;

    const currentGameObj = gamesConfig[selectedGameIndex];
    // Object structure: {"Forza Horizan 6": "fh6", "playlist": "...", "images": [...]}
    const gameName = Object.keys(currentGameObj).find(k => k !== 'playlist' && k !== 'images');
    const gameFolder = currentGameObj[gameName];
    const playlistId = currentGameObj.playlist;
    const imagesList = currentGameObj.images;

    // Flatten images array into usable format
    const currentImages = imagesList.map(img => {
        const id = Object.keys(img)[0];
        return { id, name: img[id] };
    });

    // Handle game change - Fetch new songs from playlist
    useEffect(() => {
        const fetchSongs = async () => {
            if (!playlistId) return;
            setIsLoading(true);
            try {
                const data = await getPlaylistTracks(playlistId);
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
                console.error("Failed to fetch Games Mode songs", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSongs();
        // Reset local selections
        setSelectedImageIndex(0);
        setSelectedSongIndex(0);
    }, [playlistId]);

    // Setup to play once loaded
    useEffect(() => {
        if (!deviceId || songs.length === 0 || isLoading) return;

        if (!isPlaying) {
            playSelectedSong(0);
        }

        return () => {
            if (deviceId) {
                setRepeat('off', deviceId).catch(err => console.error("Failed to turn off repeat", err));
            }
        };
    }, [deviceId, songs, isLoading]); // Wait for load to finish

    const playSelectedSong = async (index) => {
        if (!deviceId) return;
        const song = songs[index];
        if (!song) return;

        try {
            const trackUri = song.uri || `spotify:track:${song.trackid}`;
            await playTrack(deviceId, trackUri);

            setTimeout(() => {
                setRepeat('track', deviceId).catch(err => console.error("Repeat error", err));
            }, 500);

            setIsPlaying(true);
        } catch (err) {
            console.error("Failed to play song in Games Mode", err);
        }
    };

    const handleGameChange = (e) => {
        const newIndex = parseInt(e.target.value);
        setSelectedGameIndex(newIndex);
        setIsPlaying(false);
    };

    const handleSongChange = (e) => {
        const newIndex = parseInt(e.target.value);
        setSelectedSongIndex(newIndex);
        playSelectedSong(newIndex);
    };

    const handleImageChange = (e) => {
        setSelectedImageIndex(parseInt(e.target.value));
    };

    const activeImageObj = currentImages[selectedImageIndex] || currentImages[0];
    const imageDbUrl = activeImageObj ? `${baseURL}/${gameFolder}/main/${activeImageObj.id}.jpg` : '';

    return (
        <div className="zen-mode-overlay">
            {/* Background Image */}
            {imageDbUrl && (
                <img
                    key={imageDbUrl}
                    className="games-image-background"
                    src={imageDbUrl}
                    alt={activeImageObj?.name || 'Game Background'}
                />
            )}

            {/* Header */}
            <div className="zen-header">
                <h2>Games Mode</h2>
            </div>

            {/* Close Button */}
            <button className="zen-close-btn" onClick={onClose} title="Exit Games Mode">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Controls */}
            <div className="zen-controls-container">
                <div className="zen-selectors">
                    <div className="zen-select-group">
                        <GlossySelect
                            label="Select Game"
                            value={selectedGameIndex}
                            onChange={handleGameChange}
                            options={gamesConfig.map((g, idx) => {
                                const gName = Object.keys(g).find(k => k !== 'playlist' && k !== 'images');
                                return { value: idx, label: gName };
                            })}
                        />
                    </div>

                    <div className="zen-select-group">
                        <GlossySelect
                            label="Wallpaper"
                            value={selectedImageIndex}
                            onChange={handleImageChange}
                            options={currentImages.map((img, idx) => ({
                                value: idx,
                                label: img.name
                            }))}
                        />
                    </div>

                    <div className="zen-select-group">
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

export default GamesMode;
