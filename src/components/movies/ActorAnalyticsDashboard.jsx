import React, { useMemo, useState } from 'react';
import { getImageUrl } from '../../services/tmdbApi';
import '../../styles/movies/ActorAnalytics.css';

const GENDER_LABELS = { 1: 'Female', 2: 'Male', 3: 'Non-Binary' };
const GENDER_COLORS = { 1: '#f472b6', 2: '#60a5fa', 3: '#a78bfa', 0: '#52525b' };
const DEPT_COLORS = ['#e74c3c', '#f59e0b', '#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
const CATEGORY_COLORS = ['#e74c3c', '#60a5fa', '#a78bfa', '#34d399', '#f59e0b', '#fb923c'];

const calcAge = (birthday) => {
    if (!birthday) return null;
    const diff = Date.now() - new Date(birthday).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const ActorAnalyticsDashboard = ({ actors }) => {
    // ── Stat Tiles ──────────────────────────────────────────────────────
    const totalActors = actors.length;

    const avgPopularity = useMemo(() => {
        const valid = actors.filter(a => a.popularity > 0);
        if (!valid.length) return 0;
        return valid.reduce((s, a) => s + a.popularity, 0) / valid.length;
    }, [actors]);

    const avgAge = useMemo(() => {
        const ages = actors.map(a => calcAge(a.birthday)).filter(a => a !== null);
        if (!ages.length) return null;
        return Math.round(ages.reduce((s, a) => s + a, 0) / ages.length);
    }, [actors]);

    const mostPopular = useMemo(() => {
        if (!actors.length) return null;
        return actors.reduce((best, a) => (a.popularity || 0) > (best.popularity || 0) ? a : best, actors[0]);
    }, [actors]);

    // ── Gender Donut ────────────────────────────────────────────────────
    const genderData = useMemo(() => {
        const counts = {};
        actors.forEach(a => {
            const g = a.gender || 0;
            counts[g] = (counts[g] || 0) + 1;
        });
        return Object.entries(counts)
            .filter(([g]) => g !== '0')
            .map(([g, count]) => ({
                gender: Number(g),
                label: GENDER_LABELS[g] || 'Unknown',
                count,
                color: GENDER_COLORS[g] || '#52525b',
            }))
            .sort((a, b) => b.count - a.count);
    }, [actors]);

    // ── Department Bars ─────────────────────────────────────────────────
    const deptData = useMemo(() => {
        const counts = {};
        actors.forEach(a => {
            const dept = a.known_for_department || 'Unknown';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([dept, count]) => ({ dept, count }))
            .sort((a, b) => b.count - a.count);
    }, [actors]);

    const maxDeptCount = useMemo(() => Math.max(...deptData.map(d => d.count), 1), [deptData]);

    // ── Category Split ──────────────────────────────────────────────────
    const categoryData = useMemo(() => {
        const counts = {};
        actors.forEach(a => {
            const cat = a.category || 'Other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([cat, count]) => ({ cat, count }))
            .sort((a, b) => b.count - a.count);
    }, [actors]);

    // ── Age Histogram ───────────────────────────────────────────────────
    const ageHistogram = useMemo(() => {
        const buckets = [
            { label: '<20', min: 0, max: 19, count: 0 },
            { label: '20–29', min: 20, max: 29, count: 0 },
            { label: '30–39', min: 30, max: 39, count: 0 },
            { label: '40–49', min: 40, max: 49, count: 0 },
            { label: '50–59', min: 50, max: 59, count: 0 },
            { label: '60–69', min: 60, max: 69, count: 0 },
            { label: '70+', min: 70, max: 999, count: 0 },
        ];
        actors.forEach(a => {
            const age = calcAge(a.birthday);
            if (age === null) return;
            const bucket = buckets.find(b => age >= b.min && age <= b.max);
            if (bucket) bucket.count++;
        });
        return buckets;
    }, [actors]);

    const maxAgeBucket = useMemo(() => Math.max(...ageHistogram.map(b => b.count), 1), [ageHistogram]);

    // ── Top 5 Popularity (multi-tab) ─────────────────────────────────
    const TOP5_TABS = useMemo(() => [
        { key: 'overall', label: 'Overall', filter: () => true },
        { key: 'male', label: 'Male', filter: a => a.gender === 2 },
        { key: 'female', label: 'Female', filter: a => a.gender === 1 },
        { key: 'indian', label: 'Indian', filter: a => a.category === 'Indian' },
        { key: 'non-indian', label: 'Non-Indian', filter: a => a.category === 'Non-Indian' },
        { key: 'indian-female', label: 'Indian Female', filter: a => a.category === 'Indian' && a.gender === 1 },
        { key: 'indian-male', label: 'Indian Male', filter: a => a.category === 'Indian' && a.gender === 2 },
        { key: 'ni-female', label: 'Non-Indian Female', filter: a => a.category === 'Non-Indian' && a.gender === 1 },
        { key: 'ni-male', label: 'Non-Indian Male', filter: a => a.category === 'Non-Indian' && a.gender === 2 },
    ], []);

    const [selectedTop5Tab, setSelectedTop5Tab] = useState('overall');

    // Only show tabs that have at least 1 actor
    const visibleTabs = useMemo(() =>
        TOP5_TABS.filter(tab => actors.some(a => a.popularity > 0 && tab.filter(a)))
        , [actors, TOP5_TABS]);

    const top5Filtered = useMemo(() => {
        const tab = TOP5_TABS.find(t => t.key === selectedTop5Tab) || TOP5_TABS[0];
        return [...actors]
            .filter(a => a.popularity > 0 && tab.filter(a))
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5);
    }, [actors, selectedTop5Tab, TOP5_TABS]);

    const maxPop = useMemo(() => (top5Filtered.length ? top5Filtered[0].popularity : 1), [top5Filtered]);

    if (!actors.length) return null;

    // ── Donut math ──────────────────────────────────────────────────────
    const RADIUS = 45;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    let donutOffset = 0;

    const AGE_BAR_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'];

    return (
        <div className="analytics-dashboard-inner">
            {/* ── Stat Tiles ── */}
            <div className="analytics-stat-row">
                <div className="analytics-stat-card">
                    <div className="stat-label">Total Actors</div>
                    <div className="stat-value">{totalActors}</div>
                    <div className="stat-subtitle">in your collection</div>
                </div>
                <div className="analytics-stat-card">
                    <div className="stat-label">Avg Popularity</div>
                    <div className="stat-value">{avgPopularity.toFixed(1)}</div>
                    <div className="stat-subtitle">TMDB score</div>
                </div>
                <div className="analytics-stat-card">
                    <div className="stat-label">Avg Age</div>
                    <div className="stat-value">{avgAge !== null ? avgAge : '—'}</div>
                    <div className="stat-subtitle">{avgAge !== null ? 'years old' : 'no birthday data'}</div>
                </div>
                <div className="analytics-stat-card">
                    <div className="stat-label">Most Popular</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>
                        {mostPopular?.name || '—'}
                    </div>
                    <div className="stat-subtitle">
                        {mostPopular?.popularity ? `★ ${mostPopular.popularity.toFixed(1)}` : ''}
                    </div>
                </div>
            </div>

            {/* ── Charts ── */}
            <div className="analytics-charts-grid">

                {/* Gender Donut */}
                <div className="analytics-chart-card">
                    <div className="chart-title">
                        <svg className="chart-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a10 10 0 0 1 0 20" />
                        </svg>
                        Gender Distribution
                    </div>
                    <div className="donut-chart-container">
                        <svg className="donut-svg" viewBox="0 0 110 110">
                            {genderData.map((item) => {
                                const fraction = item.count / totalActors;
                                const dashLen = fraction * CIRCUMFERENCE;
                                const gap = CIRCUMFERENCE - dashLen;
                                const offset = donutOffset;
                                donutOffset += dashLen;
                                return (
                                    <circle
                                        key={item.gender}
                                        className="donut-segment"
                                        cx="55" cy="55" r={RADIUS}
                                        stroke={item.color}
                                        strokeDasharray={`${dashLen} ${gap}`}
                                        strokeDashoffset={-offset}
                                    />
                                );
                            })}
                            <text
                                x="55" y="55"
                                textAnchor="middle" dominantBaseline="central"
                                fill="#fff" fontSize="18" fontWeight="800"
                                style={{ transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}
                            >
                                {totalActors}
                            </text>
                        </svg>
                        <div className="donut-legend">
                            {genderData.map(item => (
                                <div key={item.gender} className="donut-legend-item">
                                    <span className="legend-dot" style={{ background: item.color }} />
                                    {item.label}
                                    <span className="legend-count">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Department Bars */}
                <div className="analytics-chart-card">
                    <div className="chart-title">
                        <svg className="chart-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                        Department Breakdown
                    </div>
                    <div className="hbar-chart">
                        {deptData.map((d, i) => (
                            <div key={d.dept} className="hbar-row">
                                <span className="hbar-label">{d.dept}</span>
                                <div className="hbar-track">
                                    <div
                                        className="hbar-fill"
                                        style={{
                                            width: `${(d.count / maxDeptCount) * 100}%`,
                                            background: DEPT_COLORS[i % DEPT_COLORS.length],
                                        }}
                                    />
                                </div>
                                <span className="hbar-count">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Split */}
                <div className="analytics-chart-card">
                    <div className="chart-title">
                        <svg className="chart-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Category Split
                    </div>
                    <div className="category-split-container">
                        <div className="category-split-bar">
                            {categoryData.map((c, i) => {
                                const pct = (c.count / totalActors) * 100;
                                return (
                                    <div
                                        key={c.cat}
                                        className="category-split-segment"
                                        style={{
                                            width: `${pct}%`,
                                            background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                                        }}
                                    >
                                        {pct > 15 ? `${Math.round(pct)}%` : ''}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="category-split-legend">
                            {categoryData.map((c, i) => (
                                <div key={c.cat} className="category-legend-item">
                                    <span className="legend-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                                    {c.cat} ({c.count})
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Age Histogram */}
                <div className="analytics-chart-card">
                    <div className="chart-title">
                        <svg className="chart-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Age Distribution
                    </div>
                    <div className="age-histogram">
                        {ageHistogram.map((bucket, i) => (
                            <div key={bucket.label} className="age-bar-group">
                                {bucket.count > 0 && (
                                    <span className="age-bar-count">{bucket.count}</span>
                                )}
                                <div
                                    className="age-bar"
                                    style={{
                                        height: `${(bucket.count / maxAgeBucket) * 80}px`,
                                        background: AGE_BAR_COLORS[i % AGE_BAR_COLORS.length],
                                        opacity: bucket.count > 0 ? 1 : 0.2,
                                    }}
                                    title={`${bucket.label}: ${bucket.count} actors`}
                                />
                                <span className="age-bar-label">{bucket.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top 5 by Popularity — Tabbed (full-width) */}
            {visibleTabs.length > 0 && (
                <div className="analytics-chart-card" style={{ marginBottom: 8 }}>
                    <div className="chart-title">
                        <svg className="chart-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Top 5 by Popularity
                    </div>

                    {/* Tab pills */}
                    <div className="top5-tabs">
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.key}
                                className={`top5-tab-btn${selectedTop5Tab === tab.key ? ' active' : ''}`}
                                onClick={() => setSelectedTop5Tab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="top5-list">
                        {top5Filtered.length > 0 ? top5Filtered.map((actor, i) => (
                            <div key={actor.id} className="top5-item">
                                <span className="top5-rank">{i + 1}</span>
                                {actor.profile_path ? (
                                    <img
                                        src={getImageUrl(actor.profile_path, 'w185')}
                                        alt={actor.name}
                                        className="top5-avatar"
                                    />
                                ) : (
                                    <div className="top5-avatar-placeholder">🧑</div>
                                )}
                                <div className="top5-info">
                                    <div className="top5-name">{actor.name}</div>
                                    <div className="top5-bar-track">
                                        <div
                                            className="top5-bar-fill"
                                            style={{ width: `${(actor.popularity / maxPop) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="top5-score">★ {actor.popularity.toFixed(1)}</span>
                            </div>
                        )) : (
                            <div style={{ color: '#52525b', fontSize: 13, padding: '8px 0' }}>No actors in this category</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActorAnalyticsDashboard;
