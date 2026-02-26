import React from 'react';
import { getImageUrl } from '../../services/tmdbApi';

const ListsGrid = ({ lists, onListSelect }) => {
    return (
        <div className="animate-fade-in">
            <h2 className="header-title-large" style={{ padding: '8px 0 16px' }}>My Lists</h2>

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
                                    <span className="list-privacy-badge">PRIVATE</span>
                                )}
                            </div>
                            <p className="list-card-updated">Updated just now</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ListsGrid;
