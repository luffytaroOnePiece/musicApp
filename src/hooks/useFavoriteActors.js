import { useState, useCallback } from 'react';
import favActorsConfig from '../data/favoriteActors.json';

const normaliseEntry = (entry, category) => {
    const id = typeof entry === 'object' ? Number(entry.id) : Number(entry);
    return {
        id,
        name: (typeof entry === 'object' && entry.name) || null,
        profile_path: (typeof entry === 'object' && entry.profile_path) || null,
        character: null,
        known_for_department: (typeof entry === 'object' && entry.known_for_department) || null,
        category,
    };
};

const buildInitial = () => {
    // Support both old flat format and new categories format
    if (favActorsConfig.categories) {
        return favActorsConfig.categories.flatMap((cat) =>
            (cat.actors || []).map((entry) => normaliseEntry(entry, cat.name))
        );
    }
    // Fallback: old flat format
    return (favActorsConfig.actors || []).map((entry) => normaliseEntry(entry, 'All'));
};

const useFavoriteActors = () => {
    const [favoriteActors, setFavoriteActors] = useState(buildInitial);

    const isFavorite = useCallback(
        (actorId) => favoriteActors.some((a) => a.id === actorId),
        [favoriteActors]
    );

    const toggleFavorite = useCallback((actor) => {
        setFavoriteActors((prev) => {
            if (prev.some((a) => a.id === actor.id)) {
                return prev.filter((a) => a.id !== actor.id);
            }
            return [
                ...prev,
                {
                    id: actor.id,
                    name: actor.name,
                    profile_path: actor.profile_path || null,
                    character: actor.character || null,
                    known_for_department: actor.known_for_department || null,
                    category: actor.category || 'Other',
                },
            ];
        });
    }, []);

    const removeFavorite = useCallback(
        (actorId) => setFavoriteActors((prev) => prev.filter((a) => a.id !== actorId)),
        []
    );

    const clearAll = useCallback(() => setFavoriteActors([]), []);

    // Extract unique categories
    const categories = [...new Set(favoriteActors.map((a) => a.category).filter(Boolean))];

    return { favoriteActors, isFavorite, toggleFavorite, removeFavorite, clearAll, categories };
};

export default useFavoriteActors;
