import React from 'react';
import '../../styles/FPControls.css';

const FPControls = ({ player, paused, queueComponent, devicesComponent, onNext, onPrev, onTogglePlay, onToggleLyrics, showLyrics, hasLyrics, isLyricsAvailable }) => {
    return (
        <div className="fp-controls">
            <div className="fp-controls-left">
                {queueComponent}
            </div>

            <div className="fp-controls-main">
                <button className="control-btn secondary" onClick={onPrev}>
                    <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path></svg>
                </button>

                <button className="control-btn primary-play fp-play-btn" onClick={onTogglePlay}>
                    {paused ? (
                        <svg role="img" height="32" width="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    ) : (
                        <svg role="img" height="32" width="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    )}
                </button>

                <button className="control-btn secondary" onClick={onNext}>
                    <svg role="img" height="24" width="24" viewBox="0 0 16 16" fill="currentColor"><path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path></svg>
                </button>
            </div>

            <div className="fp-controls-extra">
                {/* Lyrics Toggle */}
                {/* Only show if lyrics are available for this track */}
                {isLyricsAvailable && (
                    <button
                        className={`control-btn icon-only vibe-toggle-btn ${showLyrics ? 'active' : ''}`}
                        onClick={onToggleLyrics}
                        title="Show Lyrics"
                        style={{ marginRight: '10px' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                        </svg>
                    </button>
                )}
                {devicesComponent}
            </div>
        </div>
    );
};

export default FPControls;
