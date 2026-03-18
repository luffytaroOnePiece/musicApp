import { useState, useCallback, useEffect, useRef } from "react";

const IS_DEV = import.meta.env.DEV;
const API_URL = "/api/favorites";

/**
 * Custom hook: manage YouTube‑Music favourites.
 *
 * - DEV mode:  read/write via Vite middleware → src/data/favorites.json
 * - PROD mode: read the statically‑bundled favorites.json (no write)
 */
const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const savingRef = useRef(false);
  const loadedRef = useRef(false);

  // ── Load favorites ──
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (IS_DEV) {
      // Dev: fetch from Vite middleware
      fetch(API_URL)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch(() => {});
    } else {
      // Prod: dynamically import the bundled JSON
      import("../data/favorites.json")
        .then((mod) => {
          const data = mod.default || mod;
          if (Array.isArray(data)) setFavorites(data);
        })
        .catch(() => {});
    }
  }, []);

  // ── Persist to file (dev only) ──
  const persistToFile = useCallback((favs) => {
    if (!IS_DEV || savingRef.current) return;
    savingRef.current = true;
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(favs),
    })
      .catch(() => {})
      .finally(() => {
        savingRef.current = false;
      });
  }, []);

  const isFavorite = useCallback(
    (ytId) => favorites.some((f) => f.ytId === ytId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (meta) => {
      if (!IS_DEV) return; // no-op in prod
      setFavorites((prev) => {
        const exists = prev.some((f) => f.ytId === meta.ytId);
        const next = exists
          ? prev.filter((f) => f.ytId !== meta.ytId)
          : [
              ...prev,
              {
                ytId: meta.ytId,
                title: meta.title || "Untitled",
                albumName: meta.albumName || "",
                language: meta.language || "",
                type: meta.type || "",
                addedAt: new Date().toISOString(),
              },
            ];
        persistToFile(next);
        return next;
      });
    },
    [persistToFile],
  );

  /** Download favourites as a .json file */
  const exportFavorites = useCallback(() => {
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ytm-favorites.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [favorites]);

  return { favorites, isFavorite, toggleFavorite, exportFavorites, isDev: IS_DEV };
};

export default useFavorites;
