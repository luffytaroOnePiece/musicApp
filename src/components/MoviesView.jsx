import React, { useEffect, useState } from 'react';
import { getAccountDetails, getAccountLists, getListDetails, getDetails, getCredits, getImages, getAccountWatchlist, getAccountFavorites, getAccountRated, searchMulti, getImageUrl, batchToggleWatchlist, batchToggleFavorite } from '../services/tmdbApi';
import '../styles/MoviesView.css';
import '../styles/movies/FavoriteActors.css';

// Components
import ListsGrid from './movies/ListsGrid';
import ListDetail from './movies/ListDetail';
import MovieDetail from './movies/MovieDetail';
import FavoriteActorsPage from './movies/FavoriteActorsPage';
import ActorPage from './movies/ActorPage';
import ReactDOM from 'react-dom';
import useFavoriteActors from '../hooks/useFavoriteActors';
import { SHOW_FAVORITE_ACTORS_PAGE } from '../config';

const MoviesView = () => {
    // --- STATE ---
    // Level 1: Lists
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Active tab: 'movies' | 'favorites'
    const [activeTab, setActiveTab] = useState('movies');

    // Favourite actors
    const { favoriteActors, isFavorite: isActorFav, toggleFavorite: toggleActorFav, removeFavorite, clearAll } = useFavoriteActors();

    // Actor page from Fav actors grid
    const [favSelectedActor, setFavSelectedActor] = useState(null);
    const [showFavActorPage, setShowFavActorPage] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Level 2: List Detail
    const [selectedList, setSelectedList] = useState(null);
    const [listItems, setListItems] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listStats, setListStats] = useState({
        itemCount: 0,
        averageRating: 0,
        totalRuntime: 0,
        totalRevenue: 0,
        loaded: false
    });
    // Store all watchlist, favorite, and rated items here to pass down for filtering
    const [allWatchlistItems, setAllWatchlistItems] = useState([]);
    const [allFavoriteItems, setAllFavoriteItems] = useState([]);
    const [allRatedItems, setAllRatedItems] = useState([]);

    // Level 3: Movie Detail
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieDetails, setMovieDetails] = useState(null);
    const [movieCredits, setMovieCredits] = useState(null);
    const [movieImages, setMovieImages] = useState(null);
    const [movieLoading, setMovieLoading] = useState(false);


    // --- EFFECTS ---

    // 1. Fetch Lists on Mount
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const accountData = await getAccountDetails();
                if (!accountData || !accountData.id) throw new Error('Failed to fetch TMDB account details.');

                const listsData = await getAccountLists(accountData.id);
                if (!listsData || !listsData.results) throw new Error('Failed to fetch lists.');

                // Add Watchlist as a special list
                const watchlist = {
                    id: 'watchlist',
                    name: 'My Watchlist',
                    description: 'Movies you have added to your watchlist using TMDB.',
                    item_count: 'Unknown',
                    list_type: 'movie',
                    poster_path: null,
                    backdrop_path: null
                };

                let allLists = [watchlist, ...listsData.results];

                // Enrich lists with a backdrop from their first item
                // This might be heavy if many lists, but essential for the UI
                const enrichedLists = await Promise.all(allLists.map(async (list) => {
                    try {
                        // 1. If list already has a backdrop (unlikely for v3 lists but possible), use it.
                        if (list.backdrop_path) return list;

                        // 2. Fetch first item to get a movie backdrop (preferred for landscape card)
                        let firstItem = null;
                        if (list.id === 'watchlist') {
                            const res = await getAccountWatchlist(accountData.id, 1, 'movies');
                            if (res && res.results && res.results.length > 0) firstItem = res.results[0];
                        } else {
                            // Only fetch if we really need to (if we want to force backdrop over poster)
                            // Or if we don't trust list.poster_path for landscape.
                            const res = await getListDetails(list.id, 1);
                            if (res && res.items && res.items.length > 0) firstItem = res.items[0];
                        }

                        if (firstItem) {
                            return {
                                ...list,
                                // Prioritize: List Backdrop > Item Backdrop > Item Poster > List Poster
                                backdrop_path: list.backdrop_path || firstItem.backdrop_path || firstItem.poster_path || list.poster_path,
                                poster_path: list.poster_path || firstItem.poster_path
                            };
                        }

                        // 3. Fallback: If no items, use list's own poster if available
                        if (list.poster_path) {
                            return { ...list, backdrop_path: list.poster_path };
                        }

                        return list;
                    } catch (e) {
                        return list;
                    }
                }));

                setLists(enrichedLists);
            } catch (err) {
                console.error("Error fetching lists:", err);
                setError(err.message || 'An error occurred fetching lists.');
            } finally {
                setLoading(false);
            }
        };
        fetchLists();
    }, []);

    // 2. Fetch List Items & Calculate Stats
    useEffect(() => {
        if (!selectedList) {
            setListStats({ loaded: false });
            return;
        }

        const fetchListItemsAndStats = async () => {
            setListLoading(true);
            try {
                let items = [];
                let accountData = null;

                const fetchAllPages = async (initialResponse, fetchFunction, accountId, type) => {
                    if (!initialResponse || !initialResponse.results) return [];
                    let combinedResults = [...initialResponse.results];
                    const totalPages = initialResponse.total_pages;

                    if (totalPages > 1) {
                        const promises = [];
                        for (let i = 2; i <= totalPages; i++) {
                            promises.push(fetchFunction(accountId, i, type));
                        }

                        const pageResponses = await Promise.all(promises);
                        pageResponses.forEach(response => {
                            if (response && response.results) {
                                combinedResults = [...combinedResults, ...response.results];
                            }
                        });
                    }
                    return combinedResults;
                };

                if (selectedList.id === 'watchlist') {
                    accountData = await getAccountDetails();
                    if (accountData && accountData.id) {
                        const firstPageMovies = await getAccountWatchlist(accountData.id, 1, 'movies');
                        const movies = await fetchAllPages(firstPageMovies, getAccountWatchlist, accountData.id, 'movies');
                        const firstPageTv = await getAccountWatchlist(accountData.id, 1, 'tv');
                        const tvShows = await fetchAllPages(firstPageTv, getAccountWatchlist, accountData.id, 'tv');
                        items = [...movies, ...tvShows];
                    }
                } else {
                    const firstPage = await getListDetails(selectedList.id, 1);
                    // Standard TMDB v3 /list/{id} returns 'items', not 'results'. 
                    // Let's handle this difference carefully.
                    if (firstPage && firstPage.items) {
                        // Adapting fetchAllPages for 'items' vs 'results' if needed, OR just manually loop here for lists
                        // since structure differs (watchlist=results, list=items).

                        let combinedItems = [...firstPage.items];
                        // /list/{id} endpoint in V3 actually MIGHT NOT support typical page param for items in the same way? 
                        // Check TMDB docs: GET /list/{list_id} doesn't document 'page' well for V3, usually returns all or has specific pagination?
                        // Actually V3 /list/{id} DOES NOT paginate items usually? It returns all?
                        // Wait, check standard. V4 lists paginate. V3 user created lists might be limited?
                        // If V3 list responses contain 'items', we assume one page unless we verify.
                        // But if user says 30 items showing 20, likely it IS paginated or limited.
                        // Let's assume pagination works via page param.

                        // Re-impl for List specifically to be safe about 'items' key
                        if (firstPage.total_pages && firstPage.total_pages > 1) {
                            const promises = [];
                            for (let i = 2; i <= firstPage.total_pages; i++) {
                                promises.push(getListDetails(selectedList.id, i));
                            }
                            const responses = await Promise.all(promises);
                            responses.forEach(res => {
                                if (res && res.items) combinedItems = [...combinedItems, ...res.items];
                            });
                        }
                        items = combinedItems;
                    }

                    // Also fetch the full watchlist, favorites, and rated items to allow filtering
                    accountData = await getAccountDetails();
                    if (accountData && accountData.id) {
                        const fetchData = async (fetchFunc) => {
                            const [pageM, pageT] = await Promise.all([
                                fetchFunc(accountData.id, 1, 'movies'),
                                fetchFunc(accountData.id, 1, 'tv')
                            ]);
                            const [allM, allT] = await Promise.all([
                                fetchAllPages(pageM, fetchFunc, accountData.id, 'movies'),
                                fetchAllPages(pageT, fetchFunc, accountData.id, 'tv')
                            ]);
                            return [...allM, ...allT];
                        };

                        const [fullWatchlist, fullFavorites, fullRated] = await Promise.all([
                            fetchData(getAccountWatchlist),
                            fetchData(getAccountFavorites),
                            fetchData(getAccountRated)
                        ]);

                        setAllWatchlistItems(fullWatchlist || []);
                        setAllFavoriteItems(fullFavorites || []);
                        setAllRatedItems(fullRated || []);
                    }
                }

                if (items) {
                    setListItems(items);
                    // Filter/Sort logic moved to ListDetail

                    const count = items.length;

                    // Filter out unrated items (0 rating) for more accurate average
                    const ratedItems = items.filter(item => item.vote_average > 0);
                    const ratedCount = ratedItems.length;

                    const totalVoteSum = ratedItems.reduce((acc, item) => acc + item.vote_average, 0);

                    const avgRating = ratedCount > 0
                        ? totalVoteSum / ratedCount
                        : 0;

                    setListStats(prev => ({
                        ...prev,
                        itemCount: count,
                        averageRating: avgRating,
                        loaded: false
                    }));

                    // Deep Stats Fetching
                    let totalRuntimeMins = 0;
                    let totalRevenueUSD = 0;



                    const enrichPromises = items.map(async (item) => {
                        const type = item.media_type || 'movie';
                        const details = await getDetails(item.id, type);
                        return details;
                    });

                    const enrichedItems = await Promise.all(enrichPromises);

                    enrichedItems.forEach(detail => {
                        if (detail) {
                            if (detail.runtime) totalRuntimeMins += detail.runtime;
                            if (detail.revenue) totalRevenueUSD += detail.revenue;
                        }
                    });

                    setListStats(prev => ({
                        ...prev,
                        totalRuntime: totalRuntimeMins,
                        totalRevenue: totalRevenueUSD,
                        loaded: true
                    }));

                }
            } catch (err) {
                console.error("Error fetching list details:", err);
            } finally {
                setListLoading(false);
            }
        };

        fetchListItemsAndStats();
    }, [selectedList]);


    // 3. Fetch Movie Details
    useEffect(() => {
        if (!selectedMovie) return;

        const fetchMovieDeepDetails = async () => {
            setMovieLoading(true);
            try {
                const type = selectedMovie.media_type || 'movie';
                const [details, credits, images] = await Promise.all([
                    getDetails(selectedMovie.id, type),
                    getCredits(selectedMovie.id, type),
                    getImages(selectedMovie.id, type)
                ]);

                setMovieDetails(details);
                setMovieCredits(credits);
                setMovieImages(images);
            } catch (err) {
                console.error("Error fetching movie details", err);
            } finally {
                setMovieLoading(false);
            }
        };

        fetchMovieDeepDetails();
    }, [selectedMovie]);


    // --- HANDLERS ---
    const handleListSelect = (list) => {
        setSelectedList(list);
    }

    const handleMovieSelect = (movie) => {
        setSelectedMovie(movie);
    }

    const handleBackToList = () => {
        setSelectedMovie(null);
        setMovieDetails(null);
        setMovieCredits(null);
        setMovieImages(null);
    }

    const handleBackToGrid = () => {
        setSelectedList(null);
        setListItems([]);
    }

    const handleBatchWatchProps = async (selectedIds, actionType) => {
        // Find the full items from listItems
        const itemsToProcess = listItems.filter(item => selectedIds.includes(item.id));
        if (!itemsToProcess.length) return;

        const accountData = await getAccountDetails();
        if (!accountData || !accountData.id) return;
        const acctId = accountData.id;

        try {
            if (actionType === 'watch') {
                // Determine state: if all selected are already watched, we unwatch. Else watch.
                // We check against allWatchlistItems
                const allWatched = itemsToProcess.every(item => allWatchlistItems.some(w => w.id === item.id));
                const newState = !allWatched;

                await batchToggleWatchlist(acctId, itemsToProcess, newState);

                // Optimistically update local lists or refetch full watchlist
                // Simplest is refetching just the modified list types
                const [pageM, pageT] = await Promise.all([
                    getAccountWatchlist(acctId, 1, 'movies'),
                    getAccountWatchlist(acctId, 1, 'tv')
                ]);
                // This is a minimal refetch. A full fetchAllPages might be needed if they have >20 items.
                // For a robust optimistic update, let's just update the local array
                setAllWatchlistItems(prev => {
                    if (newState) {
                        return [...prev, ...itemsToProcess.filter(it => !prev.some(p => p.id === it.id))];
                    } else {
                        return prev.filter(p => !itemsToProcess.some(it => it.id === p.id));
                    }
                });

            } else if (actionType === 'favorite') {
                const allFav = itemsToProcess.every(item => allFavoriteItems.some(f => f.id === item.id));
                const newState = !allFav;

                await batchToggleFavorite(acctId, itemsToProcess, newState);

                setAllFavoriteItems(prev => {
                    if (newState) {
                        return [...prev, ...itemsToProcess.filter(it => !prev.some(p => p.id === it.id))];
                    } else {
                        return prev.filter(p => !itemsToProcess.some(it => it.id === p.id));
                    }
                });
            }
        } catch (error) {
            console.error("Batch operation failed:", error);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            setIsSearching(true);
            try {
                const results = await searchMulti(query);
                if (results && results.results) {
                    const filtered = results.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
                    setSearchResults(filtered);
                }
            } catch (error) {
                console.error("Search failed:", error);
            }
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    if (error) return <div className="movies-view-error">{error}</div>;

    // VIEW: Movie Detail (Level 3)
    if (selectedMovie) {
        return (
            <MovieDetail
                movie={selectedMovie}
                details={movieDetails}
                credits={movieCredits}
                images={movieImages}
                loading={movieLoading}
                onBack={handleBackToList}
            />
        );
    }

    // VIEW: List Detail (Level 2)
    if (selectedList) {
        return (
            <ListDetail
                list={selectedList}
                items={listItems}
                stats={listStats}
                loading={listLoading}
                onBack={handleBackToGrid}
                onMovieSelect={handleMovieSelect}
                watchlistItems={selectedList.id === 'watchlist' ? listItems : allWatchlistItems}
                favoriteItems={allFavoriteItems}
                ratedItems={allRatedItems}
                onBatchWatchProps={handleBatchWatchProps}
            />
        );
    }

    // VIEW: Search Results or Lists Grid (Level 1)
    return (
        <div className="movies-view-container">
            <div className="movies-header glass-header sticky-header" style={{ display: 'flex', flexDirection: 'column', padding: 0, paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0 20px', gap: '24px' }}>
                    <h2 className="header-title-large" style={{ margin: 0, flexShrink: 0 }}>Movies &amp; TV</h2>
                    <div className="movies-search-bar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search movies, TV shows..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Tab Bar — only shown when feature flag is ON */}
                {SHOW_FAVORITE_ACTORS_PAGE === 1 && (
                    <div className="movies-tab-bar" style={{ padding: '0 20px' }}>
                        <button
                            className={`movies-tab-btn${activeTab === 'movies' ? ' active' : ''}`}
                            onClick={() => setActiveTab('movies')}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                                <polyline points="17 2 12 7 7 2" />
                            </svg>
                            Movies &amp; TV
                        </button>
                        <button
                            className={`movies-tab-btn${activeTab === 'favorites' ? ' active' : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={activeTab === 'favorites' ? '#e74c3c' : 'none'} stroke={activeTab === 'favorites' ? '#e74c3c' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            Fav Actors
                            {favoriteActors.length > 0 && (
                                <span className="movies-tab-fav-count">{favoriteActors.length}</span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Full-screen ActorPage from Fav grid */}
            {showFavActorPage && favSelectedActor && ReactDOM.createPortal(
                <ActorPage
                    actor={favSelectedActor}
                    onBack={() => { setShowFavActorPage(false); setFavSelectedActor(null); }}
                    onMovieClick={() => { setShowFavActorPage(false); setFavSelectedActor(null); }}
                />,
                document.body
            )}

            {/* Favourite Actors Tab */}
            {SHOW_FAVORITE_ACTORS_PAGE === 1 && activeTab === 'favorites' ? (
                <div className="content-scroll-area">
                    <FavoriteActorsPage
                        favoriteActors={favoriteActors}
                        onActorClick={(actor) => { setFavSelectedActor(actor); setShowFavActorPage(true); }}
                    />
                </div>
            ) : isSearching ? (
                <div className="content-scroll-area">
                    <div className="movies-grid animate-stagger-children" style={{ padding: '20px', paddingBottom: '100px' }}>
                        {searchResults.map(item => (
                            <div
                                key={item.id}
                                className={`movie-card glass-card`}
                                onClick={() => handleMovieSelect(item)}
                            >
                                <div className="movie-poster-wrapper">
                                    {item.poster_path ? (
                                        <img
                                            src={getImageUrl(item.poster_path, 'w500')}
                                            alt={item.title || item.name}
                                            className="movie-poster"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="no-poster"><span>No Image</span></div>
                                    )}
                                    <div className="rating-badge glass-badge">
                                        ★ {item.vote_average?.toFixed(1)}
                                    </div>
                                </div>
                                <div className="movie-info">
                                    <h3 className="movie-title">{item.title || item.name}</h3>
                                    <div className="movie-meta">
                                        <span>{(item.release_date || item.first_air_date || '').split('-')[0]}</span>
                                        {item.media_type && <span>• {item.media_type === 'tv' ? 'TV' : 'Movie'}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {searchResults.length === 0 && (
                            <div className="no-items-found" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                No results found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <ListsGrid
                    lists={lists}
                    onListSelect={handleListSelect}
                />
            )}
        </div>
    );
};

export default MoviesView;
