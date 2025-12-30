import React from 'react';
import '../../styles/home/HeroSection.css';

const HeroSection = ({ title, items, onItemClick }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="hero-wrapper">
            {title && (
                <div className="section-header" style={{ maxWidth: '1200px', margin: '0 auto 20px auto', padding: '0 10px' }}>
                    <h2>{title}</h2>
                </div>
            )}
            <div className="hero-section-grid">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`hero-card glass-card ${index === 0 ? 'hero-main' : 'hero-secondary'}`}
                        style={{ '--hero-bg': `url(${item.images[0]?.url})` }}
                        onClick={() => onItemClick({ ...item, type: 'album' })}
                    >
                        <div className="hero-bg-overlay"></div>
                        <div className="hero-content">
                            <span className="hero-label">NEW RELEASE</span>
                            <h2>{item.name}</h2>
                            <p>{item.artists[0].name}</p>
                        </div>
                        <div className="hero-image">
                            <img src={item.images[0]?.url} alt={item.name} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroSection;
