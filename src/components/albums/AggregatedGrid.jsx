import React from 'react';
import YouTubeCard from '../youtube/YouTubeCard';

const AggregatedGrid = ({ viewMode, items, loading, searchTerm, onPlay }) => {

    if (loading) {
        let loadingMsg = "Loading...";
        if (viewMode === 'all-songs') loadingMsg = "Loading Songs...";
        if (viewMode === 'live') loadingMsg = "Loading Live Performances...";
        if (viewMode === 'others') loadingMsg = "Loading Others...";
        return <div className="albums-loading">{loadingMsg}</div>;
    }

    if (!items || items.length === 0) {
        let emptyMsg = "No items found.";
        if (viewMode === 'live') emptyMsg = "No live performances found.";
        if (viewMode === 'all-songs') emptyMsg = "No songs found.";
        return <div className="no-albums-msg">{emptyMsg}</div>;
    }

    return (
        <div className="all-songs-grid">
            <div className="album-tracks-grid">
                {items.map((item, index) => {
                    // Search filtering
                    // For Others view, item.name is clear. 
                    // For tracks, item.name exists.
                    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return null;
                    }

                    // Construct key and Data
                    // item structure varies slightly depending on viewMode, but we tried to normalize in parent.
                    // Let's assume parent passes normalized: { id, name, type/genre, videoId, format, keyId }

                    // Fallback key
                    const key = item.keyId || `${item.id}-${index}`;

                    const cardData = {
                        name: item.name,
                        youtubelinkID: item.videoId || item.linked_youtube_id || item.id, // others has .id as videoId
                        genre: item.type || item.genre || item.related_album_type || "Video",
                        format: item.format || "HD"
                    };

                    return (
                        <YouTubeCard
                            key={key}
                            trackId={item.trackId || item.id || `track-${index}`}
                            data={cardData}
                            handlePlay={() => onPlay(item)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default AggregatedGrid;
