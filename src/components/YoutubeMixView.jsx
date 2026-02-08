import React, { useState, useMemo } from "react";
import mixData from "../data/youtubeMixData.json";
import LiveCard from "./live/LiveCard";
import LiveFilters from "./live/LiveFilters"; // Reuse existing filters script
import "../styles/LiveView.css"; // Reuse existing styles

const YoutubeMixView = () => {
    const [selectedType, setSelectedType] = useState(["All"]);
    const [sortOrder, setSortOrder] = useState("Newest");
    const [isShuffled, setIsShuffled] = useState(false);
    const [playingVideo, setPlayingVideo] = useState(null);
    const gridColumns = 3;

    // Use the enriched data directly - it already has the correct format
    const videos = useMemo(() => {
        return mixData.videos || [];
    }, []);

    // Extract unique types (Languages)
    const types = useMemo(() => {
        const uniqueTypes = [...new Set(videos.map((data) => data.type).filter(Boolean))].sort();
        return ["All", ...uniqueTypes];
    }, [videos]);

    // Filter videos
    const filteredVideos = useMemo(() => {
        let result = videos.filter((data) => {
            const matchesType = selectedType.includes("All") || selectedType.includes(data.type);
            return matchesType;
        });

        // Sort videos
        if (isShuffled) {
            // Fisher-Yates shuffle
            result = [...result]; // Create a copy to shuffle
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
        } else {
            // Sort by date - parse the date field
            result = [...result].sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;

                // Handle invalid dates (put them at the end)
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;

                return sortOrder === "Newest" ? dateB - dateA : dateA - dateB;
            });
        }

        return result;
    }, [videos, selectedType, sortOrder, isShuffled]);

    const handleReset = () => {
        setSelectedType(["All"]);
        setSortOrder("Newest");
        setIsShuffled(false);
    };

    const handleVideoClick = (videoData) => {
        setPlayingVideo({
            id: videoData.youtubeLinkID,
            title: videoData.title
        });
    };

    const closePlayer = () => {
        setPlayingVideo(null);
    };

    return (
        <div className="youtube-view-container">
            {/* Embedded Player Modal */}
            {playingVideo && (
                <div className="live-player-modal-overlay" onClick={closePlayer}>
                    <div className="live-player-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="live-player-close-btn" onClick={closePlayer}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div className="live-player-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&rel=0`}
                                title={playingVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="live-player-iframe"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            <div className="youtube-header">
                <div className="header-controls">
                    <LiveFilters
                        selectedType={selectedType}
                        onSelectType={setSelectedType}
                        types={types}
                        sortOrder={sortOrder}
                        onSortChange={setSortOrder}
                        isShuffled={isShuffled}
                        onShuffleToggle={() => setIsShuffled(!isShuffled)}
                        onReset={handleReset}
                    />
                </div>
            </div>

            {filteredVideos.length === 0 ? (
                <div className="no-videos-msg">
                    No videos match your filters
                </div>
            ) : (
                <div
                    className="youtube-grid"
                    style={{
                        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
                    }}
                >
                    {filteredVideos.map((item, index) => (
                        <LiveCard
                            key={`${item.youtubeLinkID}-${index}`}
                            data={item}
                            onVideoClick={handleVideoClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default YoutubeMixView;
