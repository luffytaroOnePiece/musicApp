import React, { useEffect, useState } from 'react';
import FPProgress from './FPProgress';
import FPControls from './FPControls';
import { extractColors } from '../../utils/colorUtils';
import '../../styles/FullPlayer.css'; // Ensure we have the vibe styles

const FPVibeLayout = ({
    currentTrack,
    artistNames,
    albumImage,
    position,
    duration,
    handleSeek,
    formatTime,
    player,
    paused,
    queueComponent,
    devicesComponent,
    onNext,
    onPrev,
    onTogglePlay,
    onToggleVibe,
    isVibeMode,
    colors // Optional: pass in colors if already extracted in parent
}) => {
    const [bgColors, setBgColors] = useState(colors || ['#121212', '#000000']);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        if (!colors && albumImage) {
            extractColors(albumImage).then(extracted => {
                setBgColors(extracted);
            });
        } else if (colors) {
            setBgColors(colors);
        }
    }, [albumImage, colors]);

    // Create a dynamic gradient string
    const gradientStyle = {
        background: `linear-gradient(135deg, ${bgColors[0]} 0%, ${bgColors[1] || bgColors[0]} 50%, ${bgColors[2] || bgColors[0]} 100%)`,
        backgroundSize: '400% 400%',
        animation: 'vibeGradient 15s ease infinite'
    };

    return (
        <div
            className="fp-vibe-container"
            style={gradientStyle}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onClick={() => setShowControls(prev => !prev)}
        >
            <div className={`fp-vibe-content ${showControls ? 'controls-visible' : ''}`}>

                <div className="fp-vibe-art-container">
                    <img
                        src={albumImage}
                        alt="Album Art"
                        className="fp-vibe-art"
                    />
                </div>

                <div className="fp-vibe-details">
                    <h1 className="fp-vibe-title">{currentTrack.name}</h1>
                    <p className="fp-vibe-artist">{artistNames}</p>
                </div>

                {/* Controls fade in/out based on interaction */}
                <div
                    className={`fp-vibe-controls-wrapper ${showControls ? 'visible' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <FPProgress
                        position={position}
                        duration={duration}
                        handleSeek={handleSeek}
                        formatTime={formatTime}
                    />

                    <FPControls
                        player={player}
                        paused={paused}
                        queueComponent={queueComponent}
                        devicesComponent={devicesComponent}
                        onNext={onNext}
                        onPrev={onPrev}
                        onTogglePlay={onTogglePlay}
                        onToggleVibe={onToggleVibe}
                        isVibeMode={isVibeMode}
                    />
                </div>
            </div>

            {/* Visualizer effect or ambient overlay could go here */}
            <div className="fp-vibe-overlay"></div>
        </div>
    );
};

export default FPVibeLayout;
