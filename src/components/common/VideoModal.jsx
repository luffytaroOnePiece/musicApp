import React from 'react';
import '../../styles/albums/AlbumDetail.css'; // Reusing modal styles from here or move to common

const VideoModal = ({ video, onClose }) => {
    if (!video) return null;

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
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="live-player-iframe"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default VideoModal;
