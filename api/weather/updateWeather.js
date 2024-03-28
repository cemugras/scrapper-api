const express = require('express');
const axios = require('axios');
const CityList = require("../data/CityList");

const app = express();
const port = process.env.PORT || 3002;

const {PutItemCommand, DynamoDBClient} = require("@aws-sdk/client-dynamodb");

const {fromEnv} = require("@aws-sdk/credential-providers");

const dynamoDBClient = new DynamoDBClient({
    region: "eu-north-1",
    credentials: fromEnv(),
});

const tableName = 'weather_turkey';

const dateOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Istanbul' // Zaman dilimi gerekirse buraya uygun bir değer girilebilir
};

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
            while (retries < 3 && !fetched) {
                retries++;
                console.log("[updateWeather] CityID="+city.cityID, "CityName="+city.cityName, "Retry="+retries);
                await axios.post(apiUrl, requestBody)
                    .then(response => {
                        const data = response.data.dal.getSunV3CurrentObservationsUrlConfig['geocode:'+geocode+';units:m'].data;
                        const temperature = data.temperature;
                        const temperatureMax24Hour = data.temperatureMax24Hour;
                        const temperatureMin24Hour = data.temperatureMin24Hour;
                        const humidity = data.relativeHumidity;
                        const weatherType = data.cloudCoverPhrase;
                        const weatherDate = new Date(data.validTimeLocal).toLocaleString('tr-TR', dateOptions);
                        const insertDate = new Date().toLocaleString('tr-TR', dateOptions);
                        console.log('[updateWeather] temperature:'+ temperature + ', max24Hour:' + temperatureMax24Hour + ', min24Hour:' + temperatureMin24Hour);
                        console.log('[updateWeather] humidity:', humidity);
                        console.log('[updateWeather] weatherDate:', weatherDate);
                        console.log('[updateWeather] insertDate:', insertDate);
                        if(temperature && humidity && weatherDate) {
                            fetched = true;

                            const putItemCommand = new PutItemCommand({
                                TableName: tableName,
                                Item: {
                                    CityID: {N: city.cityID.toString()},
                                    CityName: {S: city.cityName.toString()},
                                    currentWeather: {S: temperature.toString()},
                                    weatherDate: {S: weatherDate.toString()},
                                    weatherMax24Hour: {S: temperatureMax24Hour.toString()},
                                    weatherMin24Hour: {S: temperatureMin24Hour.toString()},
                                    weatherType: {S: weatherType.toString()},
                                    //currentWeatherIconUrl: {S: data.currentWeatherIconUrl},
                                    humidity: {S: humidity.toString()},
                                    insertDate: {S: insertDate.toString()}
                                },
                            });

                            dynamoDBClient.send(putItemCommand).then(response => {
                                console.log("[cron] Item inserted :: City=" + city.cityName + " CityID=" + city.cityID);
                                console.log('[updateWeather] .............');
                            })
                        }
                    })
                    .catch(error => {
                        console.error('[updateWeather] Error:', error.message);
                    });
                if(fetched) {
                    break;
                }
            }

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