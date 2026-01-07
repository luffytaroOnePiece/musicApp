import React, { useEffect, useState } from 'react';
import { getAccountDetails, getAccountLists, getListDetails, getImageUrl, getDetails, getCredits, getImages } from '../services/tmdbApi';
import '../styles/MoviesView.css';

const MoviesView = () => {
    // --- STATE ---
    // Level 1: Lists
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Level 2: List Detail
    const [selectedList, setSelectedList] = useState(null);
    const [listItems, setListItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [listStats, setListStats] = useState({
        itemCount: 0,
        averageRating: 0,
        totalRuntime: 0,
        totalRevenue: 0,
        loaded: false
    });

    // Level 3: Movie Detail
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieDetails, setMovieDetails] = useState(null);
    const [movieCredits, setMovieCredits] = useState(null);
    const [movieImages, setMovieImages] = useState(null);
    const [movieLoading, setMovieLoading] = useState(false);


    // --- EFFECTS ---

    // 1. Fetch Lists on Mount
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const accountData = await getAccountDetails();
                if (!accountData || !accountData.id) throw new Error('Failed to fetch TMDB account details.');

                const listsData = await getAccountLists(accountData.id);
                if (!listsData || !listsData.results) throw new Error('Failed to fetch lists.');
                setLists(listsData.results);
            } catch (err) {
                console.error("Error fetching lists:", err);
                setError(err.message || 'An error occurred fetching lists.');
            } finally {
                setLoading(false);
            }
        };
        fetchLists();
    }, []);

    // 2. Fetch List Items & Calculate Stats
    useEffect(() => {
        if (!selectedList) {
            setListStats({ loaded: false });
            return;
        }

        const fetchListItemsAndStats = async () => {
            setListLoading(true);
            try {
                const listData = await getListDetails(selectedList.id);
                if (listData && listData.items) {
                    setListItems(listData.items);
                    setFilteredItems(listData.items);

                    const count = listData.items.length;
                    const avgRating = count > 0
                        ? listData.items.reduce((acc, item) => acc + item.vote_average, 0) / count
                        : 0;

                    setListStats(prev => ({
                        ...prev,
                        itemCount: count,
                        averageRating: avgRating,
                        loaded: false
                    }));

                    // Deep Stats Fetching
                    let totalRuntimeMins = 0;
                    let totalRevenueUSD = 0;

                    const enrichPromises = listData.items.map(async (item) => {
                        const type = item.media_type || 'movie';
                        const details = await getDetails(item.id, type);
                        return details;
                    });

                    const enrichedItems = await Promise.all(enrichPromises);

                    enrichedItems.forEach(detail => {
                        if (detail) {
                            if (detail.runtime) totalRuntimeMins += detail.runtime;
                            if (detail.revenue) totalRevenueUSD += detail.revenue;
                        }
                    });

                    setListStats(prev => ({
                        ...prev,
                        totalRuntime: totalRuntimeMins,
                        totalRevenue: totalRevenueUSD,
                        loaded: true
                    }));

                }
            } catch (err) {
                console.error("Error fetching list details:", err);
            } finally {
                setListLoading(false);
            }
        };

        fetchListItemsAndStats();
        setActiveFilter('All');
    }, [selectedList]);


    // 3. Fetch Movie Details
    useEffect(() => {
        if (!selectedMovie) return;

        const fetchMovieDeepDetails = async () => {
            setMovieLoading(true);
            try {
                const type = selectedMovie.media_type || 'movie';
                const [details, credits, images] = await Promise.all([
                    getDetails(selectedMovie.id, type),
                    getCredits(selectedMovie.id, type),
                    getImages(selectedMovie.id, type)
                ]);

                setMovieDetails(details);
                setMovieCredits(credits);
                setMovieImages(images);
            } catch (err) {
                console.error("Error fetching movie details", err);
            } finally {
                setMovieLoading(false);
            }
        };

        fetchMovieDeepDetails();
    }, [selectedMovie]);



    // --- HELPERS ---

    const handleApplyFilter = (filter) => {
        setActiveFilter(filter);
        if (!selectedList) return;

        if (filter === 'All') {
            setFilteredItems(listItems);
        } else {
            const lowerFilter = filter.toLowerCase();
            const filtered = listItems.filter(item => item.media_type === lowerFilter);
            setFilteredItems(filtered);
        }
    };

    const handleBack = () => {
        if (selectedMovie) {
            setSelectedMovie(null);
            setMovieDetails(null);
            setMovieCredits(null);
            setMovieImages(null);
        } else if (selectedList) {
            setSelectedList(null);
            setListItems([]);
            setFilteredItems([]);
        }
    };

    const formatMoney = (amount) => {
        if (!amount) return '$0';
        if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
        if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
        return `$${amount.toLocaleString()}`;
    };

    const formatRuntime = (minutes) => {
        if (!minutes) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const filters = ['All', 'Movie', 'TV'];


    // --- RENDER ---

    if (loading) return <div className="movies-view-loading apple-loader">Loading...</div>;
    if (error) return <div className="movies-view-error">Error: {error}</div>;

    // VIEW: Movie Detail
    if (selectedMovie) {
        if (movieLoading || !movieDetails) return <div className="movies-view-loading apple-loader">Loading...</div>;

        const { title, name, overview, poster_path, backdrop_path, vote_average, release_date, first_air_date, runtime, revenue } = movieDetails;
        const displayTitle = title || name;
        const displayDate = (release_date || first_air_date || '').split('-')[0];
        const backdropUrl = getImageUrl(backdrop_path, 'original');
        const posterUrl = getImageUrl(poster_path, 'w500');

        const topCast = movieCredits?.cast?.slice(0, 6) || []; // Showing top 6
        const gallery = movieImages?.backdrops?.slice(0, 6) || [];

        return (
            <div className="movies-view-container movie-detail-view animate-fade-in">
                <div
                    className="movie-backdrop-layer"
                    style={{ backgroundImage: `url(${backdropUrl})` }}
                />

                <div className="movie-detail-content">
                    <button className="back-btn glass-btn" onClick={handleBack}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Back
                    </button>

                    <div className="movie-hero animate-slide-up">
                        <div className="poster-container">
                            <img src={posterUrl} alt={displayTitle} className="detail-poster shadow-lg" />
                        </div>
                        <div className="detail-info">
                            <h1 className="detail-title">{displayTitle}</h1>
                            <div className="detail-meta">
                                <span className="meta-year">{displayDate}</span>
                                {runtime && <span className="meta-dot">•</span>}
                                {runtime && <span className="meta-runtime">{formatRuntime(runtime)}</span>}
                            </div>

                            <div className="detail-stats-row">
                                <div className="stat-pill glass-pill">
                                    <span className="pill-label">Rating</span>
                                    <span className="pill-value rating-val">★ {vote_average?.toFixed(1)}</span>
                                </div>
                                {revenue > 0 && (
                                    <div className="stat-pill glass-pill">
                                        <span className="pill-label">Box Office</span>
                                        <span className="pill-value revenue-val">{formatMoney(revenue)}</span>
                                    </div>
                                )}
                            </div>

                            <p className="detail-overview">{overview}</p>

                            {/* Actors Section */}
                            <div className="detail-section">
                                <h3>Top Cast</h3>
                                <div className="cast-scroll-container">
                                    {topCast.map(actor => (
                                        <div key={actor.id} className="cast-card-minimal">
                                            <img
                                                src={actor.profile_path ? getImageUrl(actor.profile_path, 'w185') : 'https://via.placeholder.com/100x100?text=?'}
                                                alt={actor.name}
                                                className="cast-avatar"
                                            />
                                            <div className="cast-text">
                                                <span className="cast-name">{actor.name}</span>
                                                <span className="cast-role">{actor.character}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Images Section */}
                    {gallery.length > 0 && (
                        <div className="detail-gallery-section animate-slide-up delay-2">
                            <h3>Gallery</h3>
                            <div className="gallery-masonry">
                                {gallery.map((img, idx) => (
                                    <div key={idx} className="gallery-item">
                                        <img
                                            src={getImageUrl(img.file_path, 'w780')}
                                            alt="Gallery"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // VIEW: List Detail
    if (selectedList) {
        return (
            <div className="movies-view-container animate-fade-in">
                <div className="movies-header detail-header sticky-header glass-header">
                    <div className="header-left">
                        <button className="back-btn icon-only" onClick={handleBack}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <div>
                            <h2 className="header-title">{selectedList.name}</h2>
                            <p className="header-subtitle">{listStats.itemCount} items</p>
                        </div>
                    </div>
                    <div className="movies-filters">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                className={`filter-btn glass-btn ${activeFilter === filter ? 'active' : ''}`}
                                onClick={() => handleApplyFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="content-scroll-area">
                    {/* Stats Bar */}
                    <div className="list-stats-bar glass-panel animate-slide-down">
                        <div className="stat-item">
                            <span className="stat-label">Items</span>
                            <span className="stat-value">{listStats.itemCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Rating</span>
                            <span className="stat-value rating-text">{listStats.averageRating?.toFixed(1)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Time</span>
                            <span className="stat-value">{listStats.loaded ? formatRuntime(listStats.totalRuntime) : '...'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Revenue</span>
                            <span className="stat-value revenue-text">{listStats.loaded ? formatMoney(listStats.totalRevenue) : '...'}</span>
                        </div>
                    </div>

                    {listLoading ? (
                        <div className="movies-view-loading apple-loader">Loading...</div>
                    ) : (
                        <div className="movies-grid animate-stagger-children">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className="movie-card glass-card"
                                    onClick={() => setSelectedMovie(item)}
                                >
                                    <div className="movie-poster-wrapper">
                                        {item.poster_path ? (
                                            <img
                                                src={getImageUrl(item.poster_path, 'w500')}
                                                alt={item.title || item.name}
                                                className="movie-poster"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="no-poster"><span>No Image</span></div>
                                        )}
                                        <div className="rating-badge glass-badge">
                                            ★ {item.vote_average?.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="movie-info">
                                        <h3 className="movie-title">{item.title || item.name}</h3>
                                        <div className="movie-meta">
                                            <span>{(item.release_date || item.first_air_date || '').split('-')[0]}</span>
                                            {item.media_type && <span>• {item.media_type === 'tv' ? 'TV' : 'Movie'}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="no-items-found">No items found.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // VIEW: Lists Grid (Level 1)
    return (
        <div className="movies-view-container animate-fade-in">
            <div className="movies-header glass-header sticky-header">
                <h2 className="header-title-large">My Lists</h2>
            </div>

            <div className="content-scroll-area">
                <div className="movies-grid list-grid animate-stagger-children">
                    {lists.map(list => (
                        <div
                            key={list.id}
                            className="list-card glass-card"
                            onClick={() => setSelectedList(list)}
                        >
                            <div className="list-poster-wrapper">
                                {/* Try to make a collage or just one nicely */}
                                {list.poster_path || list.backdrop_path ? (
                                    <img
                                        src={getImageUrl(list.poster_path || list.backdrop_path, 'w500')}
                                        alt={list.name}
                                        className="movie-poster"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="no-poster">
                                        <span className="no-poster-text">{list.item_count}</span>
                                        <span className="no-poster-sub">Items</span>
                                    </div>
                                )}
                                <div className="list-count-badge glass-badge">
                                    {list.item_count} Items
                                </div>
                            </div>
                            <div className="movie-info">
                                <h3 className="movie-title">{list.name}</h3>
                                <p className="movie-date text-truncate">{list.description || 'Collection'}</p>
                            </div>
                        </div>
                    ))}
                    {lists.length === 0 && <div className="no-items-found">No lists found.</div>}
                </div>
            </div>
        </div>
    );
};

export default MoviesView;
