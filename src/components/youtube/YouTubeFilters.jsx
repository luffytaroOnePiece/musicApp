import React, { useState, useRef, useEffect } from 'react';
import '../../styles/YouTubeFilters.css';

const YouTubeFilters = ({
    selectedGenre,
    setSelectedGenre,
    selectedFormat,
    setSelectedFormat,
    selectedLanguage,
    setSelectedLanguage,
    genres,
    formats,
    languages,
    onReset,
    genreLabel = "Genre"
}) => {
    const isFiltered = selectedGenre !== "All" || selectedFormat !== "All" || selectedLanguage !== "All";

    return (
        <div className="filters-container">
            <Dropdown
                label={genreLabel}
                selected={selectedGenre}
                onSelect={setSelectedGenre}
                options={genres}
            />
            <Dropdown
                label="Language"
                selected={selectedLanguage}
                onSelect={setSelectedLanguage}
                options={languages}
            />
            <Dropdown
                label="Format"
                selected={selectedFormat}
                onSelect={setSelectedFormat}
                options={formats}
            />

            <button
                className={`yt-filter-btn yt-reset-btn ${isFiltered ? 'active' : 'disabled'}`}
                onClick={onReset}
                disabled={!isFiltered}
                title="Reset Filters"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
};

const Dropdown = ({ label, selected, onSelect, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="yt-filter-dropdown" ref={dropdownRef}>
            <button
                className="yt-filter-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Show "Label: Value" to avoid "All" vs "All" confusion */}
                <span className="yt-dropdown-label">{label}:</span>
                {selected}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`yt-arrow-icon ${isOpen ? 'open' : ''}`}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="yt-dropdown-menu">
                    {options.map((option) => (
                        <div
                            key={option}
                            className={`yt-dropdown-item ${selected === option ? "active" : ""}`}
                            onClick={() => {
                                onSelect(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                            {selected === option && <span>✓</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YouTubeFilters;
