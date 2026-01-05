import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/albums/AlbumDetail.css';

const NewsSection = ({ artistName }) => {
    const [newsData, setNewsData] = useState([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [newsSort, setNewsSort] = useState("Top"); // 'Top' | 'New' | 'Relevance'
    const [selectedNewsItem, setSelectedNewsItem] = useState(null); // For Modal

    // --- News Fetch Logic ---
    useEffect(() => {
        if (!artistName) return;

        setLoadingNews(true);


        // Construct Sort Param
        let sortParam = "relevance";
        let timeParam = "year"; // Default to year for 'Top'

        if (newsSort === 'Top') {
            sortParam = 'top';
            timeParam = 'year';
        } else if (newsSort === 'New') {
            sortParam = 'new';
            timeParam = 'all';
        } else {
            sortParam = 'relevance';
            timeParam = 'all';
        }

        // Fetch from Reddit RSS via rss2json (Bypasses detailed API blocking)
        const rssUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(artistName)}&sort=${sortParam}&t=${timeParam}&limit=50`;
        const converterUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        fetch(converterUrl)
            .then(res => {
                if (!res.ok) throw new Error(`RSS Error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data || !data.items) {
                    setNewsData([]);
                    return;
                }

                const posts = data.items
                    .filter(item => {
                        // Filter for items that likely have images
                        const hasEnclosure = item.enclosure && item.enclosure.link && item.enclosure.type.startsWith('image/');
                        const hasThumbnail = item.thumbnail && item.thumbnail.startsWith('http');
                        // Simple content check for image tag if needed, but risky. Stick to reliable fields.
                        return hasEnclosure || hasThumbnail;
                    })
                    .map(item => ({
                        id: item.guid,
                        title: item.title,
                        imageUrl: (item.enclosure && item.enclosure.link) ? item.enclosure.link : item.thumbnail,
                        permalink: item.link,
                        author: item.author,
                        subreddit: "reddit" // RSS doesn't always give subreddit clearly in root, acceptable trade-off
                    }));
                setNewsData(posts);
            })
            .catch(err => {
                console.error("Failed to fetch news", err);
                setNewsData([]);
            })
            .finally(() => setLoadingNews(false));
    }, [artistName, newsSort]);

    const closeNewsModal = useCallback(() => {
        setSelectedNewsItem(null);
    }, []);

    // Dropdown Component (Internal to NewsSection for now, or could be shared)
    const DetailDropdown = ({ label, selected, onSelect, options }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);

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
                    style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
                >
                    <span className="yt-dropdown-label" style={{ marginRight: 6 }}>{label}:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selected}</span>
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
                        style={{ marginLeft: 6 }}
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                {isOpen && (
                    <div className="yt-dropdown-menu" style={{ minWidth: 160, right: 0, left: 'auto' }}>
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

    return (
        <div className="news-section-wrapper">
            <div className="album-controls-bar" style={{ justifyContent: 'flex-end', paddingBottom: 10 }}>
                <div className="sort-dropdown">
                    <DetailDropdown
                        label="Sort News"
                        selected={newsSort}
                        onSelect={setNewsSort}
                        options={['Top', 'New', 'Relevance']}
                    />
                </div>
            </div>

            <div className="news-container">
                {loadingNews ? (
                    <div className="news-loading">Loading latest news from Reddit...</div>
                ) : (
                    <div className="news-grid">
                        {newsData.map(item => (
                            <div
                                key={item.id}
                                className="news-card"
                                onClick={() => setSelectedNewsItem(item)}
                            >
                                <img src={item.imageUrl} alt={item.title} loading="lazy" />
                                <div className="news-caption">{item.title}</div>
                            </div>
                        ))}
                        {newsData.length === 0 && (
                            <div className="no-news-msg">No images found for this artist.</div>
                        )}
                    </div>
                )}
            </div>

            {/* News Item Modal */}
            {selectedNewsItem && (
                <div className="live-player-modal-overlay" onClick={closeNewsModal}>
                    <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="live-player-close-btn" onClick={closeNewsModal}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={selectedNewsItem.imageUrl} alt={selectedNewsItem.title} className="news-modal-image" />
                        <div className="news-modal-info">
                            <h2>{selectedNewsItem.title}</h2>
                            <p>Posted by u/{selectedNewsItem.author} in {selectedNewsItem.subreddit}</p>
                            <a href={selectedNewsItem.permalink} target="_blank" rel="noreferrer" className="news-modal-link">Open on Reddit</a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsSection;
