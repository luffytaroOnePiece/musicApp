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
    genreLabel = "Genre",
    useListForGenres = false,
    sortOrder,
    onSortChange
}) => {
    // Check if filtered: genres array > 1 or not generic "All", others not "All"
    // Since we init with ["All"], check if it includes "All" only or has others
    const isGenreFiltered = selectedGenre && (!selectedGenre.includes("All") || selectedGenre.length > 1);
    const isFormatFiltered = selectedFormat && selectedFormat !== "All";
    const isLanguageFiltered = selectedLanguage && selectedLanguage !== "All";

    const isFiltered = isGenreFiltered || isFormatFiltered || isLanguageFiltered;

    return (
        <div className="filters-container">
            {genres && (
                useListForGenres ? (
                    <Dropdown
                        label={genreLabel}
                        selected={selectedGenre}
                        onSelect={setSelectedGenre}
                        options={genres}
                    />
                ) : (
                    <GenreGridDropdown
                        label={genreLabel}
                        selected={selectedGenre}
                        onSelect={setSelectedGenre}
                        options={genres}
                    />
                )
            )}
            {languages && languages.length > 0 && (
                <Dropdown
                    label="Language"
                    selected={selectedLanguage}
                    onSelect={setSelectedLanguage}
                    options={languages}
                />
            )}
            {formats && formats.length > 0 && (
                <Dropdown
                    label="Format"
                    selected={selectedFormat}
                    onSelect={setSelectedFormat}
                    options={formats}
                />
            )}

            {sortOrder && onSortChange && (
                <Dropdown
                    label="Sort By"
                    selected={sortOrder}
                    onSelect={onSortChange}
                    options={["Newest", "Oldest"]}
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

const GenreGridDropdown = ({ label, selected, onSelect, options }) => {
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

    const handleSelect = (option) => {
        if (option === "All") {
            onSelect(["All"]);
            return;
        }

        let newSelected;
        if (selected.includes("All")) {
            // switching from All to specific
            newSelected = [option];
        } else {
            if (selected.includes(option)) {
                newSelected = selected.filter(item => item !== option);
            } else {
                newSelected = [...selected, option];
            }
        }

        // If nothing selected, revert to All
        if (newSelected.length === 0) {
            newSelected = ["All"];
        }

        onSelect(newSelected);
    };

    // Label logic
    const displayLabel = selected.includes("All")
        ? "All"
        : selected.length === 1
            ? selected[0]
            : `${selected.length} Selected`;

    return (
        <div className="yt-filter-dropdown" ref={dropdownRef}>
            <button
                className="yt-filter-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="yt-dropdown-label">{label}:</span>
                {displayLabel}
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
                <div className="yt-dropdown-menu yt-genre-grid-menu">
                    <div className="yt-genre-grid">
                        {options.map((option) => {
                            const isActive = selected.includes(option);
                            return (
                                <div
                                    key={option}
                                    className={`yt-grid-item ${isActive ? "active" : ""}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
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
