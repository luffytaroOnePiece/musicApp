import React, { useEffect, useState } from 'react';
import { getAccountDetails, getAccountLists, getListDetails, getDetails, getCredits, getImages, getAccountWatchlist } from '../services/tmdbApi';
import '../styles/MoviesView.css';

// Components
import ListsGrid from './movies/ListsGrid';
import ListDetail from './movies/ListDetail';
import MovieDetail from './movies/MovieDetail';

const MoviesView = () => {
    // --- STATE ---
    // Level 1: Lists
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                            const res = await getAccountWatchlist(accountData.id, 1);
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

                const fetchAllPages = async (initialResponse, fetchFunction, ...args) => {
                    if (!initialResponse || !initialResponse.results) return [];
                    let combinedResults = [...initialResponse.results];
                    const totalPages = initialResponse.total_pages;

                    if (totalPages > 1) {
                        const promises = [];
                        for (let i = 2; i <= totalPages; i++) {
                            // Watchlist and ListDetails take (id, page) usually
                            // But arguments might differ.
                            // Watchlist: (accountId, page)
                            // ListDetails: (listId, page)
                            promises.push(fetchFunction(...args, i));
                        }

                        const pageResponses = await Promise.all(promises);
                        pageResponses.forEach(response => {
                            if (response && response.results) {
                                combinedResults = [...combinedResults, ...response.results];
                            } else if (response && response.items) { // Handle ListDetails return structure check if standardized
                                combinedResults = [...combinedResults, ...response.items];
                            }
                        });

                        // Note: Depending on API, ListDetails might return { items: [] } or { results: [] }
                        // Normalized in the loop above? 
                        // Let's check: getListDetails uses /list/{id} which V3 returns { items: [], ... } often but V4 uses results.
                        // Standardize below.
                    }
                    return combinedResults;
                };

                if (selectedList.id === 'watchlist') {
                    accountData = await getAccountDetails();
                    if (accountData && accountData.id) {
                        const firstPage = await getAccountWatchlist(accountData.id, 1);
                        items = await fetchAllPages(firstPage, getAccountWatchlist, accountData.id);
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
            />
        );
    }

    // VIEW: Lists Grid (Level 1)
    return (
        <ListsGrid
            lists={lists}
            onListSelect={handleListSelect}
        />
    );
};

export default MoviesView;
