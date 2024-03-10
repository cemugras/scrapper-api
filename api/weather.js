const express = require('express');
const puppeteer = require('puppeteer');
const CityList = require('./CityList');
const cron = require('node-cron');

const app = express();
const port = 3000;

const {fromEnv} = require("@aws-sdk/credential-providers");
const {DynamoDBClient, PutItemCommand, QueryCommand} = require('@aws-sdk/client-dynamodb');
const dynamoDBClient = new DynamoDBClient({
    region: "eu-north-1",
    credentials: fromEnv(),
});
const tableName = 'weather_turkey';

app.get('/api/weather', async (req, res) => {
    try {
        const requestedCity = req.query.city;

        const cityModel = CityList.find(city => city.cityName === requestedCity);

        const queryItemCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'CityID = :cityId',
            ExpressionAttributeValues: {
                ':cityId': {N: cityModel.cityID.toString()},
            },
        });
        const response = await dynamoDBClient.send(queryItemCommand);
        const queryItems = response.Items;

        const result = {
            cityName: queryItems[0].CityName.S,
            cityID: queryItems[0].CityID.N,
            date: queryItems[0].currentDate.S,
            weather: queryItems[0].currentWeather.S,
            weatherUrl: queryItems[0].currentWeatherIconUrl.S,
            temperatureSign: queryItems[0].temperatureSign.S,
            humidity: queryItems[0].humidity.S
        }
        res.json({
            result
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({error: 'Internal server error.'});
    }
});

cron.schedule('*/10 * * * *', async () => {
    try {

        for (const city of CityList) {
            const cityName = city.cityName;
            const data = await getDataFromHtml('https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=' + cityName, 3);

            const date = new Date();
            const options = { day: 'numeric', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'shortOffset' };
            const turkishDate = new Intl.DateTimeFormat('tr-TR', options).format(date);

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
                console.log("[PutDynamo] Item inserted :: City=" + cityName);
                console.log("--------------------");
            })

        }
    } catch (error) {
        console.error('[scheduler] Error:', error.message);
    }
})

async function getDataFromHtml(url, maxRetries) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let retries = 0;
    let weatherData = {};

    while (retries < maxRetries) {
        try {
            await page.goto(url, { waitUntil: 'load' });

            // Wait for page selector data loading
            //await page.waitForSelector('#pages > div > section > div.anlik-durum > div.anlik-sicaklik > div.anlik-sicaklik-deger.ng-binding');
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

            console.log("currentWeatherIconUrl:", currentWeatherIconUrl);
            currentWeatherIconUrl = currentWeatherIconUrl.replace("..", "https://www.mgm.gov.tr");
            weatherData.currentWeatherIconUrl = currentWeatherIconUrl;
            weatherData.humidity = humidityValue;

            return weatherData;
        }catch (error) {
            console.error(`Retry ${retries + 1}/${maxRetries}. Error: ${error.message}`);
        }
    }
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});