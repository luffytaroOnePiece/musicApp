import React from 'react';
import '../../styles/FPProgress.css';

const FPProgress = ({ position, duration, handleSeek, formatTime }) => {
    return (
        <div className="fp-progress-container">
            <span className="time-text">{formatTime(position)}</span>
            <input
                type="range"
                min="0"
                max={duration / 1000}
                value={position / 1000}
                onChange={handleSeek}
                className="progress-slider fp-slider"
                style={{ '--progress': `${duration ? (position / duration * 100) : 0}%` }}
            />
            <span className="time-text">{formatTime(duration)}</span>
        </div>
    );
};

export default FPProgress;
