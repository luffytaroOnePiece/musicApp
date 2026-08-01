import React, { useState, useRef, useEffect } from 'react';
import '../../styles/AlbumFilters.css';

const AlbumFilters = ({
    selectedType,
    setSelectedType,
    selectedSort,
    setSelectedSort,
    selectedLanguage,
    setSelectedLanguage,
    types,
    languages,
    onReset
}) => {
    const isFiltered = (selectedType && selectedType !== "All") ||
        (selectedLanguage && selectedLanguage !== "All") || (selectedSort && selectedSort !== "Default");

    const sortOptions = ["Default", "Date (Newest)", "Date (Oldest)"];

    return (
        <div className="album-filters-bar">
            {/* Filter chips row */}
            <div className="filter-chips-row">
                {types && types.length > 0 && (
                    <FilterChipDropdown
                        label="Type"
                        selected={selectedType}
                        onSelect={setSelectedType}
                        options={types}
                    />
                )}

                {languages && languages.length > 0 && (
                    <FilterChipDropdown
                        label="Language"
                        selected={selectedLanguage}
                        onSelect={setSelectedLanguage}
                        options={languages}
                    />
                )}

                <FilterChipDropdown
                    label="Sort"
                    selected={selectedSort}
                    onSelect={setSelectedSort}
                    options={sortOptions}
                />

                {isFiltered && (
                    <button
                        className="filter-clear-btn"
                        onClick={onReset}
                        title="Clear all filters"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

const FilterChipDropdown = ({ label, selected, onSelect, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isActive = selected && selected !== "All" && selected !== "Default";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="filter-chip-dropdown" ref={dropdownRef}>
            <button
                className={`filter-chip ${isActive ? 'filter-chip--active' : ''} ${isOpen ? 'filter-chip--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="filter-chip-label">{label}</span>
                <span className="filter-chip-value">{selected}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`filter-chip-arrow ${isOpen ? 'open' : ''}`}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="filter-dropdown-menu">
                    {options.map((option) => (
                        <button
                            key={option}
                            className={`filter-dropdown-item ${selected === option ? "filter-dropdown-item--active" : ""}`}
                            onClick={() => {
                                onSelect(option);
                                setIsOpen(false);
                            }}
                        >
                            <span>{option}</span>
                            {selected === option && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlbumFilters;
