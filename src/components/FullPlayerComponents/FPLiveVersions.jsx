import React, { useEffect, useState } from 'react';

const FPLiveVersions = ({ youtubeData, onSelectVersion, onClose, activeVersionIndex }) => {
    // Animation state
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    const handleSelect = (index) => {
        setIsVisible(false);
        setTimeout(() => onSelectVersion(index), 300);
    };

    const rawIds = youtubeData?.youtubelinkID ? youtubeData.youtubelinkID.split(',') : [];

    return (
        <div className={`fp-live-page ${isVisible ? 'visible' : ''}`}>
            <div className="fp-live-page-header">
                <h2>Live Content</h2>
                <button className="fp-close-live-page" onClick={handleClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div className="fp-live-grid">
                {rawIds.map((id, index) => {
                    const cleanId = id.trim();
                    const isSelected = activeVersionIndex === index;

                    return (
                        <div
                            key={index}
                            className={`fp-live-card ${isSelected ? 'active' : ''}`}
                            onClick={() => handleSelect(index)}
                        >
                            <div className="fp-live-thumb-container">
                                <img
                                    src={`https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`}
                                    alt={`Version ${index}`}
                                    onError={(e) => e.target.style.display = 'none'}
                                    className="fp-live-thumb"
                                />
                                {isSelected && (
                                    <div className="fp-live-playing-overlay">
                                        <span>Playing</span>
                                    </div>
                                )}
                            </div>
                            <div className="fp-live-info">
                                <span className="fp-live-title">
                                    {index === 0 ? "Original Version" : `Live Performance ${index}`}
                                </span>
                                <span className="fp-live-type">
                                    {index === 0 ? "Official Audio/Video" : "Live Performance"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FPLiveVersions;
