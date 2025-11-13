const { EntitySchema } = require('typeorm');
const config = require('../config/config.js');
const GuildDocument = new EntitySchema({
    name: "GuildDocument",
    tableName: "guilds",
    columns: {
        id: { type: Number, primary: true, generated: true },
        createdAt: { type: Date, createDate: true },
        updatedAt: { type: Date, updateDate: true },
        guildId: { type: String },
        prefix: { type: String, nullable: true },
        ticketSystem: { type: Boolean, default: false },
        lang: { type: String, nullable: true, default: config.defaultLanguage },
        commands: { type: "simple-json", nullable: true }
    }
});
module.exports = GuildDocument;
