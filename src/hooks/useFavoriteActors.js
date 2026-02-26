import { useState, useCallback } from 'react';
// ─── IMPORTANT ──────────────────────────────────────────────────────────────
// This is the ONLY storage layer for favourite actors.
// Add/remove actor entries in src/data/favoriteActors.json to persist changes.
// Actors added via the UI ❤️ button are kept in memory for the current session
// only — they will NOT survive a page refresh unless you also add them to the
// JSON file.
// ────────────────────────────────────────────────────────────────────────────
import favActorsConfig from '../data/favoriteActors.json';

const normaliseEntry = (entry) => {
    if (typeof entry === 'number' || typeof entry === 'string') {
        return { id: Number(entry), name: null, profile_path: null, character: null, known_for_department: null };
    }
    return {
        id: Number(entry.id),
        name: entry.name || null,
        profile_path: entry.profile_path || null,
        character: entry.character || null,
        known_for_department: entry.known_for_department || null,
    };
};

const useFavoriteActors = () => {
    // Initialise purely from the JSON file — no localStorage involved
    const [favoriteActors, setFavoriteActors] = useState(() =>
        (favActorsConfig.actors || []).map(normaliseEntry)
    );

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
                },
            ];
        });
    }, []);

    const removeFavorite = useCallback(
        (actorId) => setFavoriteActors((prev) => prev.filter((a) => a.id !== actorId)),
        []
    );

    const clearAll = useCallback(() => setFavoriteActors([]), []);

    return { favoriteActors, isFavorite, toggleFavorite, removeFavorite, clearAll };
};

export default useFavoriteActors;
