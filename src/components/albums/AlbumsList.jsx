import React from 'react';
import AlbumCard from './AlbumCard';
import '../../styles/albums/AlbumsList.css';

const AlbumsList = ({ items, onItemClick }) => {
    return (
        <div className="albums-grid">
            {items.map(([id, meta]) => (
                <AlbumCard
                    key={id}
                    meta={meta}
                    onClick={() => onItemClick(id)}
                />
            ))}
            {items.length === 0 && (
                <div className="no-albums-msg">
                    No collections found matching your filters.
                </div>
            )}
        </div>
    );
};

export default React.memo(AlbumsList);
