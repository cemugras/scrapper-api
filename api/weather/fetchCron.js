const express = require('express');
const CityList = require("../data/CityList");

const app = express();
const port = process.env.PORT || 3001;

const {PutItemCommand, DynamoDBClient} = require("@aws-sdk/client-dynamodb");
const puppeteer = require("puppeteer");
const {fromEnv} = require("@aws-sdk/credential-providers");

const dynamoDBClient = new DynamoDBClient({
    region: "eu-north-1",
    credentials: fromEnv(),
});

const tableName = 'weather_turkey';
app.get('/api/weather/fetchCron', async (req, res) => {
    console.log("[cron] STARTED");
    try {
        res.status(200).json({result: 'Success.'});

        for (const city of CityList) {
            const cityName = city.cityName;

            const data = await getDataFromHtml('https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=' + cityName, 3);

            const date = new Date();
            const options = {
                day: 'numeric',
                month: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'shortOffset'
            };
            const turkishDate = new Intl.DateTimeFormat('tr-TR', options).format(date);

            if (city.cityID.toString() && city.cityName.toString() && data.currentWeather && data.temperatureSign && data.currentDate && data.currentWeatherIconUrl && data.humidity && turkishDate) {
                const putItemCommand = new PutItemCommand({
                    TableName: tableName,
                    Item: {
                        CityID: {N: city.cityID.toString()},
                        CityName: {S: city.cityName.toString()},
                        currentWeather: {S: data.currentWeather},
                        temperatureSign: {S: data.temperatureSign},
                        currentDate: {S: data.currentDate},
                        currentWeatherIconUrl: {S: data.currentWeatherIconUrl},
                        humidity: {S: data.humidity},
                        insertDate: {S: turkishDate}
                    },
                });

                dynamoDBClient.send(putItemCommand).then(response => {
                    console.log("[cron] Item inserted :: City=" + cityName + " CityID=" + city.cityID);
                    console.log("--------------------");
                })
            }
        }

        console.log("[cron] FINISHED");
    } catch (error) {
        console.error('[cron] Error:', error.message);
        //res.status(500).json({error: 'Internal server error.'});
    }
})

async function getDataFromHtml(url, maxRetries) {
    //const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            `--disable-setuid-sandbox`
        ]
    });
    const page = await browser.newPage();
    let retries = 0;
    let weatherData = {};

    while (retries < maxRetries) {
        retries++;
        console.log(`[cron] scrapping ${retries}/3 url:`, url);
        try {
            await page.goto(url, {waitUntil: 'load'});

            // Wait for page selector data loading
            await page.waitForSelector('#pages > div > section > div.anlik-durum > div.anlik-sicaklik > div.anlik-sicaklik-deger.ng-binding');
            await page.waitForSelector('#pages > div > section > div.anlik-durum > div.anlik-sicaklik > div.anlik-sicaklik-havadurumu > div.anlik-sicaklik-havadurumu-ikonu > img');

            // Parse required values and set to parameters
            const currentWeather = await page.$eval('div.anlik-sicaklik-deger.ng-binding', el => el.textContent.trim());
            let currentDate = await page.$eval('section > h2:nth-child(4) > span', el => el.textContent.trim());
            let currentWeatherIconUrl = await page.$eval('div.anlik-sicaklik-havadurumu-ikonu > img', (img) => img.getAttribute('src'));
            const humidityValue = await page.$eval('div.anlik-nem-deger-kac.ng-binding', el => el.textContent.trim());

            // Map response object's parameters
            weatherData.currentWeather = currentWeather;
            weatherData.temperatureSign = "C°";

            currentDate = currentDate.replace(".", ":");
            weatherData.currentDate = currentDate;

            currentWeatherIconUrl = currentWeatherIconUrl.replace("..", "https://www.mgm.gov.tr");
            weatherData.currentWeatherIconUrl = currentWeatherIconUrl;

            weatherData.humidity = humidityValue;
            break;

        } catch (error) {
            console.error(`Retry ${retries}/${maxRetries}. Error: ${error.message}`);
        }
    }

    return weatherData;
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});