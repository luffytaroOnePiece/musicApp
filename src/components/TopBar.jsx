import React from "react";
import "../styles/TopBar.css";
import { logout } from "../services/auth";

const TopBar = ({
  searchTerm,
  setSearchTerm,
  performSearch,
  onShowAlbums,
}) => {
  return (
    <div className="top-bar-controls top-bar-container-flex sidebar-closed">
      {/* Search Bar */}
      <div className="search-container search-container-flex">
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
            placeholder="Search albums..."
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
        <button onClick={logout} className="logout-btn-top" title="Logout">
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
