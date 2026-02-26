import React, { useEffect, useState, useMemo } from 'react';
import { getImageUrl, getDetails } from '../../services/tmdbApi';
import GlossySelect from '../GlossySelect';
import ActorAnalyticsDashboard from './ActorAnalyticsDashboard';
import '../../styles/movies/FavoriteActors.css';
import '../../styles/movies/ActorAnalytics.css';

/**
 * Enriches actors that only have an id by fetching full details from TMDB.
 */
const useEnrichedActors = (actors) => {
    const [enriched, setEnriched] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const enrich = async () => {
            const results = await Promise.all(
                actors.map(async (actor) => {
                    try {
                        const details = await getDetails(actor.id, 'person');
                        if (!details) return { ...actor, popularity: 0, gender: 0 };
                        return {
                            ...actor,
                            name: actor.name || details.name,
                            profile_path: actor.profile_path || details.profile_path,
                            known_for_department: actor.known_for_department || details.known_for_department,
                            popularity: details.popularity || 0,
                            gender: details.gender || 0,
                            birthday: details.birthday || null,
                        };
                    } catch {
                        return { ...actor, popularity: 0, gender: 0 };
                    }
                })
            );
            if (!cancelled) {
                setEnriched(results);
                setLoading(false);
            }
        };
        enrich();
        return () => { cancelled = true; };
    }, [actors]);

    return { enriched, loading };
};

const SORT_OPTIONS = [
    { value: 'name-asc', label: 'Name A → Z' },
    { value: 'name-desc', label: 'Name Z → A' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'age-young', label: 'Age (Youngest)' },
    { value: 'age-old', label: 'Age (Oldest)' },
];

const GENDER_LABELS = { 1: 'Female', 2: 'Male', 3: 'Non-Binary' };

