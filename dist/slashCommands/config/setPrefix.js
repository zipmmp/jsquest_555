const { SlashCommandStringOption } = require('discord.js');
const { SlashCommand } = require('../../lib/quest/handler/slashCommand.js');
const GuildDocument = require('../../entities/guildSettings.js');
const { EmbedBuilder } = require('../../lib/quest/handler/embedBuilder.js');

module.exports = class setprefix extends SlashCommand {
    constructor() {
        super(...arguments);
        this.name = "setprefix";
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
        const guild = interaction.guild;
        const GuildDocumentRepo = this.appDataSource.getRepo(GuildDocument);

        // جلب إعدادات السيرفر أو إنشائها إذا لم توجد
        let guildSettings = client.guildSettings.get(guild.id);
        if (!guildSettings) {
            let doc = await GuildDocumentRepo.findOneBy({ guildId: guild.id }) 
                      ?? GuildDocumentRepo.create({ guildId: guild.id });
            await GuildDocumentRepo.save(doc);
            client.guildSettings.set(guild.id, doc);
            guildSettings = client.guildSettings.get(guild.id);
        }

        // تحديث البريفكس
        const newPrefix = interaction.options.getString("prefix");
        guildSettings.prefix = newPrefix;
        await GuildDocumentRepo.save(guildSettings);
        client.guildSettings.set(guild.id, guildSettings);

        // إرسال رسالة تأكيدية
        const embed = new EmbedBuilder().setDescription(i18n.t("setprefix.prefixSetMessage", { prefix: newPrefix }));
        await interaction.editReply({ embeds: [embed] });
    }
}
