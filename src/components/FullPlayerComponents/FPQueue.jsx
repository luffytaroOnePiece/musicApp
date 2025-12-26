import React from 'react';
import '../../styles/FPQueue.css';

const FPQueue = ({ showQueue, toggleQueue, queue, onTrackClick, queueRef }) => {
    return (
        <div className="fp-queue-container" ref={queueRef}>
            <button
                className={`control-btn secondary fp-queue-btn ${showQueue ? 'active' : ''}`}
                onClick={toggleQueue}
                title="Next Up"
            >
                <svg role="img" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
            </button>

            {showQueue && (
                <div className="fp-queue-list">
                    <div className="fp-queue-header">
                        <h3>Next Up</h3>
                    </div>
                    {queue.length > 0 ? (
                        <ul>
                            {queue.map((track, i) => (
                                <li
                                    key={`${track.id}-${i}`}
                                    className="fp-queue-item"
                                    onClick={() => onTrackClick && onTrackClick(track.uri)}
                                >
                                    <div className="fp-queue-img-container">
                                        <img src={track.album?.images?.[2]?.url} alt="" className="fp-queue-img" />
                                        <div className="fp-queue-play-overlay">
                                            <svg role="img" height="16" width="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                    </div>
                                    <div className="fp-queue-info">
                                        <span className="fp-queue-name">{track.name}</span>
                                        <span className="fp-queue-artist">{track.artists?.[0]?.name}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="fp-no-queue">Queue is empty</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FPQueue;
