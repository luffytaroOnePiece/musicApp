/**
 * generateMovieYoutubeMapper.js
 *
 * Reads movieAlbums.json and creates:
 *   src/data/movieYoutubeMapper.json
 *
 * Output format:
 * {
 *   "<tmdbID>": {
 *     "name": "Movie Name",
 *     "language": "Telugu",
 *     "spotifyID": "<spotifyPlaylistID>",
 *     "youtubeIDs": ["<id1>", "<id2>", ...]
 *   }
 * }
 *
 * Usage:
 *   npm run generate-movie-mapper
 *   node scripts/generateMovieYoutubeMapper.js --hints hints.json

 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOVIE_ALBUMS_FILE = path.join(__dirname, '../src/data/movieAlbums.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/movieYoutubeMapper.json');

function generateMapper() {
    if (!fs.existsSync(MOVIE_ALBUMS_FILE)) {
        console.error(`✗ movieAlbums.json not found at:\n  ${MOVIE_ALBUMS_FILE}`);
        process.exit(1);
    }

    const movieAlbums = JSON.parse(fs.readFileSync(MOVIE_ALBUMS_FILE, 'utf-8'));
    const mapper = {};
    let mapped = 0;
    let skipped = 0;

    for (const [spotifyID, album] of Object.entries(movieAlbums)) {
        if (!album.tmdbID) {
            skipped++;
            continue;
        }

        const tmdbID = String(album.tmdbID).trim();

        // Normalise youtubeIDs — some legacy entries use comma-separated strings
        const rawIDs = Array.isArray(album.youtubeIDs) ? album.youtubeIDs : [];
        const youtubeIDs = rawIDs
            .flatMap(id => (typeof id === 'string' ? id.split(',').map(s => s.trim()) : []))
            .filter(Boolean);

        mapper[tmdbID] = {
            name: album.name || '',
            language: album.language || '',
            spotifyID,
            youtubeIDs,
        };

        mapped++;
        console.log(`  ✓  [${tmdbID}] ${album.name}  (${youtubeIDs.length} video${youtubeIDs.length !== 1 ? 's' : ''})`);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapper, null, 2), 'utf-8');

    console.log('\n══════════════════════════════════════════════');
    console.log(`  Mapped    : ${mapped} movies (had tmdbID)`);
    console.log(`  Skipped   : ${skipped} albums (no tmdbID — add tmdbID to include them)`);
    console.log(`  Output    : ${OUTPUT_FILE}`);
    console.log('══════════════════════════════════════════════\n');
}

generateMapper();
