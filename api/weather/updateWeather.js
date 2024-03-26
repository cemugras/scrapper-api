const express = require('express');
const axios = require('axios');
const CityList = require("../data/CityList");
const Days = require("../data/Days");

const app = express();
const port = process.env.PORT || 3002;

const {PutItemCommand, DynamoDBClient} = require("@aws-sdk/client-dynamodb");

const {fromEnv} = require("@aws-sdk/credential-providers");

const dynamoDBClient = new DynamoDBClient({
    region: "eu-north-1",
    credentials: fromEnv(),
});

const tableName = 'weather_turkey';

app.get('/api/weather/updateWeather', async (req, res) => {
    console.log("[updateWeather] STARTED");
    try {
        res.status(200).json({result: 'Success.'});

        for (const city of CityList) {
            let fetched = false;
            const geocode = city.lat + "," + city.lon;

            const requestBody = [
                {
                    "name": "getSunV3CurrentObservationsUrlConfig",
                    "params": {
                        "geocode": geocode,
                        "units": "m"
                    }
                }
            ];
            const apiUrl = 'https://weather.com/api/v1/p/redux-dal';

            let retries = 0;
            while (retries < 3) {
                console.log("[updateWeather] CityID="+city.cityID, "CityName="+city.cityName, "Retry="+retries);
                retries++;
                await axios.post(apiUrl, requestBody)
                    .then(response => {
                        const data = response.data.dal.getSunV3CurrentObservationsUrlConfig['geocode:'+geocode+';units:m'].data;
                        const temperature = data.temperature;
                        const humidity = data.relativeHumidity;
                        const day = Days.find((day) => day.dayEng === data.dayOfWeek);
                        const weatherDate = data.validTimeLocal;

                        console.log('[updateWeather] temperature:', temperature);
                        console.log('[updateWeather] humidity:', humidity);
                        console.log('[updateWeather] day:', day);
                        console.log('[updateWeather] weatherDate:', weatherDate);
                        if(temperature && humidity && day && weatherDate) {
                            fetched = true;
                        }
                    })
                    .catch(error => {
                        console.error('[updateWeather] Error:', error.message);
                    });
                if(fetched) {
                    break;
                }
            }


            console.log('[updateWeather] .............');
            /*const date = new Date();
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
            }*/
        }

        console.log("[updateWeather] FINISHED");
    } catch (error) {
        console.error('[updateWeather] Error:', error.message);
    }
})

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});