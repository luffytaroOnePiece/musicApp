import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
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
    const [embedError, setEmbedError] = useState(false);

    // Reset error when track changes
    useEffect(() => {
        setEmbedError(false);
    }, [youtubeData?.youtubelinkID]);

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
                    isLyricsAvailable={true} // Always allow attempting fetch via LRCLIB
                />
            </div>

            <div className={`fp-right-section ${showLyrics ? 'lyrics-mode' : ''}`}>
                {showLyrics ? (
                    <FPLyrics
                        lyricsFileName={youtubeData.lyrics}
                        position={position}
                        handleSeek={handleSeek}
                        trackName={currentTrack.name}
                        artistNames={artistNames} // Passing joined names or raw? FPLyrics expects 'artistName'
                        artistName={currentTrack.artists?.[0]?.name || artistNames} // Best effort single artist for API
                        albumName={currentTrack.album?.name}
                        duration={currentTrack.duration_ms ? currentTrack.duration_ms / 1000 : duration}
                    />
                ) : (
                    <>
                        <div className="fp-youtube-card">
                            {/* Embed Mode with Fallback */}
                            {youtubeData?.useEmbed && !embedError ? (
                                <YouTube
                                    videoId={youtubeData.youtubelinkID}
                                    className="fp-youtube-player-wrapper"
                                    iframeClassName="fp-youtube-embed"
                                    opts={{
                                        width: '100%',
                                        height: '100%',
                                        playerVars: {
                                            autoplay: 0,
                                            rel: 0,
                                            modestbranding: 1
                                        },
                                    }}
                                    onError={() => setEmbedError(true)}
                                    style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}
                                />
                            ) : (
                                <>
                                    <img
                                        src={`https://img.youtube.com/vi/${youtubeData.youtubelinkID}/maxresdefault.jpg`}
                                        alt="YouTube Thumbnail"
                                        className="fp-youtube-thumb"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://img.youtube.com/vi/${youtubeData.youtubelinkID}/hqdefault.jpg`;
                                        }}
                                        onLoad={(e) => {
                                            if (e.target.src.includes('maxresdefault.jpg') && e.target.naturalWidth === 120) {
                                                e.target.src = `https://img.youtube.com/vi/${youtubeData.youtubelinkID}/hqdefault.jpg`;
                                            }
                                        }}
                                    />
                                    <div className="fp-youtube-overlay">
                                        <div className="fp-overlay-buttons">
                                            <button className="fp-watch-btn transparent-play" onClick={() => {
                                                let qualityParam = "";
                                                if (youtubeData.format) {
                                                    switch (youtubeData.format) {
                                                        case "4320p": qualityParam = "&vq=hd4320"; break;
                                                        case "2160p": qualityParam = "&vq=hd2160"; break;
                                                        case "1440p": qualityParam = "&vq=hd1440"; break;
                                                        case "1080p": qualityParam = "&vq=hd1080"; break;
                                                        case "720p": qualityParam = "&vq=hd720"; break;
                                                        case "480p": qualityParam = "&vq=large"; break;
                                                        case "360p": qualityParam = "&vq=medium"; break;
                                                        case "240p": qualityParam = "&vq=small"; break;
                                                        case "144p": qualityParam = "&vq=tiny"; break;
                                                        default: qualityParam = "";
                                                    }
                                                }
                                                window.open(`https://www.youtube.com/watch?v=${youtubeData.youtubelinkID}${qualityParam}`, '_blank');
                                            }}>
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
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
