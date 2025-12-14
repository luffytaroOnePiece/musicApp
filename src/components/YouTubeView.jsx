import React, { useState, useMemo } from "react";
import youtubeLinks from "../data/youtubeLinks.json";
import YouTubeCard from "./youtube/YouTubeCard";
import YouTubeFilters from "./youtube/YouTubeFilters";
import "../styles/YouTubeView.css";

const YouTubeView = ({ handlePlay, searchTerm }) => {
    const [selectedGenre, setSelectedGenre] = useState("All");
    const [selectedFormat, setSelectedFormat] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");

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

    return (
        <div className="youtube-view-container">
            <div className="youtube-header">
                <h1 className="youtube-title">
                    YouTube Library
                </h1>

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
            </div>

            {filteredVideos.length === 0 ? (
                <div className="no-videos-msg">
                    {videos.length === 0
                        ? "No videos configured in youtubeLinks.json"
                        : "No videos match your search or filters"}
                </div>
            ) : (
                <div className="youtube-grid">
                    {filteredVideos.map(([trackId, data]) => (
                        <YouTubeCard
                            key={trackId}
                            trackId={trackId}
                            data={data}
                            handlePlay={handlePlay}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouTubeView;
