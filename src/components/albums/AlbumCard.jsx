import React from 'react';
import '../../styles/albums/AlbumCard.css';

const AlbumCard = ({ meta, onClick }) => {
    return (
        <div className="album-card" onClick={onClick}>
            <img
                src={meta.images?.[0]?.url || 'https://via.placeholder.com/300'}
                alt={meta.name}
                className="album-cover"
                loading="lazy"
            />
            <div className="album-info">
                <h3>{meta.spotifyName || meta.name}</h3>
                {meta.release_date && (
                    <p>{meta.release_date.split('-')[0]}</p>
                )}
            </div>
        </div>
    );
};

export default React.memo(AlbumCard);
