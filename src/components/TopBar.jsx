import React, { useState } from "react";
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
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  return (
    <div
      className={`top-bar-controls ${
        isSidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Center - Search Bar (Expanded to Left) */}
      <div
        className="search-container"
        style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}
      >
        <div style={{ position: "relative", width: "90%" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.5)",
            }}
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
            style={{
              width: "90%",
              padding: "10px 12px 10px 40px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "25px",
              color: "white",
              fontSize: "0.95rem",
              outline: "none",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s",
            }}
            onFocus={(e) =>
              (e.target.style.background = "rgba(255,255,255,0.15)")
            }
            onBlur={(e) =>
              (e.target.style.background = "rgba(255,255,255,0.1)")
            }
          />
        </div>
      </div>

      {/* Right Section - Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          marginLeft: "20px",
        }}
      >
        <button
          onClick={goHome}
          className="home-btn-top"
          title="Go Home"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            padding: "8px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 500,
            fontSize: "0.9rem",
            transition: "all 0.2s",
            backdropFilter: "blur(10px)",
          }}
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
            {themes.find((t) => t.id === currentTheme)?.name}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                marginLeft: "8px",
                transform: themeMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {themeMenuOpen && (
            <div className="theme-dropdown-menu">
              {themes.map((t) => (
                <div
                  key={t.id}
                  className={`theme-dropdown-item ${
                    currentTheme === t.id ? "active" : ""
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
          Logout
        </button>
      </div>
    </div>
  );
};

export default TopBar;
