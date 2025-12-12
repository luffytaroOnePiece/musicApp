import React from 'react';
import '../styles/PlayerBar.css';

const PlayerBar = ({ currentTrack, paused, player, duration, position, handleVolume, handleSeek, formatTime, onOpenFullPlayer }) => {
    return (
        <div className="player-bar">
            {/* LEFT: Album Art + Info + Volume */}
            <div className="player-section-left">
                {currentTrack ? (
                    <>
                        <img src={currentTrack.album.images[0].url} alt="Album Art" className="pb-art" onClick={onOpenFullPlayer} />
                        <div className="pb-info">
                            <div className="pb-name">{currentTrack.name}</div>
                            <div className="pb-artist">{currentTrack.artists.map(a => a.name).join(', ')}</div>
                        </div>
                    </>
                ) : (
                    <div className="pb-placeholder">Select a song</div>
                )}

                <div className="pb-volume">
                    <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor" className="vol-icon"><path d="M9.741.534a.75.75 0 0 1 .53-.534h.016a5.55 5.55 0 0 1 2.373 1.053 7.72 7.72 0 0 1 2.622 3.82c.48 1.432.48 3.557 0 4.989a7.72 7.72 0 0 1-2.622 3.82 5.55 5.55 0 0 1-2.373 1.054.75.75 0 0 1-.546-1.464 4.05 4.05 0 0 0 1.737-.77 6.22 6.22 0 0 0 2.13-3.134 6.7 6.7 0 0 0 0-3.834 6.22 6.22 0 0 0-2.13-3.134 4.05 4.05 0 0 0-1.737-.77.75.75 0 0 1 .016-.134zm-6.071 3.52a.75.75 0 0 1 .53-.22h2.25a.75.75 0 0 1 .53.22l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-.53.22H4.2a.75.75 0 0 1-.53-.22L.42 8.364a.75.75 0 0 1 0-1.06l3.25-3.25z"></path></svg>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue="50"
                        onChange={handleVolume}
                        className="volume-slider"
                        style={{ '--progress': '50%' }}
                    />
                </div>
            </div>

            {/* CENTER: Progress Bar Only */}
            <div className="player-section-center">
                <span className="time-text">{formatTime(position)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration / 1000}
                    value={position / 1000}
                    onChange={handleSeek}
                    className="progress-slider"
                    style={{ '--progress': `${duration ? (position / duration * 100) : 0}%` }}
                />
                <span className="time-text">{formatTime(duration)}</span>
            </div>

            {/* RIGHT: Controls + Context */}
            <div className="player-section-right">
                <button className="control-btn secondary" onClick={() => player?.previousTrack()}>
                    <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path></svg>
                </button>
                <button className="control-btn primary-play" onClick={() => player?.togglePlay()}>
                    {paused ? (
                        <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    ) : (
                        <svg role="img" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    )}
                </button>
                <button className="control-btn secondary" onClick={() => player?.nextTrack()}>
                    <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path></svg>
                </button>

                {currentTrack && <div className="pb-context">{currentTrack.album.name}</div>}
            </div>
        </div>
    );
};

export default PlayerBar;
