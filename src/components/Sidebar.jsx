import React from 'react';
import "../styles/Sidebar.css";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, activeModule, onModuleSelect }) => {

    const modules = [
        { id: 'home', name: 'Home', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
        { id: 'youtube', name: 'YouTube', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg> },
        { id: 'zen', name: 'Zen Mode', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg> }
    ];

    return (
        <div className={`sidebar ${!isSidebarOpen ? 'hidden' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#b3b3b3', margin: 0 }}>Menu</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="sidebar-toggle-btn" title="Hide Menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                </div>
            </div>
            <ul className="playlist-list">
                {modules.map(module => (
                    <li
                        key={module.id}
                        onClick={() => onModuleSelect(module.id)}
                        className={activeModule === module.id ? 'active' : ''}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
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
