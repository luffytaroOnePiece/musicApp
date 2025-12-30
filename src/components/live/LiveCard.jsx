import React from 'react';
import '../../styles/LiveCard.css';

const LiveCard = ({ data }) => {
    const handleVideoClick = () => {
        window.open(`https://www.youtube.com/watch?v=${data.youtubeLinkID}`, '_blank');
    };

    // Format date if available
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="live-card" onClick={handleVideoClick}>
            <div className="live-card-thumbnail-container">
                <img
                    src={`https://img.youtube.com/vi/${data.youtubeLinkID}/maxresdefault.jpg`}
                    alt={data.title}
                    className="live-card-thumbnail"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://img.youtube.com/vi/${data.youtubeLinkID}/hqdefault.jpg`;
                    }}
                    onLoad={(e) => {
                        if (e.target.src.includes('maxresdefault.jpg') && e.target.naturalWidth === 120) {
                            e.target.src = `https://img.youtube.com/vi/${data.youtubeLinkID}/hqdefault.jpg`;
                        }
                    }}
                />
            </div>

            <div className="live-card-content">
                <div className="live-card-meta">
                    <span>{data.type}</span>
                    <span>{formatDate(data.date)}</span>
                </div>
                <div className="live-card-title">
                    {data.title || "Unknown Title"}
                </div>
            </div>
        </div>
    );
};

export default LiveCard;
