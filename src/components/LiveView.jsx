import React, { useState, useMemo } from "react";
import liveData from "../data/live.json";
import YouTubeCard from "./youtube/YouTubeCard";
import YouTubeFilters from "./youtube/YouTubeFilters";
import "../styles/LiveView.css";

const LiveView = () => {
    const [selectedType, setSelectedType] = useState("All");
    const [selectedFormat, setSelectedFormat] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const [gridColumns, setGridColumns] = useState(3);
    const [isCinemaMode, setIsCinemaMode] = useState(false);

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
        // Type Filter
        const matchesType = selectedType === "All" || data.type === selectedType;
        // Format Filter
        const matchesFormat = selectedFormat === "All" || data.format === selectedFormat;
        // Language Filter
        const matchesLanguage = selectedLanguage === "All" || data.language === selectedLanguage;

        return matchesType && matchesFormat && matchesLanguage;
    });

    const handleReset = () => {
        setSelectedType("All");
        setSelectedFormat("All");
        setSelectedLanguage("All");
    };

    return (
        <div className={`youtube-view-container ${isCinemaMode ? 'cinema-mode' : ''}`}>
            <div className="youtube-header">
                <div className="header-controls">
                    <h1 className="youtube-title">Live</h1>

                    <button
                        className={`cinema-toggle-btn ${isCinemaMode ? 'active' : ''}`}
                        onClick={() => setIsCinemaMode(!isCinemaMode)}
                        title={isCinemaMode ? "Exit Cinema Mode" : "Enter Cinema Mode"}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {isCinemaMode ? (
                                <>
                                    <line x1="8" y1="3" x2="8" y2="21"></line>
                                    <line x1="16" y1="3" x2="16" y2="21"></line>
                                    <line x1="3" y1="3" x2="21" y2="3"></line>
                                    <line x1="3" y1="21" x2="21" y2="21"></line>
                                </>
                            ) : (
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            )}
                        </svg>
                        {isCinemaMode ? "Exit Cinema" : "Cinema Mode"}
                    </button>

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

                    <div className="grid-slider-control">
                        <label>Grid: {gridColumns}</label>
                        <input
                            type="range"
                            min="1"
                            max="6"
                            value={gridColumns}
                            onChange={(e) => setGridColumns(Number(e.target.value))}
                            className="grid-range-slider"
                        />
                    </div>
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
