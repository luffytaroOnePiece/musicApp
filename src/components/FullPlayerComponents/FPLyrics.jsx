import React, { useEffect, useState, useRef } from 'react';
import { getLyrics } from '../../services/lrcLibApi';
import '../../styles/FPLyrics.css';

const FPLyrics = ({ lyricsFileName, position, handleSeek, trackName, artistName, albumName, duration }) => {
    const [lyricsLines, setLyricsLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);

    // Parse LRC format: [mm:ss.xx] text
    const parseLRC = (lrcString) => {
        const lines = lrcString.split('\n');
        const parsed = [];
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        lines.forEach(line => {
            const match = timeRegex.exec(line);
            if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const milliseconds = parseInt(match[3], 10);

                // Convert to total milliseconds
                const time = (minutes * 60 * 1000) + (seconds * 1000) + (milliseconds * (match[3].length === 2 ? 10 : 1));
                const text = line.replace(timeRegex, '').trim();

                if (text) {
                    parsed.push({ time, text });
                }
            }
        });
        return parsed;
    };

    useEffect(() => {
        console.log("FPLyrics - Props:", { lyricsFileName, trackName, artistName, albumName, duration });

        const fetchLyrics = async () => {
            setLoading(true);
            setError(null);
            setLyricsLines([]);
            console.log("FPLyrics - Fetching lyrics...");

            try {
                let data = null;

                // Priority 1: Manual override via filename (from youtubeLinks.json)
                // If it ends with .lrc, we assume it's a file in the repo (backward compatibility or manual override)
                if (lyricsFileName && lyricsFileName.endsWith('.lrc')) {
                    const url = `https://raw.githubusercontent.com/luffytaroOnePiece/lyrics/main/${lyricsFileName}`;
                    console.log("Fetching manual lyrics from:", url);
                    const res = await fetch(url);
                    if (!res.ok) throw new Error("Lyrics unavailable");
                    data = await res.text();
                } else {
                    // Priority 2: Fetch from LRCLIB using metadata
                    // The props passed should be: trackName, artistName, albumName, duration
                    if (!trackName || !artistName) {
                        console.error("FPLyrics - Missing metadata:", { trackName, artistName });
                        // If we don't have metadata, we can't fetch.
                        throw new Error("Missing track metadata");
                    }

                    console.log(`Fetching from LRCLIB for: ${trackName} by ${artistName}`);
                    const lrcData = await getLyrics(trackName, artistName, albumName, duration);

                    if (lrcData && lrcData.syncedLyrics) {
                        data = lrcData.syncedLyrics;
                    } else if (lrcData && lrcData.plainLyrics) {
                        // Fallback to plain lyrics if synced not available? 
                        // Our parser expects [time] text. Plain lyrics won't parse well with current logic.
                        // Ideally we want synced.
                        throw new Error("No synced lyrics found");
                    } else {
                        throw new Error("Lyrics not found");
                    }
                }

                const parsed = parseLRC(data);
                setLyricsLines(parsed);
                setLoading(false);

            } catch (err) {
                console.error("Lyrics fetch failed:", err);
                // Silent fail or show specific error
                const msg = err.message === "Lyrics not found" || err.message === "Lyrics unavailable"
                    ? "No lyrics available for this track"
                    : "Lyrics unavailable";
                setError(msg);
                setLoading(false);
            }
        };

        fetchLyrics();
    }, [lyricsFileName, trackName, artistName, albumName, duration]);

    // Determine active line (safe for older browsers)
    let activeIndex = -1;
    for (let i = 0; i < lyricsLines.length; i++) {
        if (lyricsLines[i].time <= position) {
            activeIndex = i;
        } else {
            break;
        }
    }

    // Auto-scroll
    useEffect(() => {
        if (activeIndex !== -1 && containerRef.current) {
            const activeEl = containerRef.current.children[activeIndex];
            if (activeEl) {
                activeEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [activeIndex]);

    const handleLineClick = (time) => {
        if (handleSeek) {
            handleSeek({ target: { value: time / 1000 } });
        }
    };

    if (loading) return <div className="fp-lyrics-loading">Loading lyrics...</div>;
    if (error) return <div className="fp-lyrics-error">{error}</div>;

    return (
        <div className="fp-lyrics-container" ref={containerRef}>
            {lyricsLines.map((line, index) => (
                <p
                    key={index}
                    className={`fp-lyrics-line ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => handleLineClick(line.time)}
                >
                    {line.text}
                </p>
            ))}
            {lyricsLines.length === 0 && <p className="fp-lyrics-empty">No lyrics content found</p>}
        </div>
    );
};

export default FPLyrics;
