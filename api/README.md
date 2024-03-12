# weather.cemugras.com

This project was generated with [Node.js](https://nodejs.org/en) version 18.17.1.

| Package      | Version  |
|--------------|----------|
| express      | 4.18.2   |
| Puppeteer    | 22.3.0   |
| aws-sdk      | 2.1571.0 |

- For express version -> `npm show express version`
- For axios version -> `npm show puppeteer version`
- For aws-sdk version -> `npm show aws-sdk version`

The project is on live with the following endpoint:

## Development server

- `npm start` for dev server. Navigate to `http:,//localhost:3000/`.
- The application will automatically reload if you change any of the source files.

## Code scaffolding

- `npm init -y` to generate a new project in existing module.
- `npm install -g nodemon` -> tool for updating code changes automaticly without restart server.
- `npm install express` -> required framework.
- `npm install puppeteer` -> nodejs client.
- `npm install vercel@latest` -> for Vercel cronjob process.
- `npm install @aws-sdk/client-dynamodb` -> for AWS SDKv3 DynamoDB client.
- `npm install @aws-sdk/credential-providers` -> for AWS SDKv3 DynamoDB client credentials with json.

## Used Techs

1) #### [express.js](https://expressjs.com/) Development Notes  |
    - Express is web server framework.
    - It provides middleware support also.
2) #### [puppeteer](https://pptr.dev/) Development Notes  |
    - Puppeteer provides HTTP client.
    - It provides html data parser with waiting for all parameters.
3) #### [AWS DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html) Development Notes |
    - It provides NoSQL database service.

## Features Inprogress
- [x] Weather Api for General Purposes
- [x] Weather Api for General Purposes
- [x] Weather Api Query with Cities