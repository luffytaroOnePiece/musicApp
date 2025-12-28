import fs from 'fs';
import path from 'path';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAYLISTS_FILE = path.join(__dirname, '../src/data/plyalists.json');
const LIVE_DATA_FILE = path.join(__dirname, '../src/data/live.json');

async function fetchPlaylists() {
    try {
        if (!fs.existsSync(PLAYLISTS_FILE)) {
            console.error(`Playlists file not found at ${PLAYLISTS_FILE}`);
            process.exit(1);
        }

        const playlistsRaw = fs.readFileSync(PLAYLISTS_FILE, 'utf-8');
        const playlists = JSON.parse(playlistsRaw);

        const allVideos = [];

        for (const [key, url] of Object.entries(playlists)) {
            console.log(`Fetching videos for category: ${key} from ${url}`);

            try {
                // Determine playlist ID from URL
                const playlistId = url.split('list=')[1]?.split('&')[0];
                if (!playlistId) {
                    console.warn(`Invalid playlist URL for ${key}: ${url}`);
                    continue;
                }

                const playlist = await ytpl(playlistId, { limit: Infinity });

                // Process videos sequentially to avoid rate limiting or issues
                const videos = [];
                for (const item of playlist.items) {
                    try {
                        const info = await ytdl.getBasicInfo(item.id);
                        const publishDate = info.videoDetails.publishDate;

                        videos.push({
                            youtubeLinkID: item.id,
                            title: item.title,
                            type: key.charAt(0).toUpperCase() + key.slice(1),
                            date: publishDate
                        });
                        process.stdout.write('.');
                    } catch (e) {
                        console.warn(`\nFailed to get details for ${item.title}: ${e.message}`);
                        // Fallback without date
                        videos.push({
                            youtubeLinkID: item.id,
                            title: item.title,
                            type: key.charAt(0).toUpperCase() + key.slice(1),
                            date: ""
                        });
                    }
                }
                console.log(`\nFound ${videos.length} videos for ${key}`);
                allVideos.push(...videos);

            } catch (err) {
                console.error(`Error fetching playlist ${key}:`, err.message);
            }
        }

        const outputData = {
            live: allVideos
        };

        fs.writeFileSync(LIVE_DATA_FILE, JSON.stringify(outputData, null, 2));
        console.log(`Successfully updated ${LIVE_DATA_FILE} with ${allVideos.length} videos.`);

    } catch (err) {
        console.error("An error occurred:", err);
    }
}

fetchPlaylists();
