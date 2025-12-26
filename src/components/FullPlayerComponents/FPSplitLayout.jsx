import React from 'react';
import { openYoutubeLink } from '../../utils/youtubeUtils';
import FPProgress from './FPProgress';
import FPControls from './FPControls';
import FPLyrics from './FPLyrics';

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
    return (
        <div className="fp-split-container">
            {/* Left Side: Player Controls */}
            <div className="fp-left-section">
                <div className="fp-art-container small">
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
                    onToggleLyrics={onToggleLyrics}
                    showLyrics={showLyrics}
                    hasLyrics={hasLyrics}
                    isLyricsAvailable={!!youtubeData?.lyrics}
                />
            </div>

            <div className={`fp-right-section ${showLyrics ? 'lyrics-mode' : ''}`}>
                {showLyrics && youtubeData?.lyrics ? (
                    <FPLyrics
                        lyricsFileName={youtubeData.lyrics}
                        position={position}
                    />
                ) : (
                    <>
                        <div className="fp-youtube-card">
                            <img
                                src={`https://img.youtube.com/vi/${youtubeData.youtubelinkID}/maxresdefault.jpg`}
                                alt="YouTube Thumbnail"
                                className="fp-youtube-thumb"
                            />
                            <div className="fp-youtube-overlay">
                                <div className="fp-overlay-buttons">
                                    <button className="fp-watch-btn transparent-play" onClick={() => openYoutubeLink(currentTrack.id)}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="fp-youtube-info">
                            <h3>Available on YouTube</h3>
                            <p>{youtubeData.name} • {youtubeData.quality || youtubeData.format}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FPSplitLayout;
