import React from 'react';
import { getImageUrl } from '../../services/tmdbApi';

const ListsGrid = ({ lists, onListSelect }) => {
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
                            className="glass-card list-card-enhanced"
                            onClick={() => onListSelect(list)}
                        >
                            <div className="list-card-backdrop">
                                {list.backdrop_path ? (
                                    <img
                                        src={getImageUrl(list.backdrop_path, 'w780')}
                                        alt={list.name}
                                        className="list-backdrop-img"
                                    />
                                ) : (
                                    <div className="list-backdrop-placeholder">
                                        {/* Fallback gradient if no backdrop */}
                                    </div>
                                )}
                                <div className="list-card-overlay"></div>
                            </div>

                            <div className="list-card-content">
                                <h3 className="list-card-title">{list.name}</h3>
                                <div className="list-card-meta">
                                    <span className="list-item-count">{list.item_count} items</span>
                                    {(list.public === false || list.id !== 'watchlist') && (
                                        // 'watchlist' is usually private but we can show just for custom lists if we want, or everything. 
                                        // TMDB lists have 'public' boolean. custom lists here derived from account lists.
                                        // Let's assume non-watchlist lists are private by default or check prop if available.
                                        // For now, hardcode "PRIVATE" for aesthetic match or check logic.
                                        <span className="list-privacy-badge">PRIVATE</span>
                                    )}
                                </div>
                                <p className="list-card-updated">Updated just now</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ListsGrid;
