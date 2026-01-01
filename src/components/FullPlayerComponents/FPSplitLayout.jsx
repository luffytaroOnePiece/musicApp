import React, { useState } from 'react';
import FPLeftSection from './FPLeftSection';
import FPVideoPlayer from './FPVideoPlayer';
import FPLiveVersions from './FPLiveVersions';

const FPSplitLayout = ({
    currentTrack,
    artistNames,
    albumImage,
    youtubeData,
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
    hasLyrics
}) => {
    // State to track active version index from FPVideoPlayer
    const [activeLiveVersionIndex, setActiveLiveVersionIndex] = useState(0);
    // State for the full page live versions view
    const [showLivePage, setShowLivePage] = useState(false);

    return (
        <div className="fp-split-container">
            {/* Live Versions Page Overlay - Renders on top of everything when active */}
            {showLivePage && (
                <FPLiveVersions
                    youtubeData={youtubeData}
                    activeVersionIndex={activeLiveVersionIndex}
                    onClose={() => setShowLivePage(false)}
                    onSelectVersion={(index) => {
                        setActiveLiveVersionIndex(index);
                        setShowLivePage(false);
                    }}
                />
            )}

            {/* Left Side: Player Controls */}
            <FPLeftSection
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
                onNext={onNext}
                onPrev={onPrev}
                onTogglePlay={onTogglePlay}
                onToggleLyrics={onToggleLyrics}
                showLyrics={showLyrics}
                hasLyrics={hasLyrics}
                activeLiveVersionIndex={activeLiveVersionIndex}
            />

            {/* Right Side: Video Player & Live Controls */}
            <FPVideoPlayer
                youtubeData={youtubeData}
                currentTrack={currentTrack}
                showLyrics={showLyrics}
                position={position}
                handleSeek={handleSeek}
                artistNames={artistNames}
                duration={duration}
                onVersionChange={setActiveLiveVersionIndex}
            />
        </div>
    );
};

export default FPSplitLayout;
