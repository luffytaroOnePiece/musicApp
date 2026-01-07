import React, { useState, useRef, useEffect } from 'react';
import '../../styles/YouTubeFilters.css'; // Reusing existing beautiful styles

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
                style={{ background: 'rgba(255,255,255,0.1)' }}
            >
                <span className="yt-dropdown-label">{label}:</span>
                <span style={{ color: '#fff' }}>{selected}</span>
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

export default Dropdown;
