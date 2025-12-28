import React, { useState, useMemo } from "react";
import liveData from "../data/live.json";
import LiveCard from "./live/LiveCard";
import LiveFilters from "./live/LiveFilters";
import "../styles/LiveView.css";

const LiveView = () => {
    const [selectedType, setSelectedType] = useState(["All"]);
    const [sortOrder, setSortOrder] = useState("Newest");
    const gridColumns = 3;

    const videos = useMemo(() => {
        return liveData.live || [];
    }, []);

    // Extract unique types
    const types = useMemo(() => ["All", ...new Set(videos.map((data) => data.type).filter(Boolean))].sort(), [videos]);

    // Filter videos
    const filteredVideos = useMemo(() => {
        let result = videos.filter((data) => {
            const matchesType = selectedType.includes("All") || selectedType.includes(data.type);
            return matchesType;
        });

        // Sort videos
        if (sortOrder === "Newest") {
            result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        } else if (sortOrder === "Oldest") {
            result.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        }

        return result;
    }, [videos, selectedType, sortOrder]);

    const handleReset = () => {
        setSelectedType(["All"]);
        setSortOrder("Newest");
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
