import React from 'react';
import '../../styles/albums/AlbumDetail.css'; // Reusing modal styles

const VidKingModal = ({ tmdbId, type, season, episode, onClose }) => {
    if (!tmdbId) return null;

    let src = '';
    const color = 'e50914'; // Netflix red or customizable
    const commonParams = `?color=${color}&autoPlay=true`;

    if (type === 'movie') {
        src = `https://www.vidking.net/embed/movie/${tmdbId}${commonParams}`;
    } else if (type === 'tv') {
        // Default to S1 E1 if not provided, but ideally should be passed
        const s = season || 1;
        const e = episode || 1;
        src = `https://www.vidking.net/embed/tv/${tmdbId}/${s}/${e}${commonParams}&episodeSelector=true&nextEpisode=true`;
    }

    return (
        <div className="live-player-modal-overlay" onClick={onClose}>
            <div className="live-player-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="live-player-close-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div className="live-player-wrapper">
                    <iframe
                        src={src}
                        title="VidKing Player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                        className="live-player-iframe"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default VidKingModal;
