import React, { useState, useMemo } from "react";
import youtubeLinks from "../data/youtubeLinks.json";
import YouTubeCard from "./youtube/YouTubeCard";
import YouTubeFilters from "./youtube/YouTubeFilters";
import "../styles/YouTubeView.css";

const YouTubeView = ({ handlePlay, searchTerm }) => {
    const [selectedGenre, setSelectedGenre] = useState("All");
    const [selectedFormat, setSelectedFormat] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const [gridColumns, setGridColumns] = useState(3);
    const [isCinemaMode, setIsCinemaMode] = useState(false);

    const videos = useMemo(() => {
        const allVideos = Object.entries(youtubeLinks);
        // Fisher-Yates Shuffle
        for (let i = allVideos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allVideos[i], allVideos[j]] = [allVideos[j], allVideos[i]];
        }
        return allVideos;
    }, []);

    // Extract unique genres, formats, and languages
    const genres = useMemo(() => ["All", ...new Set(videos.map(([, data]) => data.genre).filter(Boolean))].sort(), [videos]);
    const formats = useMemo(() => {
        const uniqueFormats = [...new Set(videos.map(([, data]) => data.format).filter(Boolean))];
        // Sort formats descending (e.g. 4320p -> 2160p -> 1080p)
        // ParseInt ensures we sort by numerical resolution, not string (though string works for fixed width usually)
        uniqueFormats.sort((a, b) => parseInt(b) - parseInt(a));
        return ["All", ...uniqueFormats];
    }, [videos]);
    const languages = useMemo(() => ["All", ...new Set(videos.map(([, data]) => data.language).filter(Boolean))].sort(), [videos]);

    // Filter videos
    const filteredVideos = videos.filter(([id, data]) => {
        const query = (searchTerm || "").toLowerCase();

        // Search Filter (Name or Genre)
        const matchesSearch =
            (data.name || "").toLowerCase().includes(query) ||
            (data.genre || "").toLowerCase().includes(query);

        // Genre Filter
        const matchesGenre = selectedGenre === "All" || data.genre === selectedGenre;

        // Format Filter
        const matchesFormat = selectedFormat === "All" || data.format === selectedFormat;

        // Language Filter
        const matchesLanguage = selectedLanguage === "All" || data.language === selectedLanguage;

        return matchesSearch && matchesGenre && matchesFormat && matchesLanguage;
    });

    const handleReset = () => {
        setSelectedGenre("All");
        setSelectedFormat("All");
        setSelectedLanguage("All");
    };

    const handleVideoPlay = (trackUri) => {
        // Find index of the selected track
        const currentIndex = filteredVideos.findIndex(([id]) => `spotify:track:${id}` === trackUri);

        if (currentIndex === -1) {
            // Fallback if not found (search filtered out?)
            handlePlay(trackUri, [trackUri]);
            return;
        }

        // Create a window of ~50 tracks centered on the current one
        const WINDOW_SIZE = 50;
        const halfWindow = Math.floor(WINDOW_SIZE / 2);

        let start = Math.max(0, currentIndex - halfWindow);
        let end = Math.min(filteredVideos.length, start + WINDOW_SIZE);

        // Adjust start if we hit the end
        if (end - start < WINDOW_SIZE) {
            start = Math.max(0, end - WINDOW_SIZE);
        }

        const subset = filteredVideos.slice(start, end);
        const subsetUris = subset.map(([id]) => `spotify:track:${id}`);

        handlePlay(trackUri, subsetUris);
    };

    return (
        <div className={`youtube-view-container ${isCinemaMode ? 'cinema-mode' : ''}`}>
            <div className="youtube-header">
                <div className="header-controls">
                    <h1 className="youtube-title">
                        YouTube
                    </h1>

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
                        selectedGenre={selectedGenre}
                        setSelectedGenre={setSelectedGenre}
                        selectedFormat={selectedFormat}
                        setSelectedFormat={setSelectedFormat}
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                        genres={genres}
                        formats={formats}
                        languages={languages}
                        onReset={handleReset}
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
                    {videos.length === 0
                        ? "No videos configured in youtubeLinks.json"
                        : "No videos match your search or filters"}
                </div>
            ) : (
                <div
                    className="youtube-grid"
                    style={{
                        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
                    }}
                >
                    {filteredVideos.map(([trackId, data]) => (
                        <YouTubeCard
                            key={trackId}
                            trackId={trackId}
                            data={data}
                            handlePlay={handleVideoPlay}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouTubeView;
