const fetch = require('node-fetch');

async function callCron() {
    try {
        const response = await fetch('https://cemugras-api.vercel.app/api/weather/cron');
        return await response.json();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

callCron()
    .then((result) => {
        console.log('Promise resolved with result:', result);
    })
    .catch((error) => {
        console.error('Promise rejected with error:', error);
    });