import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const MOVIE_ALBUMS_FILE = path.join(__dirname, '../src/data/movieAlbums.json');
const PRIVATE_ALBUMS_FILE = path.join(__dirname, '../src/data/privateAlbums.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/youtubeIdsByLanguage.json');

async function extractYoutubeIds() {
    try {
        console.log('Starting extraction of YouTube IDs...');

        // Read source files
        let movieAlbums = {};
        let privateAlbums = {};

        if (fs.existsSync(MOVIE_ALBUMS_FILE)) {
            const data = fs.readFileSync(MOVIE_ALBUMS_FILE, 'utf-8');
            movieAlbums = JSON.parse(data);
            console.log(`Loaded ${Object.keys(movieAlbums).length} movie albums.`);
        } else {
            console.warn(`Warning: Movie albums file not found at ${MOVIE_ALBUMS_FILE}`);
        }

        if (fs.existsSync(PRIVATE_ALBUMS_FILE)) {
            const data = fs.readFileSync(PRIVATE_ALBUMS_FILE, 'utf-8');
            privateAlbums = JSON.parse(data);
            console.log(`Loaded ${Object.keys(privateAlbums).length} private albums.`);
        } else {
            console.warn(`Warning: Private albums file not found at ${PRIVATE_ALBUMS_FILE}`);
        }

        const allAlbums = { ...movieAlbums, ...privateAlbums };
        const groupedIds = {};

        // Extract and group IDs
        // First ID in comma-separated list is regular, rest are live performances
        let totalIds = 0;
        Object.values(allAlbums).forEach(album => {
            const lang = album.language || "Unknown";
            const liveKey = `${lang}-Live`;

            if (!groupedIds[lang]) {
                groupedIds[lang] = new Set();
            }
            if (!groupedIds[liveKey]) {
                groupedIds[liveKey] = new Set();
            }

            if (album.youtubeIDs && Array.isArray(album.youtubeIDs)) {
                album.youtubeIDs.forEach(idString => {
                    // Split by comma if present and trim whitespace
                    if (typeof idString === 'string') {
                        const ids = idString.split(',').map(s => s.trim()).filter(s => s);
                        ids.forEach((id, index) => {
                            if (index === 0) {
                                // First ID is the regular song video
                                groupedIds[lang].add(id);
                            } else {
                                // Subsequent IDs are live performances
                                groupedIds[liveKey].add(id);
                            }
                        });
                    }
                });
            }
        });

        // Convert Sets to arrays for JSON output
        const finalData = {};
        Object.keys(groupedIds).forEach(lang => {
            const idsList = Array.from(groupedIds[lang]);
            finalData[lang] = idsList;
            console.log(`  ${lang}: ${idsList.length} IDs`);
            totalIds += idsList.length;
        });

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
        console.log(`\nSuccessfully saved ${totalIds} YouTube IDs to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error during extraction:', error);
        process.exit(1);
    }
}

extractYoutubeIds();
