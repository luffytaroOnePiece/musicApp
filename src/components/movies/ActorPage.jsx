import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { getImageUrl, getDetails, getImages, getPersonCredits, getExternalIds } from '../../services/tmdbApi';
import '../../styles/movies/ActorPage.css';

const EXTERNAL_IMAGES_GIST = 'https://gist.githubusercontent.com/luffytaroOnePiece/88364f756d48eeb36a21e6542dc32c61/raw/info.json';

const ActorPage = ({ actor, onBack, onMovieClick }) => {
    const [details, setDetails] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxImg, setLightboxImg] = useState(null);
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [socials, setSocials] = useState(null);

    // Close lightbox on Escape key
    useEffect(() => {
        if (!lightboxImg) return;
        const handler = (e) => { if (e.key === 'Escape') setLightboxImg(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxImg]);

    const openLightbox = useCallback((src, idx) => {
        setLightboxImg(src);
        setLightboxIdx(idx);
    }, []);

    const navigateLightbox = useCallback((dir) => {
        setLightboxIdx(prev => {
            const next = prev + dir;
            if (next < 0 || next >= photos.length) return prev;
            const img = photos[next];
            setLightboxImg(img.url || getImageUrl(img.file_path, 'original'));
            return next;
        });
    }, [photos]);

    useEffect(() => {
        const fetchAll = async () => {
            if (!actor?.id) return;
            setLoading(true);
            try {
                const [detailsData, imagesData, creditsData, externalIds] = await Promise.all([
                    getDetails(actor.id, 'person'),
                    getImages(actor.id, 'person'),
                    getPersonCredits(actor.id),
                    getExternalIds(actor.id)
                ]);
                setDetails(detailsData);
                setSocials(externalIds);

                // ── Merge TMDB profiles + external (Reddit) images ──────────────
                let finalPhotos = imagesData?.profiles || [];
                try {
                    const extResp = await fetch(EXTERNAL_IMAGES_GIST);
                    if (extResp.ok) {
                        const extData = await extResp.json();
                        const personKey = String(actor.id);
                        if (extData[personKey]) {
                            finalPhotos = [...finalPhotos, ...extData[personKey]];
                        }
                    }
                } catch (extErr) {
                    console.warn('Failed to fetch external actor images:', extErr);
                }
                // Shuffle combined list
                for (let i = finalPhotos.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [finalPhotos[i], finalPhotos[j]] = [finalPhotos[j], finalPhotos[i]];
                }
                setPhotos(finalPhotos);
                // ────────────────────────────────────────────────────────────────

                const allCredits = [
                    ...(creditsData?.cast || []),
                    ...(creditsData?.crew || [])
                ];
                const seen = new Set();
                const unique = allCredits.filter(item => {
                    const key = `${item.id}-${item.media_type}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                const sorted = unique
                    .filter(item => item.poster_path || item.popularity > 1)
                    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                    .slice(0, 30);
                setCredits(sorted);
            } catch (err) {
                console.error('Failed to load actor page:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [actor]);

    const profileUrl = actor?.profile_path
        ? getImageUrl(actor.profile_path, 'w500')
        : null;

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getYear = (item) => {
        const date = item.release_date || item.first_air_date;
        return date ? date.split('-')[0] : null;
    };

    return (
        <div className="actor-page-overlay custom-scrollbar">
            {/* Back Button */}
            <button className="actor-page-back-btn" onClick={onBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                </svg>
                Back
            </button>

            {/* Enhanced Lightbox with prev/next navigation */}
            {lightboxImg && ReactDOM.createPortal(
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.95)',
                        backdropFilter: 'blur(24px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={() => setLightboxImg(null)}
                >
                    {/* Prev arrow */}
                    {lightboxIdx > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                            className="lightbox-nav-btn lightbox-prev"
                        >‹</button>
                    )}
                    <img
                        src={lightboxImg}
                        alt="Full view"
                        style={{
                            maxWidth: '88vw', maxHeight: '90vh',
                            borderRadius: '14px',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
                            objectFit: 'contain'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    {/* Next arrow */}
                    {lightboxIdx < photos.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                            className="lightbox-nav-btn lightbox-next"
                        >›</button>
                    )}
                    {/* Counter */}
                    <div className="lightbox-counter">
                        {lightboxIdx + 1} / {photos.length}
                    </div>
                    <button
                        onClick={() => setLightboxImg(null)}
                        style={{
                            position: 'absolute', top: 24, right: 24,
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            color: '#fff', width: 44, height: 44, borderRadius: '50%',
                            fontSize: 24, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(10px)'
                        }}
                    >×</button>
                </div>,
                document.body
            )}

            {loading ? (
                <div className="actor-page-loader">
                    <div className="actor-page-spinner" />
                    <p>Loading Actor Profile...</p>
                </div>
            ) : (
                <>
                    {/* ===== HERO ===== */}
                    <div className="actor-page-hero">
                        {profileUrl && (
                            <div
                                className="actor-page-blurred-bg"
                                style={{ backgroundImage: `url(${profileUrl})` }}
                            />
                        )}
                        <div className="actor-page-hero-gradient" />

                        <div className="actor-page-hero-content">
                            {profileUrl ? (
                                <img
                                    src={profileUrl}
                                    alt={actor.name}
                                    className="actor-page-portrait"
                                    onClick={() => setLightboxImg(getImageUrl(actor.profile_path, 'original'))}
                                    style={{ cursor: 'zoom-in' }}
                                />
                            ) : (
                                <div className="actor-page-portrait-placeholder">
                                    <span>🎬</span>
                                    <small>No Photo</small>
                                </div>
                            )}

                            <div className="actor-page-meta">
                                {details?.known_for_department && (
                                    <div className="actor-page-known-for-dept">
                                        {details.known_for_department}
                                    </div>
                                )}
                                <h1 className="actor-page-name">{actor.name}</h1>

                                <div className="actor-page-info-pills">
                                    {actor.character && (
                                        <div className="actor-info-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            as {actor.character}
                                        </div>
                                    )}
                                    {details?.birthday && (
                                        <div className="actor-info-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {formatDate(details.birthday)}
                                        </div>
                                    )}
                                    {details?.place_of_birth && (
                                        <div className="actor-info-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                            {details.place_of_birth}
                                        </div>
                                    )}
                                    {details?.deathday && (
                                        <div className="actor-info-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            Died: {formatDate(details.deathday)}
                                        </div>
                                    )}
                                    {photos.length > 0 && (
                                        <div className="actor-info-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            {photos.length} Photos
                                        </div>
                                    )}
                                    {credits.length > 0 && (
                                        <div className="actor-info-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="23 7 16 12 23 17 23 7" />
                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                            </svg>
                                            {credits.length}+ Credits
                                        </div>
                                    )}
                                </div>

                                {/* Social Media Links */}
                                {socials && (
                                    <div className="actor-social-links">
                                        {socials.instagram_id && (
                                            <a href={`https://instagram.com/${socials.instagram_id}`} target="_blank" rel="noopener noreferrer" className="actor-social-pill" title="Instagram">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                                <span>{socials.instagram_id}</span>
                                            </a>
                                        )}
                                        {socials.twitter_id && (
                                            <a href={`https://x.com/${socials.twitter_id}`} target="_blank" rel="noopener noreferrer" className="actor-social-pill" title="X (Twitter)">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                                <span>@{socials.twitter_id}</span>
                                            </a>
                                        )}
                                        {socials.facebook_id && (
                                            <a href={`https://facebook.com/${socials.facebook_id}`} target="_blank" rel="noopener noreferrer" className="actor-social-pill" title="Facebook">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                                <span>Facebook</span>
                                            </a>
                                        )}
                                        {socials.tiktok_id && (
                                            <a href={`https://tiktok.com/@${socials.tiktok_id}`} target="_blank" rel="noopener noreferrer" className="actor-social-pill" title="TikTok">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                                                <span>@{socials.tiktok_id}</span>
                                            </a>
                                        )}
                                        {socials.youtube_id && (
                                            <a href={`https://youtube.com/${socials.youtube_id}`} target="_blank" rel="noopener noreferrer" className="actor-social-pill" title="YouTube">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                                <span>YouTube</span>
                                            </a>
                                        )}
                                        {socials.imdb_id && (
                                            <a href={`https://imdb.com/name/${socials.imdb_id}`} target="_blank" rel="noopener noreferrer" className="actor-social-pill imdb" title="IMDb">
                                                <svg width="20" height="14" viewBox="0 0 64 32" fill="currentColor"><path d="M0 0h8v32H0zm13.6 0H22l3.2 12.8L28.4 0H37v32h-6V10.4L27 32h-4.8L18.2 10.4V32h-4.6zm27.2 0H52c2.4 0 4.2.6 5.4 1.8 1.2 1.2 1.8 3 1.8 5.4v17.6c0 2.4-.6 4.2-1.8 5.4-1.2 1.2-3 1.8-5.4 1.8h-11.2zm6.8 6v20h3.2c.8 0 1.2-.4 1.2-1.2V7.2c0-.8-.4-1.2-1.2-1.2z" /></svg>
                                                <span>IMDb</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== PAGE CONTENT ===== */}
                    <div className="actor-page-content">

                        {/* Biography */}
                        {(details?.biography) && (
                            <div className="actor-page-section">
                                <h2 className="actor-page-section-title">Biography</h2>
                                <p className="actor-page-bio">
                                    {details.biography || 'No biography available.'}
                                </p>
                            </div>
                        )}

                        {/* Photo Gallery */}
                        {photos.length > 0 && (
                            <div className="actor-page-section">
                                <h2 className="actor-page-section-title">
                                    Photos
                                    <span style={{ fontSize: '14px', color: '#52525b', fontWeight: 400, marginLeft: 4 }}>
                                        ({photos.length})
                                    </span>
                                </h2>
                                <div className="actor-page-photos-grid">
                                    {photos.map((photo, idx) => {
                                        const thumbSrc = photo.url || getImageUrl(photo.file_path, 'w780');
                                        const fullSrc = photo.url || getImageUrl(photo.file_path, 'original');
                                        return (
                                            <div
                                                key={idx}
                                                className="actor-page-photo-item"
                                                onClick={() => openLightbox(fullSrc, idx)}
                                            >
                                                <img
                                                    src={thumbSrc}
                                                    alt={`${actor.name} photo ${idx + 1}`}
                                                    loading="lazy"
                                                />
                                                <div className="actor-photo-overlay">
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Filmography */}
                        {credits.length > 0 && (
                            <div className="actor-page-section">
                                <h2 className="actor-page-section-title">Known For</h2>
                                <div className="actor-filmography-grid">
                                    {credits.map((item) => (
                                        <div
                                            key={`${item.id}-${item.media_type}`}
                                            className="actor-film-card"
                                            onClick={() => onMovieClick && onMovieClick(item)}
                                            title={item.title || item.name}
                                        >
                                            <div className="actor-film-poster-wrapper">
                                                {item.poster_path ? (
                                                    <img
                                                        src={getImageUrl(item.poster_path, 'w342')}
                                                        alt={item.title || item.name}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="actor-film-no-poster">🎬</div>
                                                )}
                                                {item.vote_average > 0 && (
                                                    <div className="actor-film-rating-badge">
                                                        ★ {item.vote_average.toFixed(1)}
                                                    </div>
                                                )}
                                                <div className="actor-film-media-badge">
                                                    {item.media_type === 'tv' ? 'TV' : 'Film'}
                                                </div>
                                            </div>
                                            <div className="actor-film-info">
                                                <div className="actor-film-title">
                                                    {item.title || item.name}
                                                </div>
                                                {getYear(item) && (
                                                    <div className="actor-film-year">{getYear(item)}</div>
                                                )}
                                                {item.character && (
                                                    <div className="actor-film-character">
                                                        as {item.character}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ActorPage;
