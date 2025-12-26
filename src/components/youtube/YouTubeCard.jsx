import React from 'react';
import '../../styles/YouTubeCard.css';

const YouTubeCard = ({ data, trackId, handlePlay }) => {
    const handleVideoClick = (e) => {
        // Did not prevent default here because we want the whole card to be clickable
        let qualityParam = "";
        switch (data.format) {
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
        window.open(`https://www.youtube.com/watch?v=${data.youtubelinkID}${qualityParam}`, '_blank');
    };

    return (
        <div className="youtube-card" onClick={handleVideoClick}>
            <div className="card-thumbnail-container">
                <img
                    src={`https://img.youtube.com/vi/${data.youtubelinkID}/maxresdefault.jpg`}
                    alt="Thumbnail"
                    className="card-thumbnail"
                    onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = `https://img.youtube.com/vi/${data.youtubelinkID}/hqdefault.jpg`;
                    }}
                />
                <div className="card-format-badge">
                    {data.format}
                </div>
            </div>

            <div className="card-content">
                <div className="card-meta">
                    <span>{data.genre}</span>
                    <span>{data.language}</span>
                </div>
                <div className="card-footer">
                    <div className="card-title">
                        {data.name || "Unknown Title"}
                    </div>

                    {data.lyrics && (
                        <div className="lyrics-symbol" title="Lyrics Available">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 2.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        </div>
                    )}

                    {/* Green Spotify Play Button */}
                    {trackId && (
                        <div
                            className="spotify-play-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (handlePlay) {
                                    handlePlay(`spotify:track:${trackId}`);
                                }
                            }}
                            title="Play on Spotify"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YouTubeCard;
