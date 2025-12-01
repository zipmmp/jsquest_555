const { ChatInputCommandInteraction, SlashCommandStringOption } = require("discord.js");
const { SlashCommand, slashCommandFlags } = require("../../lib/handler/slashCommand.js");
const { CustomClient } = require("../../core/customClient.js");
const { permissionList } = require("../../lib/handler/messageCommand.js");
const { I18nInstance } = require("../../core/i18n.js");

class setprefix extends SlashCommand {
    constructor() {
        super();
        this.name = "test";
        this.description = "Set the prefix for the bot in this server";
        this.options = [
            new SlashCommandStringOption()
                .setName("prefix")
                .setDescription("The new prefix for the bot")
                .setMaxLength(2)
                .setMinLength(1)
                .setRequired(true)
        ];
        this.cooldown = "1m";
        this.allowedRoles = [];
        this.allowedServers = [];
        this.allowedUsers = [];
        this.allowedChannels = [];
        this.permissions = ["Administrator"];
        this.bot_permissions = [];
        this.flags = ["onlyGuild", "ephemeral"];
    }

    async execute({ interaction, client, i18n, lang }) {
        await interaction.deferReply({ ephemeral: true });

        const message = await interaction.channel.send("Test command executed!");

        await interaction.followUp({ 
            content: "Attempting to crosspost the message...", 
            ephemeral: true 
        });
    }
}

module.exports = setprefix;
