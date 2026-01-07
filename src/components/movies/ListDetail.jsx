import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../services/tmdbApi';
import Dropdown from './Dropdown';

const ListDetail = ({
    list,
    items,
    stats,
    loading,
    onBack,
    onMovieSelect
}) => {
    // State for local filtering/sorting
    const [sortOrder, setSortOrder] = useState('Original Order'); // Matches options in Dropdown
    const [activeFilter, setActiveFilter] = useState('All');
    const [filteredItems, setFilteredItems] = useState([]);

    // Watched State
    const [watchedItems, setWatchedItems] = useState(() => {
        const saved = localStorage.getItem('watched_movies');
        return saved ? JSON.parse(saved) : {};
    });

    const filters = ['All', 'Movie', 'TV'];
    const sortOptions = ['Original Order', 'Top Rated', 'Release Date', 'Title (A-Z)'];

    // Helper formats
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

    const toggleWatched = (e, id) => {
        e.stopPropagation();
        setWatchedItems(prev => {
            const next = { ...prev, [id]: !prev[id] };
            localStorage.setItem('watched_movies', JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        if (!items) return;

        let processed = [...items];

        // 1. Filter
        if (activeFilter !== 'All') {
            const lowerFilter = activeFilter.toLowerCase();
            processed = processed.filter(item => item.media_type === lowerFilter);
        }

        // 2. Sort
        if (sortOrder === 'Top Rated') {
            processed.sort((a, b) => b.vote_average - a.vote_average);
        } else if (sortOrder === 'Release Date') {
            processed.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
        } else if (sortOrder === 'Title (A-Z)') {
            processed.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
        }
        // 'Original Order' = no sort

        setFilteredItems(processed);
    }, [items, activeFilter, sortOrder]);


    return (
        <div className="movies-view-container animate-fade-in">
            <div className="movies-header detail-header sticky-header glass-header">
                <div className="header-left">
                    <button className="back-btn icon-only" onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <h2 className="header-title">{list.name}</h2>
                        <p className="header-subtitle">{stats.itemCount} items</p>
                    </div>
                </div>

                <div className="movies-controls-right" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Enhanced Dropdown */}
                    <Dropdown
                        label="Sort"
                        selected={sortOrder}
                        onSelect={setSortOrder}
                        options={sortOptions}
                    />

                    <div className="movies-filters">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                className={`filter-btn glass-btn ${activeFilter === filter ? 'active' : ''}`}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="content-scroll-area">
                {/* Stats Bar */}
                <div className="list-stats-bar glass-panel animate-slide-down">
                    <div className="stat-item">
                        <span className="stat-label">Items</span>
                        <span className="stat-value">{stats.itemCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Rating</span>
                        <span className="stat-value rating-text">{(stats.averageRating * 10).toFixed(0)}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Total Time</span>
                        <span className="stat-value">{stats.loaded ? formatRuntime(stats.totalRuntime) : '...'}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value revenue-text">{stats.loaded ? formatMoney(stats.totalRevenue) : '...'}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="movies-view-loading apple-loader">Loading...</div>
                ) : (
                    <div className="movies-grid animate-stagger-children">
                        {filteredItems.map(item => {
                            const isWatched = watchedItems[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className={`movie-card glass-card ${isWatched ? 'watched' : ''}`}
                                    onClick={() => onMovieSelect(item)}
                                    style={isWatched ? { opacity: 0.6, filter: 'grayscale(0.5)' } : {}}
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

                                        {/* Watched Toggle Button */}
                                        <button
                                            className="watched-btn glass-btn icon-only"
                                            onClick={(e) => toggleWatched(e, item.id)}
                                            title={isWatched ? "Mark Unwatched" : "Mark Watched"}
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                left: '10px',
                                                width: '32px',
                                                height: '32px',
                                                padding: '0',
                                                background: isWatched ? 'rgba(48, 209, 88, 0.8)' : 'rgba(0,0,0,0.5)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#fff',
                                                zIndex: 5
                                            }}
                                        >
                                            {isWatched ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="movie-info">
                                        <h3 className="movie-title">{item.title || item.name}</h3>
                                        <div className="movie-meta">
                                            <span>{(item.release_date || item.first_air_date || '').split('-')[0]}</span>
                                            {item.media_type && <span>• {item.media_type === 'tv' ? 'TV' : 'Movie'}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <div className="no-items-found">No items found.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListDetail;
