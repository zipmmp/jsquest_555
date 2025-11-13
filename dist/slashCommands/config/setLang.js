const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { SlashCommand } = require('../../lib/quest/handler/slashCommand.js');
const GuildDocument = require('../../entities/guildSettings.js');
const { i18n as mainI18n } = require('../../providers/i18n.js');
const { EmbedBuilder } = require('../../lib/quest/handler/embedBuilder.js');
const { userSettingsRepo } = require('../../core/cache.js');

module.exports = class setLang extends SlashCommand {
    constructor() {
        super(...arguments);
        this.name = "setlang";
        this.description = "Set the language for the bot";
        this.options = [];
        this.cooldown = "1m";
        this.allowedRoles = [];
        this.allowedServers = [];
        this.allowedUsers = [];
        this.allowedChannels = [];
        this.permissions = ["Administrator"];
        this.bot_permissions = [];
        this.flags = ["onlyGuild", "ephemeral", "onlyDm"];
    }

    buildLangMenu(i18n, lang, interactionId) {
        const langs = mainI18n.getAvailableLanguages();
        const langMenu = new StringSelectMenuBuilder()
            .setCustomId(`langSelect_${interactionId}`)
            .setMaxValues(1)
            .setMinValues(1)
            .setPlaceholder(i18n.t("setlang.selectLangPlaceholder"));

        langs.forEach(language => {
            langMenu.addOptions({
                label: language.name,
                value: language.lang,
                default: lang === language.short,
                emoji: language.flag ? { name: language.flag } : undefined,
            });
        });

        return new ActionRowBuilder().addComponents(langMenu);
    }

    async awaitLangSelection(interaction) {
        const filter = i => i.customId.startsWith("langSelect_") && i.user.id === interaction.user.id;
        return (await interaction.channel
            ?.awaitMessageComponent({ filter, time: this.client.clientMs("60s") })
            .catch(() => null));
    }

    async updateLangSetting(interaction, i18n, selectedLang) {
        const updatedI18n = mainI18n.get(selectedLang);
        await interaction.editReply({
            embeds: [new EmbedBuilder().setDescription(updatedI18n.t("setlang.langSetMessage"))],
            components: [],
        });
        return updatedI18n;
    }

    async execute({ interaction, client, i18n, lang }) {
        const isDM = interaction.channel?.isDMBased();

        if (isDM) {
            // Handle user settings
            const user = interaction.user;
            let userDoc = client.userSettings.get(user.id) ??
                (await userSettingsRepo.findOne({ where: { userId: user.id } }));
            if (!userDoc) {
                userDoc = userSettingsRepo.create({ userId: user.id });
                await userSettingsRepo.save(userDoc);
            }
            client.userSettings.tempSet(user.id, userDoc, client.clientMs("30m"));

            const langMenu = this.buildLangMenu(i18n, lang, interaction.id);
            await interaction.editReply({ components: [langMenu] });

            const collected = await this.awaitLangSelection(interaction);
            if (!collected) {
                return interaction.editReply({
                    components: [new ActionRowBuilder().addComponents(langMenu.components[0].setDisabled(true))],
                });
            }

            collected.deferUpdate();
            const selectedLang = collected.values[0];
            userDoc.lang = selectedLang;
            await userSettingsRepo.save(userDoc);
            await this.updateLangSetting(interaction, i18n, selectedLang);
        } else {
            // Handle guild settings
            const guild = interaction.guild;
            const repo = this.appDataSource.getRepo(GuildDocument);

            let guildDoc = client.guildSettings.get(guild.id);
            if (!guildDoc) {
                guildDoc =
                    (await repo.findOneBy({ guildId: guild.id })) ?? repo.create({ guildId: guild.id });
                await repo.save(guildDoc);
                client.guildSettings.set(guild.id, guildDoc);
            }

            const langMenu = this.buildLangMenu(i18n, lang, interaction.id);
            await interaction.editReply({ components: [langMenu] });

            const collected = await this.awaitLangSelection(interaction);
            if (!collected) {
                return interaction.editReply({
                    components: [new ActionRowBuilder().addComponents(langMenu.components[0].setDisabled(true))],
                });
            }

            collected.deferUpdate();
            const selectedLang = collected.values[0];
            guildDoc.lang = selectedLang;
            await repo.save(guildDoc);
            client.guildSettings.set(guild.id, guildDoc);
            await this.updateLangSetting(interaction, i18n, selectedLang);
        }
    }
}
