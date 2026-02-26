import React, { useMemo, useState } from 'react';
import { getImageUrl } from '../../services/tmdbApi';
import '../../styles/movies/PlaylistAnalytics.css';

const MEDIA_COLORS = { movie: '#3b82f6', tv: '#a78bfa' };
const DECADE_COLORS = ['#e74c3c', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];
const LANG_COLORS = ['#3b82f6', '#a78bfa', '#f59e0b', '#34d399', '#e74c3c', '#f472b6', '#6366f1', '#fb923c'];
const RATING_BAR_COLORS = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#fbbf24', '#fbbf24', '#22c55e', '#22c55e', '#3b82f6', '#3b82f6'];

const LANGUAGE_NAMES = {
    en: 'EN', hi: 'HI', te: 'TE', ta: 'TA', ml: 'ML', kn: 'KN', ko: 'KO',
    ja: 'JA', es: 'ES', fr: 'FR', de: 'DE', it: 'IT', pt: 'PT', zh: 'ZH',
    ru: 'RU', ar: 'AR', tr: 'TR', th: 'TH', sv: 'SV', pl: 'PL', nl: 'NL',
    da: 'DA', no: 'NO', fi: 'FI', cs: 'CS', bn: 'BN', mr: 'MR', pa: 'PA',
};

