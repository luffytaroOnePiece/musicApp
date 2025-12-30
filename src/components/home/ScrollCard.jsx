import React from 'react';
import '../../styles/home/ScrollCard.css';

const ScrollCard = ({ title, subtitle, image, onClick }) => (
    <div className="scroll-card glass-card" onClick={onClick}>
        <div className="card-image">
            {image ? (
                <img src={image} alt={title} />
            ) : (
                <div className="placeholder-art">🎵</div>
            )}
        </div>
        <div className="card-info">
            <h3>{title}</h3>
            <span>{subtitle}</span>
        </div>
    </div>
);

export default ScrollCard;
