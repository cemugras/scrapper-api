const express = require('express');
const CityList = require('../data/CityList');

const app = express();
const port = process.env.PORT || 3000;

const {fromEnv} = require("@aws-sdk/credential-providers");
const {DynamoDBClient, QueryCommand} = require('@aws-sdk/client-dynamodb');
const dynamoDBClient = new DynamoDBClient({
    region: "eu-north-1",
    credentials: fromEnv(),
});
const tableName = 'weather_turkey';

app.get('/api/weather/getWeather', async (req, res) => {
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
        res.status(200).json({result});
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({error: 'Internal server error.'});
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});