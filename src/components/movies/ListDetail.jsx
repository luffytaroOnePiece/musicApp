import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../services/tmdbApi';
import Dropdown from './Dropdown';

const ListDetail = ({
    list,
    items,
    stats,
    loading,
    onBack,
    onMovieSelect,
    watchlistItems = [], // Pass watchlist down to enable filtering
    favoriteItems = [],
    ratedItems = [],
    onBatchWatchProps, // we'll need to pass these up, or handle it here if accountId is passed down
    accountId
}) => {
    // State for local filtering/sorting
    const [sortOrder, setSortOrder] = useState('Release Date'); // Matches options in Dropdown
    const [activeFilter, setActiveFilter] = useState('All');
    const [filteredItems, setFilteredItems] = useState([]);

    // Multi-Select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());

    const filters = ['All', 'Movie', 'TV', 'Watched', 'Unwatched', 'Favorite', 'Rated'];
    const sortOptions = ['Original Order', 'Top Rated', 'Release Date', 'Title (A-Z)', 'My Rating'];

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



    useEffect(() => {
        if (!items) return;

        let processed = [...items];

        // 1. Filter
        if (activeFilter !== 'All') {
            if (activeFilter === 'Movie' || activeFilter === 'TV') {
                const lowerFilter = activeFilter.toLowerCase();
                processed = processed.filter(item => item.media_type === lowerFilter);
            } else if (activeFilter === 'Watched') {
                // If the item ID exists in the watchlist items, it's considered watched
                const watchedIds = new Set(watchlistItems.map(w => w.id));
                processed = processed.filter(item => watchedIds.has(item.id));
            } else if (activeFilter === 'Unwatched') {
                const watchedIds = new Set(watchlistItems.map(w => w.id));
                processed = processed.filter(item => !watchedIds.has(item.id));
            } else if (activeFilter === 'Favorite') {
                const favIds = new Set(favoriteItems.map(f => f.id));
                processed = processed.filter(item => favIds.has(item.id));
            } else if (activeFilter === 'Rated') {
                const ratedIds = new Set(ratedItems.map(r => r.id));
                processed = processed.filter(item => ratedIds.has(item.id));
            }
        }

        // 2. Sort
        if (sortOrder === 'Top Rated') {
            processed.sort((a, b) => b.vote_average - a.vote_average);
        } else if (sortOrder === 'Release Date') {
            processed.sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
        } else if (sortOrder === 'Title (A-Z)') {
            processed.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
        } else if (sortOrder === 'My Rating') {
            // Helper to get rating from ratedItems array
            const getRating = (id) => {
                const ratedItem = ratedItems.find(r => r.id === id);
                return ratedItem ? ratedItem.rating : 0;
            };
            processed.sort((a, b) => getRating(b.id) - getRating(a.id));
        }
        // 'Original Order' = no sort

        setFilteredItems(processed);
        // Clear selection if filter/sort changes to prevent confusion
        setSelectedItemIds(new Set());
    }, [items, activeFilter, sortOrder, watchlistItems, favoriteItems, ratedItems]);

    // Selection Handlers
    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItemIds(new Set());
    };

    const handleSelectAll = () => {
        if (selectedItemIds.size === filteredItems.length) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(filteredItems.map(item => item.id)));
        }
    };

    const toggleItemSelection = (id) => {
        const newSelected = new Set(selectedItemIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItemIds(newSelected);
    };

    // Batch Actions (We emit these up to MoviesView where API exists, or handle here if we pass down API helpers)
    // To keep it clean, we'll emit to a prop if provided, else we handle it if we import the API.
    // Let's import the API helpers directly in ListDetail, but we need accountId.
    // If accountId isn't passed, we can't do batch.

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

                <div className="movies-controls-right" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {isSelectionMode ? (
                        <>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedItemIds.size} Selected</span>
                            <button className="glass-btn primary-action-btn" onClick={() => onBatchWatchProps?.(Array.from(selectedItemIds), 'watch')} disabled={selectedItemIds.size === 0} style={{ padding: '6px 12px', fontSize: '13px' }}>Mark Watched</button>
                            <button className="glass-btn primary-action-btn" onClick={() => onBatchWatchProps?.(Array.from(selectedItemIds), 'favorite')} disabled={selectedItemIds.size === 0} style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'rgba(231, 76, 60, 0.2)', borderColor: 'rgba(231, 76, 60, 0.5)', color: '#e74c3c' }}>Favorite</button>
                            <button className="filter-btn glass-btn" onClick={handleSelectAll} style={{ padding: '6px 12px', fontSize: '13px' }}>
                                {selectedItemIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button className="filter-btn glass-btn" onClick={handleToggleSelectionMode} style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.2)' }}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <button className="glass-btn primary-action-btn" onClick={handleToggleSelectionMode} style={{ padding: '6px 12px', fontSize: '13px' }}>
                                Select Items
                            </button>
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
                        </>
                    )}
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
                            const isSelected = selectedItemIds.has(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={`movie-card glass-card ${isSelectionMode && isSelected ? 'selected-card' : ''}`}
                                    onClick={() => isSelectionMode ? toggleItemSelection(item.id) : onMovieSelect(item)}
                                    style={{
                                        opacity: isSelectionMode && !isSelected ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                        transform: isSelectionMode && isSelected ? 'scale(0.98)' : 'none',
                                        border: isSelectionMode && isSelected ? '2px solid #2ecc71' : ''
                                    }}
                                >
                                    {isSelectionMode && (
                                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: isSelected ? '#2ecc71' : 'rgba(0,0,0,0.5)', border: '2px solid white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </div>
                                    )}
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
                                            {sortOrder === 'My Rating' && ratedItems.find(r => r.id === item.id) ? (
                                                <>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f1c40f" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }}>
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                    </svg>
                                                    {ratedItems.find(r => r.id === item.id).rating}/10
                                                </>
                                            ) : (
                                                <>★ {item.vote_average?.toFixed(1)}</>
                                            )}
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
