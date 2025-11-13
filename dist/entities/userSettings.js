const { EntitySchema } = require('typeorm');
const config = require('../config/config.js');
const UserDocument = new EntitySchema({
    name: "users",
    columns: {
        id: { type: Number, primary: true, generated: true },
        createdAt: { type: Date, createDate: true },
        updatedAt: { type: Date, updateDate: true },
        userId: {
            type: String,
        },
        totalSolvedQuests: {
            type: Number,
            default: 0,
        },
        banned: {
            type: "simple-json",
            nullable: true,
        },
        bannedHistory: {
            type: "simple-json",
            nullable: true,
            default: "[]",
        },
        lang: {
            type: String,
            nullable: true,
            default: config.defaultLanguage,
        },
    },
});
module.exports = UserDocument;
