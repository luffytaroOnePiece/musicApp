import React, { useState, useMemo } from "react";
import liveData from "../data/live.json";
import LiveCard from "./live/LiveCard";
import LiveFilters from "./live/LiveFilters";
import "../styles/LiveView.css";

const LiveView = () => {
    const [selectedType, setSelectedType] = useState(["All"]);
    const [sortOrder, setSortOrder] = useState("Newest");
    const [isShuffled, setIsShuffled] = useState(false);
    const gridColumns = 3;

    const videos = useMemo(() => {
        return liveData.live || [];
    }, []);

    // Extract unique types
    // Extract unique types - maintain All at start, then alphabetical
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
        // Sort videos
        if (isShuffled) {
            // Fisher-Yates shuffle
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
        } else {
            if (sortOrder === "Newest") {
                result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            } else if (sortOrder === "Oldest") {
                result.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
            }
        }

        return result;
    }, [videos, selectedType, sortOrder, isShuffled]);

    const handleReset = () => {
        setSelectedType(["All"]);
        setSortOrder("Newest");
        setIsShuffled(false);
    };

    return (
        <div className="youtube-view-container">
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
                    No live videos match your filters
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
                            key={index}
                            data={item}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveView;
