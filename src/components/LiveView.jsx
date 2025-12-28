import React, { useState, useMemo } from "react";
import liveData from "../data/live.json";
import YouTubeCard from "./youtube/YouTubeCard";
import YouTubeFilters from "./youtube/YouTubeFilters";
import "../styles/LiveView.css";

const LiveView = () => {
    const [selectedType, setSelectedType] = useState(["All"]);
    const [selectedFormat, setSelectedFormat] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const gridColumns = 3;

    const videos = useMemo(() => {
        return liveData.live || [];
    }, []);

    // Extract unique types (mapped to genre for filter compatibility), formats, and languages
    const types = useMemo(() => ["All", ...new Set(videos.map((data) => data.type).filter(Boolean))].sort(), [videos]);
    const formats = useMemo(() => {
        const uniqueFormats = [...new Set(videos.map((data) => data.format).filter(Boolean))];
        uniqueFormats.sort((a, b) => parseInt(b) - parseInt(a));
        return ["All", ...uniqueFormats];
    }, [videos]);
    const languages = useMemo(() => ["All", ...new Set(videos.map((data) => data.language).filter(Boolean))].sort(), [videos]);

    // Filter videos
    const filteredVideos = videos.filter((data) => {
        // Type Filter (Multi-select)
        const matchesType = selectedType.includes("All") || selectedType.includes(data.type);
        // Format Filter
        const matchesFormat = selectedFormat === "All" || data.format === selectedFormat;
        // Language Filter
        const matchesLanguage = selectedLanguage === "All" || data.language === selectedLanguage;

        return matchesType && matchesFormat && matchesLanguage;
    });

    const handleReset = () => {
        setSelectedType(["All"]);
        setSelectedFormat("All");
        setSelectedLanguage("All");
    };

    return (
        <div className="youtube-view-container">
            <div className="youtube-header">
                <div className="header-controls">
                    <YouTubeFilters
                        selectedGenre={selectedType}
                        setSelectedGenre={setSelectedType}
                        selectedFormat={selectedFormat}
                        setSelectedFormat={setSelectedFormat}
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                        genres={types}
                        formats={formats}
                        languages={languages}
                        onReset={handleReset}
                        genreLabel="Type"
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
                        <YouTubeCard
                            key={index}
                            // Mapping data to match YouTubeCard expectation
                            data={{
                                youtubelinkID: item.youtubeLinkID,
                                name: item.title,
                                genre: item.type,
                                language: item.language,
                                format: item.format
                            }}
                        // No trackId passed, so play button in card should handle it gracefully or be hidden
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveView;
