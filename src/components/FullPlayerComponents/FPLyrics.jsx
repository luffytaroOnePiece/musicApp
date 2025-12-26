import React, { useEffect, useState, useRef } from 'react';

const FPLyrics = ({ lyricsFileName, position }) => {
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
        if (!lyricsFileName) return;

        setLoading(true);
        setError(null);

        fetch(`https://raw.githubusercontent.com/luffytaroOnePiece/lyrics/main/${lyricsFileName}`)
            .then(res => {
                if (!res.ok) throw new Error("Lyrics not found");
                return res.text();
            })
            .then(data => {
                const parsed = parseLRC(data);
                setLyricsLines(parsed);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load lyrics:", err);
                setError("Lyrics not available");
                setLoading(false);
            });
    }, [lyricsFileName]);

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

    if (loading) return <div className="fp-lyrics-loading">Loading lyrics...</div>;
    if (error) return <div className="fp-lyrics-error">{error}</div>;

    return (
        <div className="fp-lyrics-container" ref={containerRef}>
            {lyricsLines.map((line, index) => (
                <p
                    key={index}
                    className={`fp-lyrics-line ${index === activeIndex ? 'active' : ''}`}
                >
                    {line.text}
                </p>
            ))}
            {lyricsLines.length === 0 && <p className="fp-lyrics-empty">No lyrics content found</p>}
        </div>
    );
};

export default FPLyrics;
