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

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { getDetails, getImages, getImageUrl } from "../services/tmdbApi";
import movieYoutubeMapper from "../data/movieYoutubeMapper.json";
import youtubeMixData from "../data/youtubeMixData.json";
import "../styles/YouTubeMusicView.css";

// ─── Fast video-ID → title lookup ────────────────────────────────────────────
const videoTitleMap = Object.fromEntries(
  (youtubeMixData.videos || []).map((v) => [v.youtubeLinkID, v.title]),
);

// ─── Shared Language / Type pill bar (mirrors AlbumsHeader style) ────────────
const FilterBar = ({
  languages,
  selectedLang,
  onLang,
  searchTerm,
  onSearch,
}) => (
  <div className="ytm-filter-bar">
    <div className="ytm-search-wrap">
      <svg
        className="ytm-search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
          <img
            src={posterUrl}
            alt={name}
            className="ytm-album-cover"
            loading="lazy"
          />
        ) : (
          <div className="ytm-album-cover-fallback">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
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
const YTFullPlayer = ({
  track,
  tracks,
  albumName,
  posterUrl,
  onClose,
  onSelectTrack,
}) => {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
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
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
                <img
                  src={posterUrl}
                  alt={albumName}
                  className="ytm-fp-poster"
                />
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
                  <span className="ytm-fp-queue-title" title={t.title}>
                    {t.title}
                  </span>
                  {t.id === track.id && (
                    <div className="ytm-fp-queue-bars">
                      <span />
                      <span />
                      <span />
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
// Load YouTube IFrame API once
let ytApiReady = false;
let ytApiCallbacks = [];
function loadYTApi() {
  if (ytApiReady || document.getElementById("yt-iframe-api")) return;
  const tag = document.createElement("script");
  tag.id = "yt-iframe-api";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytApiCallbacks.forEach((cb) => cb());
    ytApiCallbacks = [];
  };
}
function onYTReady(cb) {
  if (ytApiReady) cb();
  else {
    loadYTApi();
    ytApiCallbacks.push(cb);
  }
}

const YTEmbedPlayer = ({
  track,
  tracks,
  onClose,
  onExpand,
  onSelectTrack,
  fullPlayerOpen,
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRef = useRef(null);
  const isSeeking = useRef(false);

  const currentIdx = tracks ? tracks.findIndex((t) => t.id === track?.id) : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx !== -1 && currentIdx < (tracks?.length ?? 0) - 1;

  const goPrev = () => {
    if (hasPrev && onSelectTrack) onSelectTrack(tracks[currentIdx - 1]);
  };
  const goNext = () => {
    if (hasNext && onSelectTrack) onSelectTrack(tracks[currentIdx + 1]);
  };

  // Create / destroy YT player
  useEffect(() => {
    if (!track || fullPlayerOpen) {
      // Destroy player when full player is open or no track
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    const createPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "1",
        width: "1",
        videoId: track.id,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0
            if (e.data === 1) setIsPlaying(true);
            else if (e.data === 2) setIsPlaying(false);
            else if (e.data === 0 && hasNext && onSelectTrack) {
              // Auto-advance to next track when current ends
              onSelectTrack(tracks[currentIdx + 1]);
            }
          },
        },
      });
      setIsPlaying(true);
    };

    onYTReady(createPlayer);

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [track?.id, fullPlayerOpen]);

  // Poll current time & duration
  useEffect(() => {
    if (!track || fullPlayerOpen) return;
    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function" &&
        !isSeeking.current
      ) {
        const ct = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        setCurrentTime(ct);
        setDuration(dur);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [track?.id, fullPlayerOpen]);

  // Reset times when track changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [track?.id]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = pct * duration;
    isSeeking.current = true;
    playerRef.current.seekTo(seekTo, true);
    setCurrentTime(seekTo);
    setTimeout(() => {
      isSeeking.current = false;
    }, 600);
  };

  if (!track) return null;

  return (
    <div className="ytm-embed-player">
      {/* Hidden YT player container */}
      {!fullPlayerOpen && (
        <div className="ytm-ep-frame-wrap">
          <div ref={containerRef} />
        </div>
      )}

      {/* Left: art + meta */}
      <div className="ytm-ep-left" onClick={onExpand} title="Expand player">
        <div className="ytm-ep-art-wrap">
          <img
            src={`https://img.youtube.com/vi/${track.id}/mqdefault.jpg`}
            alt={track.title}
            className="ytm-ep-art-img"
          />
          <div className="ytm-ep-art-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polyline
                points="18 15 12 9 6 15"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="ytm-ep-meta">
          <div className="ytm-ep-now-row">
            {isPlaying && !fullPlayerOpen && (
              <div className="ytm-ep-bars">
                <span />
                <span />
                <span />
              </div>
            )}
            <span className="ytm-ep-now-label">
              {isPlaying && !fullPlayerOpen ? "Now Playing" : "Paused"}
            </span>
          </div>
          <span className="ytm-ep-title" title={track.title}>
            {track.title}
          </span>
          <span className="ytm-ep-album">{track.albumName}</span>
        </div>
      </div>

      {/* Centre: Prev / Play-Pause / Next */}
      <div className="ytm-ep-controls">
        <button
          className={`ytm-ep-ctrl-btn${!hasPrev ? " disabled" : ""}`}
          onClick={goPrev}
          disabled={!hasPrev}
          title="Previous"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        {/* Play / Pause toggle */}
        <button
          className="ytm-ep-play-pause"
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          className={`ytm-ep-ctrl-btn${!hasNext ? " disabled" : ""}`}
          onClick={goNext}
          disabled={!hasNext}
          title="Next"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1z" />
            <path d="M16 6h2v12h-2z" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="ytm-ep-progress-section">
        <span className="ytm-ep-time">{fmtTime(currentTime)}</span>
        <div
          className="ytm-ep-progress-bar"
          ref={progressRef}
          onClick={handleSeek}
        >
          <div className="ytm-ep-progress-track">
            <div
              className="ytm-ep-progress-fill"
              style={{
                width:
                  duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
            <div
              className="ytm-ep-progress-thumb"
              style={{
                left:
                  duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
        <span className="ytm-ep-time">{fmtTime(duration)}</span>
      </div>

      {/* Right: expand + close */}
      <div className="ytm-ep-actions">
        <button
          className="ytm-ep-expand-btn"
          onClick={onExpand}
          title="Open full player"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span>Full Player</span>
        </button>
        <button className="ytm-ep-close" onClick={onClose} title="Close">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Full-screen Video Modal ──────────────────────────────────────────────────
const YTVideoModal = ({ track, onClose }) => {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!track) return null;
  return (
    <div className="ytm-modal-overlay" onClick={onClose}>
      <div className="ytm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ytm-modal-header">
          <span className="ytm-modal-title" title={track.title}>
            {track.title}
          </span>
          <button className="ytm-modal-close" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
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
const TrackCard = React.memo(
  ({ index, ytId, title, isCurrent, onAudio, onVideo }) => (
    <div
      className={`ytm-track-card${isCurrent ? " ytm-track-card--active" : ""}`}
    >
      {/* Thumbnail */}
      <div
        className="ytm-tc-thumb-wrap"
        onClick={() => onAudio({ id: ytId, title })}
      >
        <img
          src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
          alt={title}
          className="ytm-tc-thumb"
          loading="lazy"
          onError={(e) => {
            if (e.target.src.includes("maxresdefault")) {
              e.target.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
            } else {
              e.target.onerror = null;
              e.target.src = `https://img.youtube.com/vi/${ytId}/default.jpg`;
            }
          }}
        />
        <div className="ytm-tc-overlay">
          {isCurrent ? (
            <div className="ytm-tc-bars">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <svg
              className="ytm-tc-play-icon"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="ytm-tc-footer">
        <p className="ytm-tc-title" title={title}>
          {title}
        </p>
        <div className="ytm-tc-actions">
          <button
            className={`ytm-tc-btn ytm-tc-btn--play${isCurrent ? " active" : ""}`}
            onClick={() => onAudio({ id: ytId, title })}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isCurrent ? "Playing" : "Play"}
          </button>
          <button
            className="ytm-tc-btn ytm-tc-btn--video"
            onClick={() => onVideo({ id: ytId, title })}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
            </svg>
            Video
          </button>
        </div>
      </div>
    </div>
  ),
);

// ─── Compact List Row ─────────────────────────────────────────────────────────
const TrackListRow = React.memo(
  ({ index, ytId, title, isCurrent, onAudio, onVideo }) => (
    <div
      className={`ytm-list-row${isCurrent ? " ytm-list-row--active" : ""}`}
      onClick={() => onAudio({ id: ytId, title })}
    >
      <div className="ytm-list-row-num">
        {isCurrent ? (
          <div className="ytm-list-row-bars">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <span className="ytm-list-row-idx">{index + 1}</span>
        )}
      </div>
      <img
        src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
        alt={title}
        className="ytm-list-row-thumb"
        loading="lazy"
      />
      <span
        className={`ytm-list-row-title${isCurrent ? " active" : ""}`}
        title={title}
      >
        {title}
      </span>
      <div className="ytm-list-row-actions">
        <button
          className={`ytm-list-row-btn${isCurrent ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onAudio({ id: ytId, title });
          }}
          title={isCurrent ? "Playing" : "Play"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button
          className="ytm-list-row-btn"
          onClick={(e) => {
            e.stopPropagation();
            onVideo({ id: ytId, title });
          }}
          title="Watch video"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
          </svg>
        </button>
      </div>
    </div>
  ),
);

// ─── Album Detail (mirrors AlbumDetail layout) ────────────────────────────────
const YTAlbumDetail = ({ album, onBack, allAlbums, onSelectAlbum }) => {
  const {
    tmdbId,
    name,
    language,
    type,
    personID,
    youtubeIDs,
    liveIDs,
    posterUrl,
  } = album;
  const isPrivate = type === "Private";

  const [activeTrack, setActiveTrack] = useState(null); // audio player
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false); // full-screen player
  const [videoTrack, setVideoTrack] = useState(null); // video modal
  const [localSearch, setLocalSearch] = useState("");
  const [viewMode, setViewMode] = useState("tracks"); // "tracks" | "live" | "info"
  const [trackLayout, setTrackLayout] = useState("grid"); // "grid" | "list"

  const hasLive = liveIDs && liveIDs.length > 0;
  const [tmdbInfo, setTmdbInfo] = useState(null);
  const [tmdbImages, setTmdbImages] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [backdropUrl, setBackdropUrl] = useState(null);

  // Build tracks list
  const tracks = useMemo(
    () =>
      (youtubeIDs || []).map((id, i) => ({
        id,
        title: videoTitleMap[id] || `Song ${i + 1}`,
        index: i,
      })),
    [youtubeIDs],
  );

  // Build live tracks list
  const liveTracks = useMemo(() => {
    if (!liveIDs || liveIDs.length === 0) return [];
    return liveIDs.map((live, i) => {
      const officialTitle =
        videoTitleMap[live.officialId] || `Song ${live.songIndex + 1}`;
      return {
        id: live.liveId,
        title: `${officialTitle} (Live ${live.liveNum})`,
        index: i,
        officialId: live.officialId,
      };
    });
  }, [liveIDs]);

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
    return () => {
      mounted = false;
    };
  }, [tmdbId]);

  // Fetch TMDB info when switching to Info tab
  useEffect(() => {
    if (viewMode !== "info" || tmdbInfo) return;
    let mounted = true;
    const fetchInfo = async () => {
      setLoadingInfo(true);
      if (isPrivate && personID) {
        const details = await getDetails(personID, "person").catch(() => null);
        const imgs = await getImages(personID, "person").catch(() => null);
        if (mounted) {
          setTmdbInfo(details);
          setTmdbImages([...(imgs?.profiles || [])]);
          setLoadingInfo(false);
        }
      } else if (!tmdbId.startsWith("prv-")) {
        const details = await getDetails(tmdbId, "movie").catch(() => null);
        const imgs = await getImages(tmdbId, "movie").catch(() => null);
        if (mounted) {
          setTmdbInfo(details);
          setTmdbImages([...(imgs?.backdrops || []), ...(imgs?.posters || [])]);
          setLoadingInfo(false);
        }
      } else {
        if (mounted) setLoadingInfo(false);
      }
    };
    fetchInfo();
    return () => {
      mounted = false;
    };
  }, [viewMode, tmdbId, tmdbInfo, isPrivate, personID]);

  const handleAudio = useCallback(
    (t) => setActiveTrack({ ...t, albumName: name }),
    [name],
  );
  const handleVideo = useCallback((t) => setVideoTrack(t), []);

  // Build recommendations: 10 random same-language albums
  const recommendations = useMemo(() => {
    if (!allAlbums || allAlbums.length === 0) return [];
    const pool = allAlbums.filter(
      (a) => a.tmdbId !== tmdbId && a.language === language,
    );
    // Fisher-Yates pick 10
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 14);
  }, [allAlbums, tmdbId, language]);

  /* ── render ── */
  return (
    <div
      className={`ytm-detail-view${SPOTIFY_THEME ? " ytm-spotify-theme" : ""}`}
    >
      {/* Blurred backdrop */}
      {backdropUrl && (
        <div
          className="ytm-detail-backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="ytm-lightbox-overlay" onClick={() => setLightbox(null)}>
          <div
            className="ytm-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ytm-lightbox-close"
              onClick={() => setLightbox(null)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}

            <div className="ytm-detail-meta">
              <p className="ytm-detail-type">
                {isPrivate ? "Artist Collection" : "Movie Soundtrack"}
              </p>
              <h1 className="ytm-detail-title">{name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {language && (
                  <span className="ytm-detail-lang-badge">{language}</span>
                )}

                <p
                  className="ytm-detail-count"
                  style={{ display: "flex", alignItems: "center", margin: 0 }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{
                      color: "#ffffffff",
                      marginRight: 6,
                      flexShrink: 0,
                    }}
                  >
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                  </svg>
                  {tracks.length} song{tracks.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Action buttons – mirrors AlbumHeader Play / Shuffle */}
              <div className="ytm-detail-actions">
                {tracks.length > 0 && (
                  <button
                    className="ytm-action-btn ytm-action-btn--play"
                    onClick={() => handleAudio(tracks[0])}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </button>
                )}
                {tracks.length > 1 && (
                  <button
                    className="ytm-action-btn ytm-action-btn--shuffle"
                    onClick={() => {
                      const r =
                        tracks[Math.floor(Math.random() * tracks.length)];
                      handleAudio(r);
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
            {["tracks", ...(hasLive ? ["live"] : []), "info"].map((m) => (
              <button
                key={m}
                className={`ytm-tab${viewMode === m ? " active" : ""}`}
                onClick={() => setViewMode(m)}
              >
                {m === "tracks"
                  ? "Songs"
                  : m === "live"
                    ? `Live (${liveTracks.length})`
                    : isPrivate
                      ? "Artist Info"
                      : "Movie Info"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tracks view ── */}
        {viewMode === "tracks" && (
          <div className="ytm-tracks-section">
            {/* Search within album + layout toggle */}
            <div className="ytm-tracks-toolbar">
              <div className="ytm-track-search-wrap">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
              <div className="ytm-layout-toggle">
                <button
                  className={`ytm-layout-btn${trackLayout === "grid" ? " active" : ""}`}
                  onClick={() => setTrackLayout("grid")}
                  title="Grid view"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  className={`ytm-layout-btn${trackLayout === "list" ? " active" : ""}`}
                  onClick={() => setTrackLayout("list")}
                  title="List view"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {trackLayout === "grid" ? (
              <div className="ytm-tracks-grid">
                {filteredTracks.length === 0 ? (
                  <p className="ytm-empty-msg">No songs found</p>
                ) : (
                  filteredTracks.map((t) => (
                    <TrackCard
                      key={t.id}
                      index={t.index}
                      ytId={t.id}
                      title={t.title}
                      isCurrent={activeTrack?.id === t.id}
                      onAudio={handleAudio}
                      onVideo={handleVideo}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="ytm-tracks-list">
                {filteredTracks.length === 0 ? (
                  <p className="ytm-empty-msg">No songs found</p>
                ) : (
                  filteredTracks.map((t) => (
                    <TrackListRow
                      key={t.id}
                      index={t.index}
                      ytId={t.id}
                      title={t.title}
                      isCurrent={activeTrack?.id === t.id}
                      onAudio={handleAudio}
                      onVideo={handleVideo}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Live view ── */}
        {viewMode === "live" && (
          <div className="ytm-tracks-section">
            {liveTracks.length === 0 ? (
              <p className="ytm-empty-msg">No live performances found</p>
            ) : (
              <div className="ytm-tracks-grid">
                {liveTracks.map((t) => (
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
            )}
          </div>
        )}

        {/* ── TMDB Info view (mirrors AlbumDetail Info tab) ── */}
        {viewMode === "info" && (
          <div className="ytm-info-section">
            {loadingInfo ? (
              <div className="ytm-loading">Loading info…</div>
            ) : tmdbInfo ? (
              <div className="ytm-tmdb-content">
                {/* Movie info */}
                {!isPrivate && (
                  <>
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
                        <span>
                          Rating: {tmdbInfo.vote_average.toFixed(1)} / 10
                        </span>
                      )}
                      {tmdbInfo.runtime && (
                        <span>Runtime: {tmdbInfo.runtime} min</span>
                      )}
                    </div>
                  </>
                )}
                {/* Artist/person info */}
                {isPrivate && (
                  <>
                    {tmdbInfo.biography && (
                      <p className="ytm-tmdb-overview">{tmdbInfo.biography}</p>
                    )}
                    <div className="ytm-tmdb-meta">
                      {tmdbInfo.birthday && (
                        <span>Born: {tmdbInfo.birthday}</span>
                      )}
                      {tmdbInfo.place_of_birth && (
                        <span>From: {tmdbInfo.place_of_birth}</span>
                      )}
                      {tmdbInfo.known_for_department && (
                        <span>Known for: {tmdbInfo.known_for_department}</span>
                      )}
                    </div>
                  </>
                )}
                {tmdbImages.length > 0 && (
                  <div className="ytm-tmdb-gallery-wrap">
                    <h4>{isPrivate ? "Photos" : "Images"}</h4>
                    <div className="ytm-tmdb-gallery">
                      {tmdbImages.slice(0, 20).map((img, i) => {
                        const src = getImageUrl(img.file_path, "original");
                        return (
                          <img
                            key={i}
                            src={src}
                            alt="scene"
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
              <p className="ytm-empty-msg">
                {isPrivate ? "No artist info found." : "No movie info found."}
              </p>
            )}
          </div>
        )}

        {/* ── Recommended albums ── */}
        {recommendations.length > 0 && (
          <div className="ytm-reco-section">
            <h3 className="ytm-reco-heading">More Like This</h3>
            <div className="ytm-reco-scroll">
              {recommendations.map((a) => (
                <YTAlbumCard
                  key={a.tmdbId}
                  album={a}
                  onClick={() => onSelectAlbum && onSelectAlbum(a)}
                />
              ))}
            </div>
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
        tracks={tracks}
        onClose={() => {
          setActiveTrack(null);
          setFullPlayerOpen(false);
        }}
        onExpand={() => setFullPlayerOpen(true)}
        onSelectTrack={(t) => setActiveTrack({ ...t, albumName: name })}
        fullPlayerOpen={fullPlayerOpen}
      />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Theme toggle: set to true for Spotify green, false for YouTube red ───
const SPOTIFY_THEME = true;

const YouTubeMusicView = () => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selLang, setSelLang] = useState("All");
  const [selCategory, setSelCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("shuffle");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build raw album list from mapper (no Spotify needed)
  const rawAlbums = useMemo(() => {
    const arr = Object.entries(movieYoutubeMapper).map(([id, data]) => ({
      tmdbId: id,
      name: data.name,
      language: data.language,
      type: data.type || "Movie",
      personID: data.personID || null,
      youtubeIDs: data.youtubeIDs || [],
      liveIDs: data.liveIDs || [],
      posterUrl: null,
      releaseDate: null,
      loading: true,
    }));
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

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

        const results = await Promise.all(
          batch.map(async (a) => {
            try {
              if (a.type === "Private" && a.personID) {
                // Fetch person profile image
                const d = await getDetails(a.personID, "person");
                return {
                  tmdbId: a.tmdbId,
                  posterUrl: d?.profile_path
                    ? getImageUrl(d.profile_path, "w500")
                    : null,
                  releaseDate: d?.birthday || null,
                };
              } else if (a.type === "Movie" && !a.tmdbId.startsWith("prv-")) {
                // Fetch movie poster
                const d = await getDetails(a.tmdbId, "movie");
                return {
                  tmdbId: a.tmdbId,
                  posterUrl: d?.poster_path
                    ? getImageUrl(d.poster_path, "w500")
                    : null,
                  releaseDate: d?.release_date || null,
                };
              }
              return { tmdbId: a.tmdbId, posterUrl: null };
            } catch {
              return { tmdbId: a.tmdbId, posterUrl: null };
            }
          }),
        );

        if (!isMounted) break;
        setAlbums((prev) =>
          prev.map((a) => {
            const hit = results.find((r) => r.tmdbId === a.tmdbId);
            return hit
              ? {
                  ...a,
                  posterUrl: hit.posterUrl,
                  releaseDate: hit.releaseDate,
                  loading: false,
                }
              : a;
          }),
        );

        if (i + BATCH < rawAlbums.length) await delay(300);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [rawAlbums]);

  const languages = useMemo(() => {
    const s = new Set(rawAlbums.map((a) => a.language).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [rawAlbums]);

  const filtered = useMemo(() => {
    let r = albums;
    if (selCategory !== "All") r = r.filter((a) => a.type === selCategory);
    if (selLang !== "All") r = r.filter((a) => a.language === selLang);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      r = r.filter((a) => a.name?.toLowerCase().includes(q));
    }
    // Apply sorting
    if (sortBy !== "shuffle") {
      r = [...r].sort((a, b) => {
        switch (sortBy) {
          case "name-asc":
            return (a.name || "").localeCompare(b.name || "");
          case "name-desc":
            return (b.name || "").localeCompare(a.name || "");
          case "release-asc":
            return (a.releaseDate || "9999").localeCompare(
              b.releaseDate || "9999",
            );
          case "release-desc":
            return (b.releaseDate || "0000").localeCompare(
              a.releaseDate || "0000",
            );
          default:
            return 0;
        }
      });
    }
    return r;
  }, [albums, selCategory, selLang, searchTerm, sortBy]);

  const handleShuffle = () => {
    const pool = filtered.length > 0 ? filtered : rawAlbums;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) setSelectedAlbum(pick);
  };

  if (selectedAlbum) {
    return (
      <YTAlbumDetail
        album={selectedAlbum}
        onBack={() => setSelectedAlbum(null)}
        allAlbums={albums}
        onSelectAlbum={setSelectedAlbum}
      />
    );
  }

  return (
    <div className={`ytm-view${SPOTIFY_THEME ? " ytm-spotify-theme" : ""}`}>
      {/* Page header */}
      <div className="ytm-page-header">
        <div className="ytm-page-header-row">
          <div className="ytm-page-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="ytm-page-title">YouTube Music</h1>
            <p className="ytm-page-sub">
              {rawAlbums.length} albums · Spotify-free player
            </p>
          </div>
          {/* Right: category pills */}
          <div className="ytm-header-right">
            <div className="ytm-category-pills">
              {["All", "Movie", "Private"].map((cat) => (
                <button
                  key={cat}
                  className={`ytm-cat-pill${selCategory === cat ? " active" : ""}`}
                  onClick={() => setSelCategory(cat)}
                >
                  {cat === "Movie"
                    ? "🎬 Movies"
                    : cat === "Private"
                      ? "🎤 Artists"
                      : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter row: search + lang pills + shuffle */}
        <div className="ytm-filter-row">
          <FilterBar
            languages={languages}
            selectedLang={selLang}
            onLang={setSelLang}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
          />
          <button
            className="ytm-shuffle-btn"
            onClick={handleShuffle}
            title="Play random album"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
            </svg>
            <span>Shuffle</span>
          </button>

          {/* Sort dropdown */}
          <div className="ytm-sort-wrap" ref={sortRef}>
            <button
              className={`ytm-sort-btn${sortBy !== "shuffle" ? " active" : ""}`}
              onClick={() => setSortOpen((p) => !p)}
              title="Sort albums"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="16" y2="12" />
                <line x1="4" y1="18" x2="12" y2="18" />
              </svg>
              <span>
                {
                  {
                    shuffle: "Sort",
                    "name-asc": "A → Z",
                    "name-desc": "Z → A",
                    "release-asc": "Oldest",
                    "release-desc": "Newest",
                  }[sortBy]
                }
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline
                  points={sortOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}
                />
              </svg>
            </button>

            {sortOpen && (
              <div className="ytm-sort-dropdown">
                {[
                  {
                    id: "shuffle",
                    label: "Shuffle",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="16 3 21 3 21 8" />
                        <line x1="4" y1="20" x2="21" y2="3" />
                        <polyline points="21 16 21 21 16 21" />
                        <line x1="15" y1="15" x2="21" y2="21" />
                      </svg>
                    ),
                  },
                  {
                    id: "name-asc",
                    label: "Name A → Z",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="4" y1="6" x2="11" y2="6" />
                        <line x1="4" y1="12" x2="11" y2="12" />
                        <line x1="4" y1="18" x2="11" y2="18" />
                        <polyline points="15 18 18 21 21 18" />
                        <line x1="18" y1="7" x2="18" y2="21" />
                      </svg>
                    ),
                  },
                  {
                    id: "name-desc",
                    label: "Name Z → A",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="4" y1="6" x2="11" y2="6" />
                        <line x1="4" y1="12" x2="11" y2="12" />
                        <line x1="4" y1="18" x2="11" y2="18" />
                        <polyline points="15 7 18 4 21 7" />
                        <line x1="18" y1="4" x2="18" y2="18" />
                      </svg>
                    ),
                  },
                  {
                    id: "release-asc",
                    label: "Oldest First",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <polyline points="14 15 17 18 20 15" />
                      </svg>
                    ),
                  },
                  {
                    id: "release-desc",
                    label: "Newest First",
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <polyline points="14 18 17 15 20 18" />
                      </svg>
                    ),
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`ytm-sort-option${sortBy === opt.id ? " active" : ""}`}
                    onClick={() => {
                      setSortBy(opt.id);
                      setSortOpen(false);
                    }}
                  >
                    <span className="ytm-sort-option-icon">{opt.icon}</span>
                    {opt.label}
                    {sortBy === opt.id && (
                      <svg
                        className="ytm-sort-check"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
