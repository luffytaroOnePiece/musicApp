import React from 'react';
import FPProgress from './FPProgress';
import FPControls from './FPControls';

const FPLeftSection = ({
    currentTrack,
    artistNames,
    albumImage,
    position,
    duration,
    handleSeek,
    formatTime,
    player,
    paused,
    queueComponent,
    devicesComponent,
    onNext,
    onPrev,
    onTogglePlay,
    onToggleLyrics,
    showLyrics,
    hasLyrics,
    activeLiveVersionIndex
}) => {
    return (
        <div className="fp-left-section">
            <div className="fp-art-container small">
                <img
                    src={albumImage}
                    alt={currentTrack.album?.name || "Album Art"}
                    className="fp-art"
                />
            </div>

            <div className="fp-track-info">
                <h2 className="fp-title">
                    {currentTrack.name}
                    {activeLiveVersionIndex > 0 ? <span className="version-badge"> (Live)</span> : ""}
                </h2>
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
                onNext={onNext}
                onPrev={onPrev}
                onTogglePlay={onTogglePlay}
                onToggleLyrics={onToggleLyrics}
                showLyrics={showLyrics}
                hasLyrics={hasLyrics}
                isLyricsAvailable={true}
            />
        </div>
    );
};

export default FPLeftSection;
