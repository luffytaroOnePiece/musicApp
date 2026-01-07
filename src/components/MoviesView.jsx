import React, { useEffect, useState } from 'react';
import { getAccountDetails, getAccountLists, getListDetails, getDetails, getCredits, getImages } from '../services/tmdbApi';
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
                setLists(listsData.results);
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
                const listData = await getListDetails(selectedList.id);
                if (listData && listData.items) {
                    setListItems(listData.items);
                    // Filter/Sort logic moved to ListDetail

                    const count = listData.items.length;

                    // Filter out unrated items (0 rating) for more accurate average
                    const ratedItems = listData.items.filter(item => item.vote_average > 0);
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

                    const enrichPromises = listData.items.map(async (item) => {
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
