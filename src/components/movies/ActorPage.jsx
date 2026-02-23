import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getImageUrl, getDetails, getImages, getPersonCredits } from '../../services/tmdbApi';
import '../../styles/movies/ActorPage.css';

const ActorPage = ({ actor, onBack, onMovieClick }) => {
    const [details, setDetails] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxImg, setLightboxImg] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            if (!actor?.id) return;
            setLoading(true);
            try {
                const [detailsData, imagesData, creditsData] = await Promise.all([
                    getDetails(actor.id, 'person'),
                    getImages(actor.id, 'person'),
                    getPersonCredits(actor.id)
                ]);
                setDetails(detailsData);
                setPhotos(imagesData?.profiles || []);
                // Combine cast + crew, deduplicate by id, sort by popularity desc, take top 30
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

            {/* Lightbox */}
            {lightboxImg && ReactDOM.createPortal(
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.92)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out', animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={() => setLightboxImg(null)}
                >
                    <img
                        src={lightboxImg}
                        alt="Full view"
                        style={{
                            maxWidth: '90vw', maxHeight: '92vh',
                            borderRadius: '12px',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.8)'
                        }}
                    />
                    <button
                        onClick={() => setLightboxImg(null)}
                        style={{
                            position: 'absolute', top: 24, right: 24,
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            color: '#fff', width: 40, height: 40, borderRadius: '50%',
                            fontSize: 22, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                                    {photos.map((photo, idx) => (
                                        <div
                                            key={idx}
                                            className="actor-page-photo-item"
                                            onClick={() => setLightboxImg(getImageUrl(photo.file_path, 'original'))}
                                        >
                                            <img
                                                src={getImageUrl(photo.file_path, 'w342')}
                                                alt={`${actor.name} photo ${idx + 1}`}
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
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