const PlaylistAnalyticsDashboard = ({ items, stats }) => {
    const totalItems = items.length;

    // ── Stat Tiles ──────────────────────────────────────────────────────
    const movieCount = useMemo(() => items.filter(i => (i.media_type || 'movie') === 'movie').length, [items]);
    const tvCount = useMemo(() => items.filter(i => i.media_type === 'tv').length, [items]);

    const avgRating = useMemo(() => {
        const rated = items.filter(i => i.vote_average > 0);
        if (!rated.length) return 0;
        return rated.reduce((s, i) => s + i.vote_average, 0) / rated.length;
    }, [items]);

    const highestRated = useMemo(() => {
        if (!items.length) return null;
        return items.reduce((best, i) => (i.vote_average || 0) > (best.vote_average || 0) ? i : best, items[0]);
    }, [items]);

    const newestYear = useMemo(() => {
        let newest = null;
        items.forEach(i => {
            const d = i.release_date || i.first_air_date;
            if (d) {
                const y = parseInt(d.split('-')[0]);
                if (!newest || y > newest) newest = y;
            }
        });
        return newest;
    }, [items]);

    const oldestYear = useMemo(() => {
        let oldest = null;
        items.forEach(i => {
            const d = i.release_date || i.first_air_date;
            if (d) {
                const y = parseInt(d.split('-')[0]);
                if (!oldest || y < oldest) oldest = y;
            }
        });
        return oldest;
    }, [items]);

    // ── Media Type Donut ────────────────────────────────────────────────
    const mediaData = useMemo(() => {
        const m = items.filter(i => (i.media_type || 'movie') === 'movie').length;
        const t = items.filter(i => i.media_type === 'tv').length;
        const result = [];
        if (m > 0) result.push({ type: 'movie', label: 'Movies', count: m, color: MEDIA_COLORS.movie });
        if (t > 0) result.push({ type: 'tv', label: 'TV Shows', count: t, color: MEDIA_COLORS.tv });
        return result;
    }, [items]);

    // ── Rating Distribution ─────────────────────────────────────────────
    const ratingHistogram = useMemo(() => {
        const buckets = Array.from({ length: 10 }, (_, i) => ({
            label: `${i + 1}`,
            min: i,
            max: i + 1,
            count: 0,
        }));
        items.forEach(i => {
            if (!i.vote_average || i.vote_average <= 0) return;
            const idx = Math.min(Math.floor(i.vote_average) - 1, 9);
            if (idx >= 0) buckets[idx].count++;
        });
        return buckets;
    }, [items]);

    const maxRatingBucket = useMemo(() => Math.max(...ratingHistogram.map(b => b.count), 1), [ratingHistogram]);

    // ── Decade Distribution ─────────────────────────────────────────────
    const decadeData = useMemo(() => {
        const counts = {};
        items.forEach(i => {
            const d = i.release_date || i.first_air_date;
            if (!d) return;
            const decade = Math.floor(parseInt(d.split('-')[0]) / 10) * 10;
            counts[decade] = (counts[decade] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([decade, count]) => ({ decade: `${decade}s`, count }))
            .sort((a, b) => b.decade.localeCompare(a.decade)); // newest first
    }, [items]);

    const maxDecadeCount = useMemo(() => Math.max(...decadeData.map(d => d.count), 1), [decadeData]);

    // ── Language Distribution ───────────────────────────────────────────
    const langData = useMemo(() => {
        const counts = {};
        items.forEach(i => {
            const lang = i.original_language || 'unknown';
            counts[lang] = (counts[lang] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([lang, count]) => ({ lang, label: LANGUAGE_NAMES[lang] || lang.toUpperCase(), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8); // top 8 languages
    }, [items]);

    const maxLangCount = useMemo(() => Math.max(...langData.map(l => l.count), 1), [langData]);

    // ── Top 5 Rated (multi-tab) ─────────────────────────────────────────
    const TOP5_TABS = useMemo(() => [
        { key: 'overall', label: 'Overall', filter: () => true },
        { key: 'movies', label: 'Movies', filter: i => (i.media_type || 'movie') === 'movie' },
        { key: 'tv', label: 'TV Shows', filter: i => i.media_type === 'tv' },
        { key: 'highest', label: 'Highest Rated', sort: 'rating' },
        { key: 'popular', label: 'Most Popular', sort: 'popularity' },
    ], []);

    const [selectedTab, setSelectedTab] = useState('overall');

    const visibleTabs = useMemo(() =>
        TOP5_TABS.filter(tab => {
            if (tab.sort) return items.some(i => (tab.sort === 'rating' ? i.vote_average : i.popularity) > 0);
            return items.some(i => tab.filter(i) && i.vote_average > 0);
        })
        , [items, TOP5_TABS]);

    const top5Filtered = useMemo(() => {
        const tab = TOP5_TABS.find(t => t.key === selectedTab) || TOP5_TABS[0];
        let filtered = [...items];
        if (tab.filter) filtered = filtered.filter(tab.filter);
        if (tab.sort === 'popularity') {
            filtered = filtered.filter(i => i.popularity > 0).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        } else {
            filtered = filtered.filter(i => i.vote_average > 0).sort((a, b) => b.vote_average - a.vote_average);
        }
        return filtered.slice(0, 5);
    }, [items, selectedTab, TOP5_TABS]);

    const maxTop5Score = useMemo(() => {
        if (!top5Filtered.length) return 1;
        const tab = TOP5_TABS.find(t => t.key === selectedTab) || TOP5_TABS[0];
        if (tab.sort === 'popularity') return top5Filtered[0].popularity || 1;
        return top5Filtered[0].vote_average || 1;
    }, [top5Filtered, selectedTab, TOP5_TABS]);

    if (!items.length) return null;

    // ── Donut math ──────────────────────────────────────────────────────
    const RADIUS = 40;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    let donutOffset = 0;

    const formatRuntime = (minutes) => {
        if (!minutes) return '0m';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const formatMoney = (amount) => {
        if (!amount) return '$0';
        if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
        if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
        return `$${amount.toLocaleString()}`;
    };

    return (
        <div className="playlist-analytics-inner">
            {/* ── Stat Tiles ── */}
            <div className="pl-stat-row">
                <div className="pl-stat-card">
                    <div className="pl-stat-label">Total Items</div>
                    <div className="pl-stat-value">{totalItems}</div>
                    <div className="pl-stat-sub">{movieCount} movies · {tvCount} TV</div>
                </div>
                <div className="pl-stat-card">
                    <div className="pl-stat-label">Avg Rating</div>
                    <div className="pl-stat-value">{avgRating.toFixed(1)}</div>
                    <div className="pl-stat-sub">out of 10</div>
                </div>
                <div className="pl-stat-card">
                    <div className="pl-stat-label">Total Runtime</div>
                    <div className="pl-stat-value" style={{ fontSize: 20 }}>
                        {stats.loaded ? formatRuntime(stats.totalRuntime) : '...'}
                    </div>
                    <div className="pl-stat-sub">combined watch time</div>
                </div>
                <div className="pl-stat-card">
                    <div className="pl-stat-label">Box Office</div>
                    <div className="pl-stat-value" style={{ fontSize: 20 }}>
                        {stats.loaded ? formatMoney(stats.totalRevenue) : '...'}
                    </div>
                    <div className="pl-stat-sub">total revenue</div>
                </div>
                <div className="pl-stat-card">
                    <div className="pl-stat-label">Highest Rated</div>
                    <div className="pl-stat-value" style={{ fontSize: 15 }}>
                        {highestRated ? (highestRated.title || highestRated.name) : '—'}
                    </div>
                    <div className="pl-stat-sub">
                        {highestRated?.vote_average ? `★ ${highestRated.vote_average.toFixed(1)}` : ''}
                    </div>
                </div>
                <div className="pl-stat-card">
                    <div className="pl-stat-label">Year Range</div>
                    <div className="pl-stat-value" style={{ fontSize: 20 }}>
                        {oldestYear && newestYear ? `${oldestYear}–${newestYear}` : '—'}
                    </div>
                    <div className="pl-stat-sub">
                        {oldestYear && newestYear ? `${newestYear - oldestYear} year span` : ''}
                    </div>
                </div>
            </div>

            {/* ── Charts ── */}
            <div className="pl-charts-grid">

                {/* Media Type Donut */}
                <div className="pl-chart-card">
                    <div className="pl-chart-title">
                        <svg className="pl-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a10 10 0 0 1 0 20" />
                        </svg>
                        Media Type
                    </div>
                    <div className="pl-donut-container">
                        <svg className="pl-donut-svg" viewBox="0 0 100 100">
                            {mediaData.map((item) => {
                                const fraction = item.count / totalItems;
                                const dashLen = fraction * CIRCUMFERENCE;
                                const gap = CIRCUMFERENCE - dashLen;
                                const offset = donutOffset;
                                donutOffset += dashLen;
                                return (
                                    <circle
                                        key={item.type}
                                        className="pl-donut-segment"
                                        cx="50" cy="50" r={RADIUS}
                                        stroke={item.color}
                                        strokeDasharray={`${dashLen} ${gap}`}
                                        strokeDashoffset={-offset}
                                    />
                                );
                            })}
                            <text
                                x="50" y="50"
                                textAnchor="middle" dominantBaseline="central"
                                fill="#fff" fontSize="16" fontWeight="800"
                                style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
                            >
                                {totalItems}
                            </text>
                        </svg>
                        <div className="pl-donut-legend">
                            {mediaData.map(item => (
                                <div key={item.type} className="pl-donut-legend-item">
                                    <span className="pl-legend-dot" style={{ background: item.color }} />
                                    {item.label}
                                    <span className="pl-legend-count">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="pl-chart-card">
                    <div className="pl-chart-title">
                        <svg className="pl-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Rating Distribution
                    </div>
                    <div className="pl-rating-histogram">
                        {ratingHistogram.map((bucket, i) => (
                            <div key={bucket.label} className="pl-rating-bar-group">
                                {bucket.count > 0 && (
                                    <span className="pl-rating-bar-count">{bucket.count}</span>
                                )}
                                <div
                                    className="pl-rating-bar"
                                    style={{
                                        height: `${(bucket.count / maxRatingBucket) * 70}px`,
                                        background: RATING_BAR_COLORS[i],
                                        opacity: bucket.count > 0 ? 1 : 0.15,
                                    }}
                                    title={`Rating ${bucket.label}: ${bucket.count} items`}
                                />
                                <span className="pl-rating-bar-label">{bucket.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decade Distribution */}
                <div className="pl-chart-card">
                    <div className="pl-chart-title">
                        <svg className="pl-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        By Decade
                    </div>
                    <div className="pl-decade-bars">
                        {decadeData.map((d, i) => (
                            <div key={d.decade} className="pl-decade-row">
                                <span className="pl-decade-label">{d.decade}</span>
                                <div className="pl-decade-track">
                                    <div
                                        className="pl-decade-fill"
                                        style={{
                                            width: `${(d.count / maxDecadeCount) * 100}%`,
                                            background: DECADE_COLORS[i % DECADE_COLORS.length],
                                        }}
                                    />
                                </div>
                                <span className="pl-decade-count">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Language Distribution */}
                <div className="pl-chart-card">
                    <div className="pl-chart-title">
                        <svg className="pl-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Top Languages
                    </div>
                    <div className="pl-lang-bars">
                        {langData.map((l, i) => (
                            <div key={l.lang} className="pl-lang-row">
                                <span className="pl-lang-label">{l.label}</span>
                                <div className="pl-lang-track">
                                    <div
                                        className="pl-lang-fill"
                                        style={{
                                            width: `${(l.count / maxLangCount) * 100}%`,
                                            background: LANG_COLORS[i % LANG_COLORS.length],
                                        }}
                                    />
                                </div>
                                <span className="pl-lang-count">{l.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top 5 — Tabbed (full-width) */}
            {visibleTabs.length > 0 && (
                <div className="pl-chart-card" style={{ marginBottom: 8 }}>
                    <div className="pl-chart-title">
                        <svg className="pl-chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Top 5
                    </div>

                    <div className="pl-top5-tabs">
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.key}
                                className={`pl-top5-tab-btn${selectedTab === tab.key ? ' active' : ''}`}
                                onClick={() => setSelectedTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="pl-top5-list">
                        {top5Filtered.length > 0 ? top5Filtered.map((item, i) => {
                            const tab = TOP5_TABS.find(t => t.key === selectedTab) || TOP5_TABS[0];
                            const score = tab.sort === 'popularity' ? item.popularity : item.vote_average;
                            return (
                                <div key={item.id} className="pl-top5-item">
                                    <span className="pl-top5-rank">{i + 1}</span>
                                    {item.poster_path ? (
                                        <img
                                            src={getImageUrl(item.poster_path, 'w185')}
                                            alt={item.title || item.name}
                                            className="pl-top5-poster"
                                        />
                                    ) : (
                                        <div className="pl-top5-poster-placeholder">🎬</div>
                                    )}
                                    <div className="pl-top5-info">
                                        <div className="pl-top5-title">{item.title || item.name}</div>
                                        <div className="pl-top5-bar-track">
                                            <div
                                                className="pl-top5-bar-fill"
                                                style={{ width: `${(score / maxTop5Score) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="pl-top5-score">★ {score.toFixed(1)}</span>
                                </div>
                            );
                        }) : (
                            <div style={{ color: '#52525b', fontSize: 13, padding: '8px 0' }}>No items in this category</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaylistAnalyticsDashboard;
