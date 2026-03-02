import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import movieYoutubeMapper from "../data/movieYoutubeMapper.json";
import youtubeMixData from "../data/youtubeMixData.json";
import { getDetails, getImageUrl } from "../services/tmdbApi";
import "../styles/YouTubeMusicView.css";

// Fast ytID → title lookup from mix data cache
const videoTitleMap = Object.fromEntries(
    (youtubeMixData.videos || []).map((v) => [v.youtubeLinkID, v.title])
);

// ─── Embedded YouTube IFrame Player Modal (Video) ─────────────────────────────
const YTVideoModal = ({ videoId, title, onClose }) => {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    if (!videoId) return null;
    return (
        <div className="ytm-modal-overlay" onClick={onClose}>
            <div className="ytm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="ytm-modal-header">
                    <span className="ytm-modal-title" title={title}>{title}</span>
                    <button className="ytm-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="ytm-modal-player-wrap">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1`}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="ytm-modal-iframe"
                    />
                </div>
            </div>
        </div>
    );
};

// ─── Persistent Audio Player (inline YouTube embed, audio-style UI) ───────────
const YTAudioPlayer = ({ track, onClose }) => {
    if (!track) return null;
    const { id, title, albumName, posterUrl } = track;

    return (
        <div className="ytm-audio-player">
            {/* Album art */}
            <div className="ytm-ap-art">
                {posterUrl
                    ? <img src={posterUrl} alt={albumName} className="ytm-ap-art-img" />
                    : <div className="ytm-ap-art-fallback">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                    </div>
                }
            </div>

            {/* Track info */}
            <div className="ytm-ap-info">
                <span className="ytm-ap-title" title={title}>{title}</span>
                <span className="ytm-ap-album">{albumName}</span>
            </div>

            {/* YouTube IFrame embed (audio-style: small height but autoplay) */}
            <div className="ytm-ap-iframe-wrap">
                <iframe
                    key={id}                          // force remount on track change
                    src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&controls=1`}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="ytm-ap-iframe"
                />
            </div>

            {/* Close */}
            <button className="ytm-ap-close" onClick={onClose} title="Close player">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
};

// ─── Detail Track Row ─────────────────────────────────────────────────────────
const TrackRow = React.memo(({ index, ytId, title, isCurrent, onPlayAudio, onPlayVideo }) => (
    <div className={`ytm-track-row ${isCurrent ? "ytm-track-row--active" : ""}`}>
        <div className="ytm-track-thumb-wrap">
            <img
                src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
                alt={title}
                className="ytm-track-thumb"
                loading="lazy"
            />
            {isCurrent && (
                <div className="ytm-track-now-playing">
                    <span /><span /><span />
                </div>
            )}
        </div>

        <div className="ytm-track-info">
            <span className="ytm-track-index">{index + 1}</span>
            <span className="ytm-track-title" title={title}>{title}</span>
        </div>

        <div className="ytm-track-actions">
            {/* Audio play button */}
            <button
                className={`ytm-track-btn ytm-track-btn--audio ${isCurrent ? "active" : ""}`}
                onClick={() => onPlayAudio({ id: ytId, title })}
                title="Play audio"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play</span>
            </button>

            {/* Video watch button */}
            <button
                className="ytm-track-btn ytm-track-btn--video"
                onClick={() => onPlayVideo({ id: ytId, title })}
                title="Watch video"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                </svg>
                <span>Video</span>
            </button>
        </div>
    </div>
));

// ─── Detail View ──────────────────────────────────────────────────────────────
const YTMusicDetail = ({ album, onBack }) => {
    const [audioTrack, setAudioTrack] = useState(null);   // currently playing in audio player
    const [videoTrack, setVideoTrack] = useState(null);   // playing in full-screen video modal
    const [searchTerm, setSearchTerm] = useState("");

    const { name, language, youtubeIDs, posterUrl, backdropUrl } = album;

    const tracks = useMemo(() =>
        (youtubeIDs || []).map((id, idx) => ({
            id,
            title: videoTitleMap[id] || `Song ${idx + 1}`,
            index: idx,
        })),
        [youtubeIDs]
    );

    const filteredTracks = useMemo(() => {
        if (!searchTerm.trim()) return tracks;
        const q = searchTerm.toLowerCase();
        return tracks.filter((t) => t.title.toLowerCase().includes(q));
    }, [tracks, searchTerm]);

    const handlePlayAudio = useCallback((track) => {
        setAudioTrack({ ...track, albumName: name, posterUrl });
    }, [name, posterUrl]);

    const handlePlayVideo = useCallback((track) => {
        setVideoTrack(track);
    }, []);

    return (
        <div className="ytm-detail-view">
            {backdropUrl && (
                <div className="ytm-detail-backdrop" style={{ backgroundImage: `url(${backdropUrl})` }} />
            )}

            {videoTrack && (
                <YTVideoModal
                    videoId={videoTrack.id}
                    title={videoTrack.title}
                    onClose={() => setVideoTrack(null)}
                />
            )}

            <div className="ytm-detail-content">
                <button className="ytm-back-btn" onClick={onBack}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Albums
                </button>

                {/* Hero */}
                <div className="ytm-detail-hero">
                    {posterUrl
                        ? <img src={posterUrl} alt={name} className="ytm-detail-poster" />
                        : <div className="ytm-detail-poster-fallback">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                    }
                    <div className="ytm-detail-meta">
                        <h1 className="ytm-detail-title">{name}</h1>
                        {language && <span className="ytm-detail-lang-badge">{language}</span>}
                        <p className="ytm-detail-subtitle">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#ff0000", marginRight: 6, verticalAlign: "middle", flexShrink: 0 }}>
                                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                            </svg>
                            {tracks.length} song{tracks.length !== 1 ? "s" : ""} on YouTube
                        </p>
                        {/* Quick play all */}
                        {tracks.length > 0 && (
                            <button
                                className="ytm-play-all-btn"
                                onClick={() => handlePlayAudio(tracks[0])}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Play First Song
                            </button>
                        )}
                    </div>
                </div>

                {/* Track List */}
                <div className="ytm-tracks-section">
                    <div className="ytm-tracks-header">
                        <h2 className="ytm-songs-heading">Songs</h2>
                        <div className="ytm-tracks-search-wrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                className="ytm-tracks-search"
                                placeholder="Find in album…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="ytm-tracks-list">
                        {filteredTracks.length === 0 ? (
                            <div className="ytm-empty" style={{ padding: "30px 0" }}>No songs found</div>
                        ) : (
                            filteredTracks.map((track) => (
                                <TrackRow
                                    key={track.id}
                                    index={track.index}
                                    ytId={track.id}
                                    title={track.title}
                                    isCurrent={audioTrack?.id === track.id}
                                    onPlayAudio={handlePlayAudio}
                                    onPlayVideo={handlePlayVideo}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Persistent audio player bar at the bottom */}
            <YTAudioPlayer
                track={audioTrack}
                onClose={() => setAudioTrack(null)}
            />
        </div>
    );
};

// ─── Album Card ───────────────────────────────────────────────────────────────
const YTMusicAlbumCard = React.memo(({ album, onClick }) => {
    const { name, language, youtubeIDs, posterUrl, loading } = album;
    const songCount = youtubeIDs?.length || 0;

    return (
        <div className="ytm-album-card" onClick={onClick}>
            <div className="ytm-album-cover-wrap">
                {loading ? (
                    <div className="ytm-album-cover-skeleton" />
                ) : posterUrl ? (
                    <img src={posterUrl} alt={name} className="ytm-album-cover" loading="lazy" />
                ) : (
                    <div className="ytm-album-cover-fallback">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                    </div>
                )}
                <div className="ytm-album-song-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                    </svg>
                    {songCount} {songCount === 1 ? "song" : "songs"}
                </div>
            </div>
            <div className="ytm-album-info">
                <h3 className="ytm-album-name">{name}</h3>
                {language && <span className="ytm-album-lang">{language}</span>}
            </div>
        </div>
    );
});

// ─── Main Grid View ───────────────────────────────────────────────────────────
const YouTubeMusicView = () => {
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const rawAlbums = useMemo(() =>
        Object.entries(movieYoutubeMapper).map(([tmdbId, data]) => ({
            tmdbId,
            name: data.name,
            language: data.language,
            youtubeIDs: data.youtubeIDs || [],
            posterUrl: null,
            backdropUrl: null,
            loading: true,
        })),
        []
    );

    // Fetch TMDB posters progressively in batches
    useEffect(() => {
        let isMounted = true;
        setAlbums(rawAlbums);

        const fetchPosters = async () => {
            const BATCH = 5;
            const delay = (ms) => new Promise((r) => setTimeout(r, ms));

            for (let i = 0; i < rawAlbums.length; i += BATCH) {
                if (!isMounted) break;
                const batch = rawAlbums.slice(i, i + BATCH);

                const results = await Promise.all(
                    batch.map(async (album) => {
                        try {
                            const data = await getDetails(album.tmdbId, "movie");
                            return {
                                tmdbId: album.tmdbId,
                                posterUrl: data?.poster_path ? getImageUrl(data.poster_path, "w500") : null,
                                backdropUrl: data?.backdrop_path ? getImageUrl(data.backdrop_path, "original") : null,
                            };
                        } catch {
                            return { tmdbId: album.tmdbId, posterUrl: null, backdropUrl: null };
                        }
                    })
                );

                if (!isMounted) break;
                setAlbums((prev) =>
                    prev.map((a) => {
                        const found = results.find((r) => r.tmdbId === a.tmdbId);
                        return found ? { ...a, ...found, loading: false } : a;
                    })
                );
                if (i + BATCH < rawAlbums.length) await delay(300);
            }
        };

        fetchPosters();
        return () => { isMounted = false; };
    }, [rawAlbums]);

    const languages = useMemo(() => {
        const langs = new Set(rawAlbums.map((a) => a.language).filter(Boolean));
        return ["All", ...Array.from(langs).sort()];
    }, [rawAlbums]);

    const filteredAlbums = useMemo(() => {
        let result = albums;
        if (selectedLanguage !== "All") result = result.filter((a) => a.language === selectedLanguage);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            result = result.filter((a) => a.name?.toLowerCase().includes(q));
        }
        return result;
    }, [albums, selectedLanguage, searchTerm]);

    if (selectedAlbum) {
        return <YTMusicDetail album={selectedAlbum} onBack={() => setSelectedAlbum(null)} />;
    }

    return (
        <div className="ytm-view">
            {/* Header */}
            <div className="ytm-header">
                <div className="ytm-header-title-row">
                    <div className="ytm-header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="ytm-header-title">YouTube Music</h1>
                        <p className="ytm-header-subtitle">{rawAlbums.length} movie albums · Spotify backup player</p>
                    </div>
                </div>

                <div className="ytm-controls">
                    <div className="ytm-search-wrap">
                        <svg className="ytm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            className="ytm-search-input"
                            placeholder="Search movies…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="ytm-lang-filters">
                        {languages.map((lang) => (
                            <button
                                key={lang}
                                className={`ytm-lang-pill ${selectedLanguage === lang ? "active" : ""}`}
                                onClick={() => setSelectedLanguage(lang)}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {filteredAlbums.length === 0 ? (
                <div className="ytm-empty">No albums found</div>
            ) : (
                <div className="ytm-grid">
                    {filteredAlbums.map((album) => (
                        <YTMusicAlbumCard
                            key={album.tmdbId}
                            album={album}
                            onClick={() => setSelectedAlbum(album)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouTubeMusicView;
