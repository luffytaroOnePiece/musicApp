import React, { useState, useRef, useEffect } from 'react';
import '../../styles/LiveFilters.css';

const LiveFilters = ({
    selectedType,
    onSelectType,
    types,
    sortOrder,
    onSortChange,
    isShuffled,
    onShuffleToggle,
    onReset
}) => {
    return (
        <div className="live-filters-container">
            <LiveDropdown
                label="Type"
                selected={selectedType}
                onSelect={onSelectType}
                options={types}
                multiSelect={true}
            />

            <LiveDropdown
                label="Sort By"
                selected={sortOrder}
                onSelect={onSortChange}
                options={["Newest", "Oldest"]}
                multiSelect={false}
            />

            <button
                className={`live-filter-btn live-shuffle-btn ${isShuffled ? 'active' : ''}`}
                onClick={onShuffleToggle}
                title="Shuffle"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="16 3 21 3 21 8"></polyline>
                    <line x1="4" y1="20" x2="21" y2="3"></line>
                    <polyline points="21 16 21 21 16 21"></polyline>
                    <line x1="15" y1="15" x2="21" y2="21"></line>
                    <line x1="4" y1="4" x2="9" y2="9"></line>
                </svg>
            </button>

            <button
                className="live-filter-btn live-reset-btn"
                onClick={onReset}
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

const LiveDropdown = ({ label, selected, onSelect, options, multiSelect }) => {
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
        if (!multiSelect) {
            onSelect(option);
            setIsOpen(false);
            return;
        }

        // Multi-select logic for Types
        if (option === "All") {
            onSelect(["All"]);
            return;
        }

        let newSelected;
        if (selected.includes("All")) {
            newSelected = [option];
        } else {
            if (selected.includes(option)) {
                newSelected = selected.filter(item => item !== option);
            } else {
                newSelected = [...selected, option];
            }
        }

        if (newSelected.length === 0) {
            newSelected = ["All"];
        }

        onSelect(newSelected);
    };

    // Label logic
    let displayLabel = selected;
    if (multiSelect) {
        displayLabel = selected.includes("All")
            ? "All"
            : selected.length === 1
                ? selected[0]
                : `${selected.length} Selected`;
    }

    return (
        <div className="live-filter-group" ref={dropdownRef}>
            <button
                className={`live-filter-btn ${(selected !== "All" && selected !== "Newest" && selected.length !== 0 && (!Array.isArray(selected) || !selected.includes("All"))) ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ opacity: 0.5, marginRight: '2px' }}>{label}:</span>
                <span>{displayLabel}</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`live-arrow-icon ${isOpen ? 'open' : ''}`}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="live-dropdown-menu">
                    {options.map((option) => {
                        const isActive = multiSelect
                            ? selected.includes(option)
                            : selected === option;
                        return (
                            <div
                                key={option}
                                className={`live-dropdown-item ${isActive ? "active" : ""}`}
                                onClick={() => handleSelect(option)}
                            >
                                {option}
                                {isActive && <span>✓</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LiveFilters;
