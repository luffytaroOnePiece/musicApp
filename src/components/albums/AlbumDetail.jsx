import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPlaylist } from '../../services/spotifyApi';
import { searchMulti, getDetails, getImages, getImageUrl } from '../../services/tmdbApi';
import othersData from '../../data/others.json';
import AlbumCard from "./AlbumCard";
import privateAlbums from '../../data/privateAlbums.json';
import movieAlbums from '../../data/movieAlbums.json';
import '../../styles/albums/AlbumDetail.css';

// Sub-components
import AlbumHeader from './AlbumHeader';
// NewsSection removed
import AlbumTracks from './AlbumTracks';

const AlbumDetail = ({
    fullItemData,
    localData,
    itemsMetadata,
    onBack,
    onPlay,
    onPlayContext,
    onShuffleContext,
    onAlbumClick,
    formatTime
}) => {
    const [viewMode, setViewMode] = useState("original"); // 'original' | 'live' | 'others' | 'info' | 'news'
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("Original");
    const [playingVideo, setPlayingVideo] = useState(null);


    // TMDB State
    const [tmdbInfo, setTmdbInfo] = useState(null);
    const [tmdbImages, setTmdbImages] = useState([]);
    const [loadingTmdb, setLoadingTmdb] = useState(false);

    // Lightbox State
    const [selectedImage, setSelectedImage] = useState(null);

    const openLightbox = (imgUrl) => {
        setSelectedImage(imgUrl);
    };

    const closeLightbox = () => {
        setSelectedImage(null);
    };

    // Basic Metadata
    const tracks = fullItemData.tracks.items;
    const albumOthers = othersData[fullItemData.id];

    // Stats
    const totalDurationMs = tracks.reduce((acc, curr) => acc + (curr.track?.duration_ms || 0), 0);
    const formattedTotalDuration = formatTime(totalDurationMs);
    const releaseYear = fullItemData.release_date?.split('-')[0];

    // -- Fetch TMDB Data --
    useEffect(() => {
        const fetchTmdbData = async () => {
            if (!fullItemData.name) return;

            setLoadingTmdb(true);
            try {
                // Priority 1: Check if personID exists in localData (Private/Artist Albums)
                if (localData?.personID) {
                    // personID format example: "77948-selena-gomez" -> extract "77948"
                    const personIdRaw = localData.personID.split('-')[0];
                    if (personIdRaw) {
                        const type = 'person';
                        const details = await getDetails(personIdRaw, type);
                        const images = await getImages(personIdRaw, type);

                        setTmdbInfo(details);
                        if (images) {
                            // Person images usually have 'profiles'
                            const allImages = images.profiles || [];
                            setTmdbImages(allImages);
                        }
                        return;
                    }
                }

                // Priority 2: Check if tmdbID exists in localData (Movie Albums)
                if (localData?.tmdbID) {
                    // Assume 'movie' as default for now, or check localData.type
                    // Since the user said "Movie Albums", prioritizing movie.
                    const type = 'movie';
                    const details = await getDetails(localData.tmdbID, type);
                    const images = await getImages(localData.tmdbID, type);

                    setTmdbInfo(details);
                    if (images) {
                        const allImages = [...(images.backdrops || []), ...(images.posters || [])];
                        setTmdbImages(allImages);
                    }
                    return; // Exit if ID was found and used
                }

                // Priority 2: Search by Name
                // Heuristic: remove "Soundtrack", "OST", "(Original Motion Picture Soundtrack)" etc. 
                const query = fullItemData.name.replace(/\(.*\)/g, '').trim();

                const searchRes = await searchMulti(query);

                if (searchRes && searchRes.results && searchRes.results.length > 0) {
                    // Prioritize Movie and TV
                    const match = searchRes.results.find(r => r.media_type === 'movie' || r.media_type === 'tv');

                    if (match) {
                        const details = await getDetails(match.id, match.media_type);
                        const images = await getImages(match.id, match.media_type);

                        setTmdbInfo(details);
                        if (images) {
                            // Combine backdrops and posters
                            const allImages = [...(images.backdrops || []), ...(images.posters || [])];
                            setTmdbImages(allImages);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch TMDB data", err);
            } finally {
                setLoadingTmdb(false);
            }
        };

        fetchTmdbData();
    }, [fullItemData.name, localData]);


    // "More by Artist"
    // IMPROVED: For playlists, artists array might be empty or generic. Try to get from first track.
    const currentArtistName = useMemo(() => {
        // Force "Srikar" for local collections to show "More by Srikar"
        if (localData && (localData.type === 'Private' || localData.type === 'Movie')) {
            return "Srikar";
        }

        if (fullItemData.artists && fullItemData.artists.length > 0 && fullItemData.artists[0].name !== "Spotify") {
            return fullItemData.artists[0].name;
        }
        // Fallback: Check first track
        if (fullItemData.tracks?.items?.[0]?.track?.artists?.[0]?.name) {
            return fullItemData.tracks.items[0].track.artists[0].name;
        }
        return localData.name;
    }, [fullItemData, localData]);

    const moreByArtist = useMemo(() => {
        if (!currentArtistName) return [];
        const allAlbums = { ...movieAlbums, ...privateAlbums };

        // Special Case: "Srikar" -> Show 10 random albums matching Type & Language
        if (currentArtistName.toLowerCase().includes("srikar")) {
            const targetType = localData?.type;
            const targetLang = localData?.language;

            const filteredEntries = Object.entries(allAlbums).filter(([id, meta]) => {
                if (id === fullItemData.id) return false;
                // Filter by Type if exists
                if (targetType && meta.type !== targetType) return false;
                // Filter by Language if exists
                if (targetLang && meta.language !== targetLang) return false;
                return true;
            });

            // Shuffle
            for (let i = filteredEntries.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredEntries[i], filteredEntries[j]] = [filteredEntries[j], filteredEntries[i]];
            }
            return filteredEntries.slice(0, 10);
        }

        return Object.entries(allAlbums)
            .filter(([id, meta]) => id !== fullItemData.id && meta.name === currentArtistName)
            .slice(0, 10);
    }, [currentArtistName, fullItemData.id]);


    // -- Filter/Sort Logic for Tracks --
    const getFilteredTracks = useCallback(() => {
        let filtered = tracks.filter(item => {
            if (!localSearchTerm) return true;
            return item.track.name.toLowerCase().includes(localSearchTerm.toLowerCase());
        });

        if (sortOrder === "Title") {
            filtered.sort((a, b) => a.track.name.localeCompare(b.track.name));
        } else if (sortOrder === "Duration") {
            filtered.sort((a, b) => b.track.duration_ms - a.track.duration_ms);
        } else if (sortOrder === "Date Added") {
            filtered.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
        }
        // Original/Date Published - effectively original order for now or needs more data
        return filtered;
    }, [tracks, localSearchTerm, sortOrder]);

    const visibleTracks = getFilteredTracks();


    const handleVideoClick = useCallback((id, title) => {
        setPlayingVideo({ id, title });
    }, []);

    const closePlayer = useCallback(() => {
        setPlayingVideo(null);
    }, []);

    // -- Fetch Images for "More by Artist" --
    const [enrichedMoreByArtist, setEnrichedMoreByArtist] = useState([]);

    useEffect(() => {
        let mounted = true;
        if (moreByArtist.length === 0) {
            setEnrichedMoreByArtist([]);
            return;
        }

        const fetchImages = async () => {
            const promises = moreByArtist.map(async ([id, meta]) => {
                // If we already have images images (unlikely for local), use them
                if (meta.images) return [id, meta];

                try {
                    // Start with placeholder to avoid flicker if API is slow
                    // But we want the real image
                    const data = await getPlaylist(id);
                    if (data && mounted) {
                        return [id, { ...meta, images: data.images }];
                    }
                } catch (e) {
                    console.warn("Failed to fetch image for", id, e);
                }
                return [id, meta];
            });

            const results = await Promise.all(promises);
            if (mounted) setEnrichedMoreByArtist(results);
        };

        fetchImages();

        return () => { mounted = false; };
    }, [moreByArtist]);

    return (
        <div className="albums-view-container detail-mode">
            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div className="lightbox-modal-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close-btn" onClick={closeLightbox}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={selectedImage} alt="Full view" className="lightbox-image" />
                    </div>
                </div>
            )}

            {/* Embedded Player Modal */}
            {playingVideo && (
                <div className="live-player-modal-overlay" onClick={closePlayer}>
                    <div className="live-player-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="live-player-close-btn" onClick={closePlayer}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div className="live-player-wrapper">
                            <iframe
                                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&rel=0`}
                                title={playingVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="live-player-iframe"
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            <AlbumHeader
                fullItemData={fullItemData}
                localData={localData}
                tracksCount={tracks.length}
                totalDuration={formattedTotalDuration}
                releaseYear={releaseYear}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onPlayContext={onPlayContext}
                onShuffleContext={onShuffleContext}
                onBack={onBack}
                hasOthers={albumOthers && albumOthers.length > 0}
            />

            {viewMode === 'info' ? (
                <div className="tmdb-info-section">
                    {loadingTmdb ? (
                        <div className="loading-spinner">Loading Info...</div>
                    ) : tmdbInfo ? (
                        <div className="tmdb-content">
                            <div className="tmdb-overview">
                                <h3>{tmdbInfo.title || tmdbInfo.name}</h3>
                                {tmdbInfo.biography ? (
                                    /* Person Details */
                                    <>
                                        <p className="tmdb-plot">{tmdbInfo.biography}</p>

                                        <div className="tmdb-person-details">
                                            {tmdbInfo.birthday && (
                                                <div className="person-detail-item">
                                                    <h5>Birthday</h5>
                                                    <p>
                                                        {new Date(tmdbInfo.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        {' '}
                                                        ({new Date().getFullYear() - new Date(tmdbInfo.birthday).getFullYear() - (new Date() < new Date(new Date().getFullYear(), new Date(tmdbInfo.birthday).getMonth(), new Date(tmdbInfo.birthday).getDate()) ? 1 : 0)} years old)
                                                    </p>
                                                </div>
                                            )}

                                            {tmdbInfo.place_of_birth && (
                                                <div className="person-detail-item">
                                                    <h5>Place of Birth</h5>
                                                    <p>{tmdbInfo.place_of_birth}</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* Movie/TV Details */
                                    <>
                                        <p className="tmdb-tagline">{tmdbInfo.tagline}</p>
                                        <p className="tmdb-plot">{tmdbInfo.overview}</p>
                                        <div className="tmdb-meta">
                                            {tmdbInfo.release_date && <span>Release: {tmdbInfo.release_date}</span>}
                                            {tmdbInfo.first_air_date && <span>First Air: {tmdbInfo.first_air_date}</span>}
                                            {tmdbInfo.vote_average && <span>Rating: {tmdbInfo.vote_average.toFixed(1)}/10</span>}
                                        </div>
                                    </>
                                )}
                            </div>

                            {tmdbImages.length > 0 && (
                                <div className="tmdb-images-gallery">
                                    <h4>Images</h4>
                                    <div className="tmdb-images-scroll">
                                        {tmdbImages.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={getImageUrl(img.file_path, 'original')}
                                                alt="Scene"
                                                className="tmdb-gallery-img"
                                                loading="lazy"
                                                onClick={() => openLightbox(getImageUrl(img.file_path, 'original'))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-info-found">
                            <p>No information found for "{fullItemData.name}"</p>
                        </div>
                    )}
                </div>
            ) : (
                <AlbumTracks
                    viewMode={viewMode}
                    albumOthers={albumOthers}
                    visibleTracks={visibleTracks}
                    tracks={tracks}
                    localData={localData}
                    handleVideoClick={handleVideoClick}
                    onPlay={onPlay}
                    localSearchTerm={localSearchTerm}
                    setLocalSearchTerm={setLocalSearchTerm}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                />
            )}

            {enrichedMoreByArtist.length > 0 && viewMode !== 'info' && (
                <div className="more-by-artist-section">
                    <h2>More by {currentArtistName}</h2>
                    <div className="albums-grid">
                        {enrichedMoreByArtist.map(([id, meta]) => (
                            <AlbumCard
                                key={id}
                                meta={meta}
                                onClick={() => onAlbumClick(id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlbumDetail;
