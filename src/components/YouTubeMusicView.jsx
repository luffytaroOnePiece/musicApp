/**
 * YouTubeMusicView.jsx
 *
 * A fully self-contained YouTube Music page.
 * - NO Spotify SDK / API calls
 * - Data: movieYoutubeMapper.json (keyed by TMDB movie ID)
 * - Covers / info: TMDB API
 * - Playback: YouTube IFrame embed (audio + video modes)
 * - Layout: mirrors the Albums page visually (grid → detail → player)
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getDetails, getImages, getImageUrl } from "../services/tmdbApi";
import movieYoutubeMapper from "../data/movieYoutubeMapper.json";
import youtubeMixData from "../data/youtubeMixData.json";
import "../styles/YouTubeMusicView.css";

// ─── Fast video-ID → title lookup ────────────────────────────────────────────
const videoTitleMap = Object.fromEntries(
    (youtubeMixData.videos || []).map((v) => [v.youtubeLinkID, v.title])
);

// ─── Shared Language / Type pill bar (mirrors AlbumsHeader style) ────────────
const FilterBar = ({ languages, selectedLang, onLang, searchTerm, onSearch }) => (
    <div className="ytm-filter-bar">
        <div className="ytm-search-wrap">
            <svg className="ytm-search-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                className="ytm-search-input"
                placeholder="Search movies…"
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
            />
        </div>
        <div className="ytm-lang-filters">
            {languages.map((lang) => (
                <button
                    key={lang}
                    className={`ytm-lang-pill ${selectedLang === lang ? "active" : ""}`}
                    onClick={() => onLang(lang)}
                >
                    {lang}
                </button>
            ))}
        </div>
    </div>
);

// ─── Album Card (mirrors AlbumCard.jsx look) ──────────────────────────────────
const YTAlbumCard = React.memo(({ album, onClick }) => {
    const { name, language, youtubeIDs, posterUrl, loading } = album;
    const count = youtubeIDs?.length || 0;

    return (
        <div className="ytm-album-card" onClick={onClick}>
            <div className="ytm-album-cover-wrap">
                {loading ? (
                    <div className="ytm-album-cover-skeleton" />
                ) : posterUrl ? (
                    <img src={posterUrl} alt={name} className="ytm-album-cover" loading="lazy" />
                ) : (
                    <div className="ytm-album-cover-fallback">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="16" r="3" />
                        </svg>
                    </div>
                )}
                <div className="ytm-song-count-badge">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                    </svg>
                    {count} {count === 1 ? "song" : "songs"}
                </div>
            </div>
            <div className="ytm-album-info">
                <h3 className="ytm-album-name">{name}</h3>
                {language && <span className="ytm-album-lang">{language}</span>}
            </div>
        </div>
    );
});

// ─── Full-screen YouTube Player (expands from mini bar) ──────────────────────
const YTFullPlayer = ({ track, tracks, albumName, posterUrl, onClose, onSelectTrack }) => {
    useEffect(() => {
        const fn = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [onClose]);

    if (!track) return null;

    return (
        <div className="ytm-full-player">
            {/* Blurred poster backdrop */}
            {posterUrl && (
                <div
                    className="ytm-fp-backdrop"
                    style={{ backgroundImage: `url(${posterUrl})` }}
                />
            )}

            <div className="ytm-fp-inner">
                {/* Header */}
                <div className="ytm-fp-header">
                    <button className="ytm-fp-close" onClick={onClose} title="Collapse">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    <div className="ytm-fp-header-meta">
                        <span className="ytm-fp-album-name">{albumName}</span>
                    </div>
                    <div style={{ width: 40 }} />
                </div>

                {/* Main layout: big player + sidebar track list */}
                <div className="ytm-fp-body">
                    {/* Big video embed */}
                    <div className="ytm-fp-video-wrap">
                        <iframe
                            key={track.id}
                            src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0&controls=1`}
                            title={track.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="ytm-fp-iframe"
                        />
                    </div>

                    {/* Right panel: track info + track list */}
                    <div className="ytm-fp-sidebar">
                        <div className="ytm-fp-now-info">
                            {posterUrl && (
                                <img src={posterUrl} alt={albumName} className="ytm-fp-poster" />
                            )}
                            <h2 className="ytm-fp-track-title">{track.title}</h2>
                            <p className="ytm-fp-track-album">{albumName}</p>
                        </div>

                        <h4 className="ytm-fp-queue-heading">Up Next</h4>
                        <div className="ytm-fp-queue">
                            {tracks.map((t, i) => (
                                <div
                                    key={t.id}
                                    className={`ytm-fp-queue-row${t.id === track.id ? " active" : ""}`}
                                    onClick={() => onSelectTrack(t)}
                                >
                                    <img
                                        src={`https://img.youtube.com/vi/${t.id}/default.jpg`}
                                        alt={t.title}
                                        className="ytm-fp-queue-thumb"
                                    />
                                    <span className="ytm-fp-queue-title" title={t.title}>{t.title}</span>
                                    {t.id === track.id && (
                                        <div className="ytm-fp-queue-bars">
                                            <span /><span /><span />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Mini Embedded Player Bar ─────────────────────────────────────────────────
const YTEmbedPlayer = ({ track, onClose, onExpand, fullPlayerOpen }) => {
    if (!track) return null;
    return (
        <div className="ytm-embed-player">
            {/* Clickable area → opens full player */}
            <div className="ytm-ep-click-area" onClick={onExpand} title="Open full player">
                <div className="ytm-ep-art">
                    <img
                        src={`https://img.youtube.com/vi/${track.id}/default.jpg`}
                        alt={track.title}
                        className="ytm-ep-art-img"
                    />
                    <div className="ytm-ep-expand-hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </div>
                </div>
                <div className="ytm-ep-meta">
                    <span className="ytm-ep-title" title={track.title}>{track.title}</span>
                    <span className="ytm-ep-album">{track.albumName}</span>
                </div>
            </div>
            {/* Only render iframe when full player is closed — prevents dual audio */}
            {!fullPlayerOpen && (
                <div className="ytm-ep-frame-wrap">
                    <iframe
                        key={track.id}
                        src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0&controls=1`}
                        title={track.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="ytm-ep-iframe"
                    />
                </div>
            )}
            <button className="ytm-ep-close" onClick={onClose} title="Close player">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
};

// ─── Full-screen Video Modal ──────────────────────────────────────────────────
const YTVideoModal = ({ track, onClose }) => {
    useEffect(() => {
        const fn = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [onClose]);

    if (!track) return null;
    return (
        <div className="ytm-modal-overlay" onClick={onClose}>
            <div className="ytm-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="ytm-modal-header">
                    <span className="ytm-modal-title" title={track.title}>{track.title}</span>
                    <button className="ytm-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="ytm-modal-player-wrap">
                    <iframe
                        src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0&controls=1`}
                        title={track.title}
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

// ─── Track Row (mirrors AlbumTracks row style) ────────────────────────────────
const TrackCard = React.memo(({ index, ytId, title, isCurrent, onAudio, onVideo }) => (
    <div className={`ytm-track-card${isCurrent ? " ytm-track-card--active" : ""}`}>
        {/* Thumbnail */}
        <div className="ytm-tc-thumb-wrap">
            <img
                src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                alt={title}
                className="ytm-tc-thumb"
                loading="lazy"
                onError={(e) => {
                    if (e.target.src.includes('maxresdefault')) {
                        e.target.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                    } else {
                        e.target.onerror = null;
                        e.target.src = `https://img.youtube.com/vi/${ytId}/default.jpg`;
                    }
                }}
            />
            {/* Track number badge */}
            <div className="ytm-tc-index-badge">
                {isCurrent ? (
                    <div className="ytm-now-bars">
                        <span /><span /><span />
                    </div>
                ) : (
                    <span>{index + 1}</span>
                )}
            </div>
            {/* Hover overlay: play icon */}
            <div className="ytm-tc-hover-overlay" onClick={() => onAudio({ id: ytId, title })}>
                <div className="ytm-tc-play-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        </div>

        {/* Card footer */}
        <div className="ytm-tc-footer">
            <p className="ytm-tc-title" title={title}>{title}</p>
            <div className="ytm-tc-btns">
                <button
                    className={`ytm-tbtn ytm-tbtn--play${isCurrent ? " active" : ""}`}
                    onClick={() => onAudio({ id: ytId, title })}
                    title="Play audio"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                </button>
                <button
                    className="ytm-tbtn ytm-tbtn--watch"
                    onClick={() => onVideo({ id: ytId, title })}
                    title="Watch video"
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                    </svg>
                    Video
                </button>
            </div>
        </div>
    </div>
));


// ─── Album Detail (mirrors AlbumDetail layout) ────────────────────────────────
const YTAlbumDetail = ({ album, onBack }) => {
    const { tmdbId, name, language, youtubeIDs, posterUrl } = album;

    const [activeTrack, setActiveTrack] = useState(null); // audio player
    const [fullPlayerOpen, setFullPlayerOpen] = useState(false); // full-screen player
    const [videoTrack, setVideoTrack] = useState(null); // video modal
    const [localSearch, setLocalSearch] = useState("");
    const [viewMode, setViewMode] = useState("tracks"); // "tracks" | "info"
    const [tmdbInfo, setTmdbInfo] = useState(null);
    const [tmdbImages, setTmdbImages] = useState([]);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [lightbox, setLightbox] = useState(null);
    const [backdropUrl, setBackdropUrl] = useState(null);

    // Build tracks list
    const tracks = useMemo(() =>
        (youtubeIDs || []).map((id, i) => ({
            id,
            title: videoTitleMap[id] || `Song ${i + 1}`,
            index: i,
        })), [youtubeIDs]
    );

    const filteredTracks = useMemo(() => {
        const q = localSearch.toLowerCase();
        return q ? tracks.filter((t) => t.title.toLowerCase().includes(q)) : tracks;
    }, [tracks, localSearch]);

    // Fetch TMDB backdrop on mount
    useEffect(() => {
        let mounted = true;
        const fetchBackdrop = async () => {
            const data = await getDetails(tmdbId, "movie").catch(() => null);
            if (mounted && data?.backdrop_path) {
                setBackdropUrl(getImageUrl(data.backdrop_path, "original"));
            }
        };
        fetchBackdrop();
        return () => { mounted = false; };
    }, [tmdbId]);

    // Fetch TMDB info when switching to Info tab
    useEffect(() => {
        if (viewMode !== "info" || tmdbInfo) return;
        let mounted = true;
        const fetch = async () => {
            setLoadingInfo(true);
            const details = await getDetails(tmdbId, "movie").catch(() => null);
            const imgs = await getImages(tmdbId, "movie").catch(() => null);
            if (mounted) {
                setTmdbInfo(details);
                setTmdbImages([...(imgs?.backdrops || []), ...(imgs?.posters || [])]);
                setLoadingInfo(false);
            }
        };
        fetch();
        return () => { mounted = false; };
    }, [viewMode, tmdbId, tmdbInfo]);

    const handleAudio = useCallback((t) =>
        setActiveTrack({ ...t, albumName: name }), [name]);
    const handleVideo = useCallback((t) =>
        setVideoTrack(t), []);

    /* ── render ── */
    return (
        <div className="ytm-detail-view">
            {/* Blurred backdrop */}
            {backdropUrl && (
                <div className="ytm-detail-backdrop"
                    style={{ backgroundImage: `url(${backdropUrl})` }} />
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="ytm-lightbox-overlay" onClick={() => setLightbox(null)}>
                    <div className="ytm-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="ytm-lightbox-close" onClick={() => setLightbox(null)}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <img src={lightbox} alt="full" className="ytm-lightbox-img" />
                    </div>
                </div>
            )}

            {/* Video modal */}
            {videoTrack && (
                <YTVideoModal track={videoTrack} onClose={() => setVideoTrack(null)} />
            )}

            <div className="ytm-detail-content">
                {/* ── Album header (mirrors AlbumHeader) ── */}
                <div className="ytm-detail-header">
                    <button className="ytm-back-btn" onClick={onBack}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                    </button>

                    <div className="ytm-detail-hero">
                        {posterUrl ? (
                            <img src={posterUrl} alt={name} className="ytm-detail-poster" />
                        ) : (
                            <div className="ytm-detail-poster-fallback">
                                <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                            </div>
                        )}

                        <div className="ytm-detail-meta">
                            <p className="ytm-detail-type">Movie Soundtrack</p>
                            <h1 className="ytm-detail-title">{name}</h1>
                            {language && <span className="ytm-detail-lang-badge">{language}</span>}
                            <p className="ytm-detail-count">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                                    style={{ color: "#ff0000", marginRight: 6, flexShrink: 0 }}>
                                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                                </svg>
                                {tracks.length} song{tracks.length !== 1 ? "s" : ""}
                            </p>

                            {/* Action buttons – mirrors AlbumHeader Play / Shuffle */}
                            <div className="ytm-detail-actions">
                                {tracks.length > 0 && (
                                    <button className="ytm-action-btn ytm-action-btn--play"
                                        onClick={() => handleAudio(tracks[0])}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Play
                                    </button>
                                )}
                                {tracks.length > 1 && (
                                    <button className="ytm-action-btn ytm-action-btn--shuffle"
                                        onClick={() => {
                                            const r = tracks[Math.floor(Math.random() * tracks.length)];
                                            handleAudio(r);
                                        }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="2">
                                            <polyline points="16 3 21 3 21 8" />
                                            <line x1="4" y1="20" x2="21" y2="3" />
                                            <polyline points="21 16 21 21 16 21" />
                                            <line x1="15" y1="15" x2="21" y2="21" />
                                        </svg>
                                        Shuffle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View mode tabs — mirrors AlbumHeader tabs */}
                    <div className="ytm-view-tabs">
                        {["tracks", "info"].map((m) => (
                            <button
                                key={m}
                                className={`ytm-tab${viewMode === m ? " active" : ""}`}
                                onClick={() => setViewMode(m)}
                            >
                                {m === "tracks" ? "Songs" : "Movie Info"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tracks view ── */}
                {viewMode === "tracks" && (
                    <div className="ytm-tracks-section">
                        {/* Search within album – mirrors AlbumTracks search bar */}
                        <div className="ytm-tracks-toolbar">
                            <div className="ytm-track-search-wrap">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    className="ytm-track-search"
                                    placeholder="Find in this album…"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="ytm-tracks-grid">
                            {filteredTracks.length === 0 ? (
                                <p className="ytm-empty-msg">No songs found</p>
                            ) : filteredTracks.map((t) => (
                                <TrackCard
                                    key={t.id}
                                    index={t.index}
                                    ytId={t.id}
                                    title={t.title}
                                    isCurrent={activeTrack?.id === t.id}
                                    onAudio={handleAudio}
                                    onVideo={handleVideo}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TMDB Info view (mirrors AlbumDetail Info tab) ── */}
                {viewMode === "info" && (
                    <div className="ytm-info-section">
                        {loadingInfo ? (
                            <div className="ytm-loading">Loading info…</div>
                        ) : tmdbInfo ? (
                            <div className="ytm-tmdb-content">
                                {tmdbInfo.tagline && (
                                    <p className="ytm-tmdb-tagline">{tmdbInfo.tagline}</p>
                                )}
                                {tmdbInfo.overview && (
                                    <p className="ytm-tmdb-overview">{tmdbInfo.overview}</p>
                                )}
                                <div className="ytm-tmdb-meta">
                                    {tmdbInfo.release_date && (
                                        <span>Release: {tmdbInfo.release_date}</span>
                                    )}
                                    {tmdbInfo.vote_average && (
                                        <span>Rating: {tmdbInfo.vote_average.toFixed(1)} / 10</span>
                                    )}
                                    {tmdbInfo.runtime && (
                                        <span>Runtime: {tmdbInfo.runtime} min</span>
                                    )}
                                </div>
                                {tmdbImages.length > 0 && (
                                    <div className="ytm-tmdb-gallery-wrap">
                                        <h4>Images</h4>
                                        <div className="ytm-tmdb-gallery">
                                            {tmdbImages.slice(0, 20).map((img, i) => {
                                                const src = getImageUrl(img.file_path, "original");
                                                return (
                                                    <img key={i} src={src} alt="scene"
                                                        className="ytm-tmdb-gallery-img"
                                                        loading="lazy"
                                                        onClick={() => setLightbox(src)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="ytm-empty-msg">No movie info found.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Full-screen player – opens when clicking mini bar */}
            {fullPlayerOpen && activeTrack && (
                <YTFullPlayer
                    track={activeTrack}
                    tracks={tracks}
                    albumName={name}
                    posterUrl={posterUrl}
                    onClose={() => setFullPlayerOpen(false)}
                    onSelectTrack={(t) => {
                        setActiveTrack({ ...t, albumName: name });
                    }}
                />
            )}

            {/* Mini embedded player bar */}
            <YTEmbedPlayer
                track={activeTrack}
                onClose={() => { setActiveTrack(null); setFullPlayerOpen(false); }}
                onExpand={() => setFullPlayerOpen(true)}
                fullPlayerOpen={fullPlayerOpen}
            />
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const YouTubeMusicView = () => {
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [selLang, setSelLang] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Build raw album list from mapper (no Spotify needed)
    const rawAlbums = useMemo(() =>
        Object.entries(movieYoutubeMapper).map(([tmdbId, data]) => ({
            tmdbId,
            name: data.name,
            language: data.language,
            youtubeIDs: data.youtubeIDs || [],
            posterUrl: null,
            loading: true,
        })), []
    );

    // Progressively fetch TMDB posters
    useEffect(() => {
        let isMounted = true;
        setAlbums(rawAlbums);

        const run = async () => {
            const BATCH = 4;
            const delay = (ms) => new Promise((r) => setTimeout(r, ms));

            for (let i = 0; i < rawAlbums.length; i += BATCH) {
                if (!isMounted) break;
                const batch = rawAlbums.slice(i, i + BATCH);

                const results = await Promise.all(batch.map(async (a) => {
                    try {
                        const d = await getDetails(a.tmdbId, "movie");
                        return {
                            tmdbId: a.tmdbId,
                            posterUrl: d?.poster_path ? getImageUrl(d.poster_path, "w500") : null,
                        };
                    } catch {
                        return { tmdbId: a.tmdbId, posterUrl: null };
                    }
                }));

                if (!isMounted) break;
                setAlbums((prev) => prev.map((a) => {
                    const hit = results.find((r) => r.tmdbId === a.tmdbId);
                    return hit ? { ...a, posterUrl: hit.posterUrl, loading: false } : a;
                }));

                if (i + BATCH < rawAlbums.length) await delay(300);
            }
        };

        run();
        return () => { isMounted = false; };
    }, [rawAlbums]);

    const languages = useMemo(() => {
        const s = new Set(rawAlbums.map((a) => a.language).filter(Boolean));
        return ["All", ...Array.from(s).sort()];
    }, [rawAlbums]);

    const filtered = useMemo(() => {
        let r = albums;
        if (selLang !== "All") r = r.filter((a) => a.language === selLang);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            r = r.filter((a) => a.name?.toLowerCase().includes(q));
        }
        return r;
    }, [albums, selLang, searchTerm]);

    if (selectedAlbum) {
        return <YTAlbumDetail album={selectedAlbum} onBack={() => setSelectedAlbum(null)} />;
    }

    return (
        <div className="ytm-view">
            {/* Page header */}
            <div className="ytm-page-header">
                <div className="ytm-page-header-row">
                    <div className="ytm-page-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="ytm-page-title">YouTube Music</h1>
                        <p className="ytm-page-sub">
                            {rawAlbums.length} movie soundtracks · Spotify-free player
                        </p>
                    </div>
                </div>

                <FilterBar
                    languages={languages}
                    selectedLang={selLang}
                    onLang={setSelLang}
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                />
            </div>

            {/* Album grid */}
            {filtered.length === 0 ? (
                <div className="ytm-empty">No albums found</div>
            ) : (
                <div className="ytm-grid">
                    {filtered.map((a) => (
                        <YTAlbumCard
                            key={a.tmdbId}
                            album={a}
                            onClick={() => setSelectedAlbum(a)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouTubeMusicView;
