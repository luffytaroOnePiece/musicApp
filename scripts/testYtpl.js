import ytpl from 'ytpl';

async function testFetch() {
    try {
        const playlistId = 'PLk-aMlMwXfRzKZUtiE0WHoMAig5GxZ63q';
        const playlist = await ytpl(playlistId, { limit: 1 });
        console.log(JSON.stringify(playlist.items[0], null, 2));
    } catch (err) {
        console.error(err);
    }
}

testFetch();
