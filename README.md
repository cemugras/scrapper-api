# weather.cemugras.com

This project was generated with [Node.js](https://nodejs.org/en) version 18.17.1.

| Package   | Version     |
|-----------|-------------|
| express   | 4.18.2      |
| Puppeteer | 22.3.0      |

- For express version -> `npm show express version`
- For axios version -> `npm show puppeteer version`

The project is on live with the following endpoint:

## Development server

- `node weather.js` or `nodemon index.js` or `npm start` for dev server. Navigate to `http:,//localhost:3000/`.
- The application will automatically reload if you change any of the source files.

## Code scaffolding

- `npm init -y` to generate a new project in existing module.
- `npm install express` -> required framework.
- `npm install puppeteer` -> nodejs client.
- `npm install -g nodemon` -> tool for updating code changes automaticly without restart server.

## Used Techs

1) #### [express.js](https://expressjs.com/) Development Notes  |
    - Express is web server framework.
    - It provides middleware support also.
2) #### [puppeteer](https://pptr.dev/) Development Notes  |
    - Puppeteer provides HTTP client.
    - It provides html data parser with waiting for all parameters.

## Known Issues
`npm audit fix` -> 1 moderate severity vulnerability

`npm audit fix --force` -> if above command not works

`npm install --legacy-peer-deps` -> upstream dependency conflict

## Deployment

## Fixes For Deployment

## Features Inprogress
- [ ] Weather Api for General Purposes
- [ ] Weather Api Query Feature with Cities and Districts