import React from 'react';
import FPProgress from './FPProgress';
import FPControls from './FPControls';

const FPStandardLayout = ({
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
    onTogglePlay
}) => {
    return (
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
                onNext={onNext}
                onPrev={onPrev}
                onTogglePlay={onTogglePlay}
            />
        </>
    );
};

export default FPStandardLayout;
