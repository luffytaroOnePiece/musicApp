/**
 * generateMovieYoutubeMapper.js
 *
 * Reads movieAlbums.json AND privateAlbums.json and creates:
 *   src/data/movieYoutubeMapper.json
 *
 * Each entry is tagged with type: "Movie" or "Private".
 * Private albums use "prv-<spotifyID>" as key (no tmdbID).
 *
 * Comma-separated youtubeIDs: first = official, rest = live versions.
 *
 * Usage:
 *   node scripts/generateMovieYoutubeMapper.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOVIE_ALBUMS_FILE = path.join(__dirname, '../src/data/movieAlbums.json');
const PRIVATE_ALBUMS_FILE = path.join(__dirname, '../src/data/privateAlbums.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/movieYoutubeMapper.json');

/** Parse comma-separated IDs into official + live arrays */
function parseYoutubeIDs(rawIDs) {
    const youtubeIDs = [];
    const liveIDs = [];

    (rawIDs || []).forEach((entry, idx) => {
        if (typeof entry !== 'string') return;
        const parts = entry.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;

        youtubeIDs.push(parts[0]);

        for (let li = 1; li < parts.length; li++) {
            liveIDs.push({
                songIndex: idx,
                officialId: parts[0],
                liveId: parts[li],
                liveNum: li,
            });
        }
    });

    return { youtubeIDs, liveIDs };
}

function generateMapper() {
    const mapper = {};
    let movieCount = 0;
    let privateCount = 0;
    let skipped = 0;

    // ── Process movieAlbums.json ──
    if (fs.existsSync(MOVIE_ALBUMS_FILE)) {
        const movieAlbums = JSON.parse(fs.readFileSync(MOVIE_ALBUMS_FILE, 'utf-8'));
        console.log('── Movie Albums ──');

        for (const [spotifyID, album] of Object.entries(movieAlbums)) {
            if (!album.tmdbID) { skipped++; continue; }

            const tmdbID = String(album.tmdbID).trim();
            const { youtubeIDs, liveIDs } = parseYoutubeIDs(album.youtubeIDs);

            mapper[tmdbID] = {
                name: album.name || '',
                language: album.language || '',
                type: 'Movie',
                spotifyID,
                youtubeIDs,
                ...(liveIDs.length > 0 ? { liveIDs } : {}),
            };

            movieCount++;
            const liveStr = liveIDs.length > 0 ? ` + ${liveIDs.length} live` : '';
            console.log(`  ✓  [${tmdbID}] ${album.name}  (${youtubeIDs.length} video${youtubeIDs.length !== 1 ? 's' : ''}${liveStr})`);
        }
    } else {
        console.warn('⚠ movieAlbums.json not found, skipping.');
    }

    // ── Process privateAlbums.json ──
    if (fs.existsSync(PRIVATE_ALBUMS_FILE)) {
        const privateAlbums = JSON.parse(fs.readFileSync(PRIVATE_ALBUMS_FILE, 'utf-8'));
        console.log('\n── Private Albums ──');

        for (const [spotifyID, album] of Object.entries(privateAlbums)) {
            const key = `prv-${spotifyID}`;
            const { youtubeIDs, liveIDs } = parseYoutubeIDs(album.youtubeIDs);

            mapper[key] = {
                name: album.name || '',
                language: album.language || '',
                type: 'Private',
                spotifyID,
                youtubeIDs,
                ...(liveIDs.length > 0 ? { liveIDs } : {}),
                ...(album.personID ? { personID: album.personID } : {}),
            };

            privateCount++;
            const liveStr = liveIDs.length > 0 ? ` + ${liveIDs.length} live` : '';
            console.log(`  ✓  [${key}] ${album.name}  (${youtubeIDs.length} video${youtubeIDs.length !== 1 ? 's' : ''}${liveStr})`);
        }
    } else {
        console.warn('⚠ privateAlbums.json not found, skipping.');
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapper, null, 2), 'utf-8');

    console.log('\n══════════════════════════════════════════════');
    console.log(`  Movies    : ${movieCount}`);
    console.log(`  Private   : ${privateCount}`);
    console.log(`  Skipped   : ${skipped} (no tmdbID)`);
    console.log(`  Total     : ${movieCount + privateCount}`);
    console.log(`  Output    : ${OUTPUT_FILE}`);
    console.log('══════════════════════════════════════════════\n');
}

generateMapper();
