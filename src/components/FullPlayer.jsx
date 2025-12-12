import React from 'react';
import '../styles/FullPlayer.css';

const FullPlayer = ({ currentTrack, paused, player, duration, position, handleVolume, handleSeek, formatTime, onClose }) => {
    if (!currentTrack) return null;

    return (
        <div className="full-player-overlay">
            <div className="fp-background" style={{ backgroundImage: `url(${currentTrack.album.images[0].url})` }}></div>
            <div className="fp-backdrop"></div>

            <button className="fp-close-btn" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <div className="fp-content">
                <div className="fp-art-container">
                    <img
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.album.name}
                        className="fp-art"
                    />
                </div>

                <div className="fp-track-info">
                    <h2 className="fp-title">{currentTrack.name}</h2>
                    <p className="fp-artist">{currentTrack.artists.map(a => a.name).join(', ')}</p>
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
            </div>

        </div>
    );
};

export default FullPlayer;
