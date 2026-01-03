import React, { useState, useRef, useEffect } from 'react';
import '../../styles/YouTubeFilters.css';

const AlbumFilters = ({
    selectedType,
    setSelectedType,
    selectedLanguage,
    setSelectedLanguage,
    types,
    languages,
    onReset
}) => {
    const isFiltered = (selectedType && selectedType !== "Private") ||
        (selectedLanguage && selectedLanguage !== "English");

    return (
        <div className="filters-container">
            {types && types.length > 0 && (
                <Dropdown
                    label="Type"
                    selected={selectedType}
                    onSelect={setSelectedType}
                    options={types}
                />
            )}

            {languages && languages.length > 0 && (
                <Dropdown
                    label="Language"
                    selected={selectedLanguage}
                    onSelect={setSelectedLanguage}
                    options={languages}
                />
            )}

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

export default AlbumFilters;
