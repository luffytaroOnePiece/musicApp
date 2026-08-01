import React from "react";
import "../styles/Sidebar.css";

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeModule,
  onModuleSelect,
}) => {
  const modules = [
    {
      id: "albums",
      name: "Albums",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
    },
  ];

  return (
    <div className={`sidebar ${!isSidebarOpen ? "hidden" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-container">
          <h2 className="sidebar-header-title">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="sidebar-toggle-btn"
            title="Hide Menu"
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
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <ul className="playlist-list">
        {modules.map((module) => (
          <li
            key={module.id}
            onClick={() => onModuleSelect(module.id)}
            className={`sidebar-module-item ${activeModule === module.id ? "active" : ""}`}
          >
            {module.icon}
            <span>{module.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
