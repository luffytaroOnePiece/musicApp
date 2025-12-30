import React from 'react';
import '../../styles/home/ArtistCircle.css';

const ArtistCircle = ({ artist, onClick }) => (
    <div className="artist-circle-card" onClick={onClick}>
        <div className="artist-image">
            <img src={artist.images[0]?.url} alt={artist.name} />
        </div>
        <p>{artist.name}</p>
    </div>
);

export default ArtistCircle;