const calcAge = (birthday) => {
    if (!birthday) return null;
    const diff = Date.now() - new Date(birthday).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const FavoriteActorsPage = ({ favoriteActors, onActorClick }) => {
    const { enriched: actors, loading } = useEnrichedActors(favoriteActors);

    // Analytics toggle
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Filter + sort state
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [deptFilter, setDeptFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name-asc');

    // Derive unique departments
    const departments = useMemo(() => {
        const set = new Set();
        actors.forEach((a) => { if (a.known_for_department) set.add(a.known_for_department); });
        return Array.from(set).sort();
    }, [actors]);

    // Derive unique genders
    const genders = useMemo(() => {
        const set = new Set();
        actors.forEach((a) => { if (a.gender && GENDER_LABELS[a.gender]) set.add(a.gender); });
        return Array.from(set).sort();
    }, [actors]);

    // Derive unique categories
    const actorCategories = useMemo(() => {
        const set = new Set();
        actors.forEach((a) => { if (a.category) set.add(a.category); });
        return Array.from(set);
    }, [actors]);

    // Build GlossySelect options arrays
    const categoryOptions = useMemo(() => [
        { value: 'all', label: 'All' },
        ...actorCategories.map((c) => ({ value: c, label: c }))
    ], [actorCategories]);

    const deptOptions = useMemo(() => [
        { value: 'all', label: 'All' },
        ...departments.map((d) => ({ value: d, label: d }))
    ], [departments]);

    const genderOptions = useMemo(() => [
        { value: 'all', label: 'All' },
        ...genders.map((g) => ({ value: String(g), label: GENDER_LABELS[g] }))
    ], [genders]);

    const sortOptions = useMemo(() =>
        SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
        , []);

    // Apply filter + sort
    const filteredActors = useMemo(() => {
        let list = [...actors];

        if (categoryFilter !== 'all') {
            list = list.filter((a) => a.category === categoryFilter);
        }
        if (deptFilter !== 'all') {
            list = list.filter((a) => a.known_for_department === deptFilter);
        }
        if (genderFilter !== 'all') {
            list = list.filter((a) => a.gender === Number(genderFilter));
        }

        switch (sortBy) {
            case 'name-asc':
                list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name-desc':
                list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'popularity':
                list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                break;
            case 'age-young':
                list.sort((a, b) => {
                    const ageA = calcAge(a.birthday);
                    const ageB = calcAge(b.birthday);
                    if (ageA === null) return 1;
                    if (ageB === null) return -1;
                    return ageA - ageB;
                });
                break;
            case 'age-old':
                list.sort((a, b) => {
                    const ageA = calcAge(a.birthday);
                    const ageB = calcAge(b.birthday);
                    if (ageA === null) return 1;
                    if (ageB === null) return -1;
                    return ageB - ageA;
                });
                break;
            default:
                break;
        }

        return list;
    }, [actors, categoryFilter, deptFilter, genderFilter, sortBy]);

    const hasActiveFilters = categoryFilter !== 'all' || deptFilter !== 'all' || genderFilter !== 'all';

    return (
        <div className="fav-actors-page">
            {/* Header */}
            <div className="fav-actors-header">
                <div className="fav-actors-title">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#e74c3c" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <h2>Favourite Actors</h2>
                    {actors.length > 0 && (
                        <span className="fav-actors-count-badge">{filteredActors.length}{hasActiveFilters ? ` / ${actors.length}` : ''}</span>
                    )}
                    {actors.length > 0 && (
                        <button
                            className={`analytics-toggle-btn${showAnalytics ? ' active' : ''}`}
                            onClick={() => setShowAnalytics(prev => !prev)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            Analytics
                        </button>
                    )}
                </div>
            </div>

            {/* Filter & Sort Bar — using GlossySelect */}
            {actors.length > 0 && (
                <div className="fav-actors-controls">
                    {actorCategories.length > 1 && (
                        <GlossySelect
                            label="Category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={categoryOptions}
                        />
                    )}

                    {departments.length > 1 && (
                        <GlossySelect
                            label="Department"
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            options={deptOptions}
                        />
                    )}

                    {genders.length > 1 && (
                        <GlossySelect
                            label="Gender"
                            value={genderFilter}
                            onChange={(e) => setGenderFilter(e.target.value)}
                            options={genderOptions}
                        />
                    )}

                    <GlossySelect
                        label="Sort By"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        options={sortOptions}
                    />

                    {hasActiveFilters && (
                        <button
                            className="fav-reset-filters-btn"
                            onClick={() => { setCategoryFilter('all'); setDeptFilter('all'); setGenderFilter('all'); }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            )}

            {/* Analytics Dashboard */}
            <div className={`analytics-dashboard${showAnalytics ? ' open' : ''}`}>
                {showAnalytics && <ActorAnalyticsDashboard actors={filteredActors} />}
            </div>

            {/* Loading */}
            {loading && actors.length === 0 && (
                <div className="fav-actors-empty">
                    <div className="fav-actors-empty-icon">⏳</div>
                    <h3>Loading actors...</h3>
                </div>
            )}

            {/* Empty State */}
            {!loading && actors.length === 0 ? (
                <div className="fav-actors-empty">
                    <div className="fav-actors-empty-icon">🎬</div>
                    <h3>No favourite actors yet</h3>
                    <p>Add actor TMDB IDs to <code>favoriteActors.json</code> to display them here.</p>
                </div>
            ) : !loading && filteredActors.length === 0 ? (
                <div className="fav-actors-empty">
                    <div className="fav-actors-empty-icon">🔍</div>
                    <h3>No actors match filters</h3>
                    <p>Try adjusting the department or gender filter.</p>
                </div>
            ) : (
                <div className="fav-actors-grid">
                    {filteredActors.map((actor) => (
                        <div
                            key={actor.id}
                            className="fav-actor-card"
                            onClick={() => onActorClick && onActorClick(actor)}
                        >
                            <div className="fav-actor-poster-wrap">
                                {actor.profile_path ? (
                                    <img
                                        src={getImageUrl(actor.profile_path, 'w342')}
                                        alt={actor.name || `Actor ${actor.id}`}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="fav-actor-no-photo">🧑‍🎤</div>
                                )}
                            </div>
                            <div className="fav-actor-info">
                                <div className="fav-actor-name">{actor.name || `Actor #${actor.id}`}</div>
                                {actor.known_for_department && (
                                    <div className="fav-actor-dept">{actor.known_for_department}</div>
                                )}
                                {sortBy === 'popularity' && actor.popularity > 0 && (
                                    <div className="fav-actor-popularity">
                                        ★ {actor.popularity.toFixed(1)}
                                    </div>
                                )}
                                {(sortBy === 'age-young' || sortBy === 'age-old') && calcAge(actor.birthday) !== null && (
                                    <div className="fav-actor-age">
                                        {calcAge(actor.birthday)} years old
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoriteActorsPage;
