const { EntitySchema } = require('typeorm');
const ImageEntity = new EntitySchema({
    name: "images",
    columns: {
        id: { type: Number, primary: true, generated: true },
        createdAt: { type: Date, createDate: true },
        updatedAt: { type: Date, updateDate: true },
        key: {
            type: String,
        },
        url: {
            type: String,
        },
        name: {
            type: String,
        },
        expireTimestamp: {
            type: "bigint",
        },
        messageId: {
            type: String,
        },
        channelId: {
            type: String,
        },
        guildId: {
            type: String,
        },
    },
});
module.exports = ImageEntity;
