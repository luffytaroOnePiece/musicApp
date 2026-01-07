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
                            className="list-card glass-card"
                            onClick={() => onListSelect(list)}
                        >
                            <div className="list-poster-wrapper">
                                {/* Try to make a collage or just one nicely */}
                                <div className="no-poster">
                                    <span className="no-poster-text">{list.item_count}</span>
                                    <span className="no-poster-sub">ITEMS</span>
                                </div>
                                <div className="list-count-badge glass-badge">
                                    {list.list_type === 'movie' ? 'MOVIES' : 'TV SHOWS'}
                                </div>
                            </div>
                            <div className="movie-info">
                                <h3 className="movie-title">{list.name}</h3>
                                <p className="movie-meta">{list.description || 'No description'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ListsGrid;
