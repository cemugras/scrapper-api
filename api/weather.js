const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/api/weather', async (req, res) => {
    try {
        console.log("req.params.city ", req.query.city);
        const data = await getDataFromHtml('https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=' + req.query.city);
        console.log("data", data);
        res.json({
            data
        });
    } catch (error) {
        console.error('Hata:', error.message);
        res.status(500).json({error: 'Internal server error.'});
    }
});

async function getDataFromHtml(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let weatherData = {};

    try {
        await page.goto(url);

        // Wait for page selector data loading
        await page.waitForSelector('#pages > div > section > div.anlik-durum > div.anlik-sicaklik > div.anlik-sicaklik-deger.ng-binding');

        // Parse required values and set to parameters
        const currentWeather = await page.$eval('div.anlik-sicaklik-deger.ng-binding', el => el.textContent.trim());
        const currentDate = await page.$eval('section > h2:nth-child(4) > span', el => el.textContent.trim());
        let currentWeatherIconUrl = await page.$eval('div.anlik-sicaklik-havadurumu-ikonu > img', (img) => img.getAttribute('src'));
        currentWeatherIconUrl = currentWeatherIconUrl.replace("..", "https://www.mgm.gov.tr");
        const humidityValue = await page.$eval('div.anlik-nem-deger-kac.ng-binding', el => el.textContent.trim());

        // Map response object's parameters
        weatherData.currentWeather = currentWeather;
        weatherData.temperatureSign = "C°";
        weatherData.currentDate = currentDate;
        weatherData.currentWeatherIconUrl = currentWeatherIconUrl;
        weatherData.humidity = humidityValue;

        return weatherData;
    } catch (error) {
        console.error('Error: ', error);
        return weatherData;
    } finally {
        //Commented for performance
        //await browser.close();
    }
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});