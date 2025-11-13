const { SupportedDatabaseTypes } = require('../core/databaseConfig.js');
const config = {
    token: "",
    embedColor: "#06c2fb",
    defaultLanguage: "en",
    debugMode: true,
    prefix: "!",
    developers: ["527826654660132890"],
    database: {
        type: SupportedDatabaseTypes.Sqlite,
        path: "./database.sqlite",
    },
};
module.exports = config;
