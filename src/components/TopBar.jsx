import React, { useState, useEffect } from "react";
import "../styles/TopBar.css";
import { logout } from "../services/auth";

const TopBar = ({
    currentTheme,
    setCurrentTheme,
    themes,
    isSidebarOpen,
    setIsSidebarOpen,
    goHome,
    searchTerm,
    setSearchTerm,
    performSearch,
    onShowYoutube,
    onShowZenMode,
}) => {
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);

    return (
        <div
            className={`top-bar-controls top-bar-container-flex ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"
                }`}
        >
            {/* Center - Search Bar (Expanded to Left) */}
            <div
                className="search-container search-container-flex"
            >
                <div className="search-wrapper-relative">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="search-icon-absolute"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search for playlist or songs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                performSearch();
                            }
                        }}
                        className="search-input-field"
                    />
                </div>
            </div>

            {/* Right Section - Controls */}
            <div className="right-controls-flex">
                {/* Zen Mode Button */}
                <button
                    onClick={onShowZenMode}
                    className="zen-mode-btn-top topbar-nav-btn"
                    title="Enter Zen Mode"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="accent-green"
                    >
                        <path d="M2 12h5l3 5 5-11 4 8 3-2" />
                    </svg>
                    Zen Mode
                </button>

                {/* YouTube Library Button */}
                <button
                    onClick={onShowYoutube}
                    className="youtube-btn-top topbar-nav-btn"
                    title="YouTube Library"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="red"
                        stroke="currentColor"
                        strokeWidth="0"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"></polygon>
                    </svg>
                    YouTube
                </button>

                <button
                    onClick={goHome}
                    className="home-btn-top topbar-nav-btn"
                    title="Go Home"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    Home
                </button>

                {/* Custom Dropdown for Modern Look */}
                <div
                    className="custom-theme-dropdown"
                    onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                >
                    <button className="theme-btn-trigger">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                        </svg>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`theme-arrow-icon ${themeMenuOpen ? "rotate-180" : "rotate-0"}`}
                        >
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>

                    {themeMenuOpen && (
                        <div className="theme-dropdown-menu">
                            {themes.map((t) => (
                                <div
                                    key={t.id}
                                    className={`theme-dropdown-item ${currentTheme === t.id ? "active" : ""
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentTheme(t.id);
                                        setThemeMenuOpen(false);
                                    }}
                                >
                                    {t.name}
                                    {currentTheme === t.id && <span className="check">✓</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={logout} className="logout-btn-top">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default TopBar;
