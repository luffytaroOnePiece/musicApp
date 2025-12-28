import React, { useState, useMemo } from "react";
import { getAllYoutubeLinks } from "../utils/youtubeUtils";
import { getTracks } from "../services/spotifyApi";
import YouTubeCard from "./youtube/YouTubeCard";
import YouTubeFilters from "./youtube/YouTubeFilters";
import genreData from "../data/genres.json";
import "../styles/YouTubeView.css";

const YouTubeView = ({ handlePlay, searchTerm }) => {
    const [selectedGenre, setSelectedGenre] = useState(["All"]);
    const [selectedFormat, setSelectedFormat] = useState("All");
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const [gridColumns, setGridColumns] = useState(3);


    const videos = useMemo(() => {
        const allVideos = getAllYoutubeLinks();
        // Fisher-Yates Shuffle
        for (let i = allVideos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allVideos[i], allVideos[j]] = [allVideos[j], allVideos[i]];
        }
        return allVideos;
    }, []);

    // Extract unique genres, formats, and languages
    const genres = useMemo(() => {
        const allGenres = new Set();
        videos.forEach(([, data]) => {
            if (Array.isArray(data.genre)) {
                data.genre.forEach(id => {
                    const name = genreData[id];
                    if (name) allGenres.add(name);
                });
            } else if (data.genre) {
                allGenres.add(data.genre);
            }
        });
        return ["All", ...Array.from(allGenres).sort()];
    }, [videos]);
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

        // Resolve genre names
        let videoGenres = [];
        if (Array.isArray(data.genre)) {
            videoGenres = data.genre.map(gId => genreData[gId]).filter(Boolean);
        } else if (data.genre) {
            videoGenres = [data.genre];
        }

        // Search Filter (Name or Genre)
        const matchesSearch =
            (data.name || "").toLowerCase().includes(query) ||
            videoGenres.some(gName => gName.toLowerCase().includes(query));

        // Genre Filter
        const matchesGenre = selectedGenre.includes("All") ||
            (selectedGenre.some(sGenre => videoGenres.includes(sGenre)));

        // Format Filter
        const matchesFormat = selectedFormat === "All" || data.format === selectedFormat;

        // Language Filter
        const matchesLanguage = selectedLanguage === "All" || data.language === selectedLanguage;

        return matchesSearch && matchesGenre && matchesFormat && matchesLanguage;
    });

    const handleReset = () => {
        setSelectedGenre(["All"]);
        setSelectedFormat("All");
        setSelectedLanguage("All");
    };

    const handleVideoPlay = async (trackUri) => {
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

        // Fetch real track metadata from Spotify
        try {
            const ids = subset.map(([id]) => id).join(',');
            const data = await getTracks(ids);

            // Map the API response to ensure we have valid track objects
            // The API returns { tracks: [...] }
            const realTracks = (data.tracks || []).filter(Boolean);

            // If we got tracks back, use them. Otherwise fallback (unlikely if IDs are valid)
            if (realTracks.length > 0) {
                handlePlay(trackUri, subsetUris, 0, realTracks);
            } else {
                throw new Error("No tracks found");
            }
        } catch (err) {
            console.error("Failed to fetch Spotify metadata for YouTube tracks:", err);
            // Fallback: Construct full track objects manually if API fails
            const subsetWithMetadata = subset.map(([id, data]) => {
                let genreString = "YouTube";
                if (Array.isArray(data.genre)) {
                    genreString = data.genre.map(gId => genreData[gId]).filter(Boolean).join(", ");
                } else if (data.genre) {
                    genreString = data.genre;
                }

                return {
                    id: id,
                    uri: `spotify:track:${id}`,
                    name: data.name,
                    artists: [{ name: genreString }],
                    album: {
                        images: [
                            { url: `https://img.youtube.com/vi/${data.youtubelinkID}/maxresdefault.jpg` },
                            { url: `https://img.youtube.com/vi/${data.youtubelinkID}/mqdefault.jpg` },
                            { url: `https://img.youtube.com/vi/${data.youtubelinkID}/default.jpg` }
                        ],
                        name: "YouTube Video"
                    },
                    duration_ms: 0,
                    is_local: false
                };
            });
            handlePlay(trackUri, subsetUris, 0, subsetWithMetadata);
        }
    };

    return (
        <div className="youtube-view-container">
            <div className="youtube-header">
                <div className="header-controls">
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
