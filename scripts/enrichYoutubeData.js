import fs from 'fs';
import path from 'path';
import ytdl from 'ytdl-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const IDS_FILE = path.join(__dirname, '../src/data/youtubeIdsByLanguage.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/youtubeMixData.json');

// Delay between requests to avoid rate limiting
const DELAY_MS = 500;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function enrichYoutubeData() {
    try {
        console.log('Starting YouTube metadata enrichment...\n');

        // Load extracted IDs
        if (!fs.existsSync(IDS_FILE)) {
            console.error(`Error: IDs file not found at ${IDS_FILE}`);
            console.log('Please run "npm run extract-ids" first.');
            process.exit(1);
        }

        const idsData = JSON.parse(fs.readFileSync(IDS_FILE, 'utf-8'));

        // Load existing enriched data (if any)
        let existingData = { videos: [] };
        const existingIdSet = new Set();

        if (fs.existsSync(OUTPUT_FILE)) {
            try {
                existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
                if (existingData.videos && Array.isArray(existingData.videos)) {
                    existingData.videos.forEach(v => existingIdSet.add(v.youtubeLinkID));
                    console.log(`Found ${existingIdSet.size} existing videos in cache.\n`);
                }
            } catch (e) {
                console.warn('Could not parse existing data, starting fresh.');
                existingData = { videos: [] };
            }
        }

        // Flatten all IDs with their language
        const allItems = [];
        Object.entries(idsData).forEach(([language, ids]) => {
            if (Array.isArray(ids)) {
                ids.forEach(id => {
                    if (!existingIdSet.has(id)) {
                        allItems.push({ id, language });
                    }
                });
            }
        });

        console.log(`Total new IDs to fetch: ${allItems.length}\n`);

        if (allItems.length === 0) {
            console.log('All videos are already cached. Nothing to fetch.');
            process.exit(0);
        }

        const newVideos = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < allItems.length; i++) {
            const { id, language } = allItems[i];
            const progress = `[${i + 1}/${allItems.length}]`;

            try {
                const info = await ytdl.getBasicInfo(id);
                const videoDetails = info.videoDetails;

                newVideos.push({
                    youtubeLinkID: id,
                    title: videoDetails.title || 'Unknown Title',
                    type: language,
                    date: videoDetails.publishDate || '',
                    author: videoDetails.author?.name || '',
                    lengthSeconds: parseInt(videoDetails.lengthSeconds) || 0
                });

                successCount++;
                process.stdout.write(`${progress} ✓ ${videoDetails.title?.substring(0, 50)}...\n`);

            } catch (error) {
                errorCount++;
                // Still add the video with minimal info so we don't retry it
                newVideos.push({
                    youtubeLinkID: id,
                    title: `Video ${id}`,
                    type: language,
                    date: '',
                    author: '',
                    lengthSeconds: 0,
                    error: true
                });
                console.log(`${progress} ✗ Failed to fetch ${id}: ${error.message}`);
            }

            // Delay to avoid rate limiting
            await sleep(DELAY_MS);
        }

        // Combine existing and new videos
        const allVideos = [...existingData.videos, ...newVideos];

        // Save to file
        const outputData = {
            lastUpdated: new Date().toISOString(),
            totalVideos: allVideos.length,
            videos: allVideos
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));

        console.log(`\n========================================`);
        console.log(`Enrichment complete!`);
        console.log(`  New videos fetched: ${successCount}`);
        console.log(`  Errors: ${errorCount}`);
        console.log(`  Total videos in cache: ${allVideos.length}`);
        console.log(`  Output: ${OUTPUT_FILE}`);
        console.log(`========================================\n`);

    } catch (error) {
        console.error('Fatal error during enrichment:', error);
        process.exit(1);
    }
}

enrichYoutubeData();
