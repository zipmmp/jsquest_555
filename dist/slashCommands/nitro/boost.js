const {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    InteractionReplyOptions,
    SlashCommandUserOption,
    StringSelectMenuBuilder,
    User
} = require("discord.js");

const { SlashCommand } = require("../../lib/handler/slashCommand.js");
const { CustomClient } = require("../../core/customClient.js");
const { permissionList } = require("../../lib/handler/messageCommand.js");
const { I18nInstance } = require("../../core/i18n.js");
const questsConfig = require("../../config/questsConfig.js");
const { selfUser } = require("../../events/quest/newQuests.js");
const moment = require("moment-timezone");
const { capitalizeWords, disableComponents, formatDiscordTimestamp } = require("../../utils/tools.js");
const { client } = require("../../index.js");
const ms = require("ms");

const levels = [
    { level: 1, months: 0, emoji: "boost_level_1" },
    { level: 2, months: 2, emoji: "boost_level_2" },
    { level: 3, months: 3, emoji: "boost_level_3" },
    { level: 4, months: 6, emoji: "boost_level_4" },
    { level: 5, months: 9, emoji: "boost_level_5" },
    { level: 6, months: 12, emoji: "boost_level_6" },
    { level: 7, months: 15, emoji: "boost_level_7" },
    { level: 8, months: 18, emoji: "boost_level_8" },
    { level: 9, months: 24, emoji: "boost_level_9" }
];

module.exports = class setLang extends SlashCommand {

    constructor() {
        super();
        this.name = "boost";
        this.description = "Show the boost level calculator";
        this.options = [
            new SlashCommandUserOption().setRequired(false).setName("member").setDescription("account")
        ];
        this.cooldown = "1m";
        this.allowedRoles = [];
        this.allowedServers = [];
        this.allowedUsers = [];
        this.allowedChannels = [];
        this.permissions = [];
        this.bot_permissions = [];
        this.flags = ["ephemeral", "onlyDm", "onlyGuild"];
    }

    async execute({ interaction, client, i18n }) {

        if (!selfUser) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(i18n.t("boost.botNotReady")).setColor("DarkRed")
                ]
            });
        }

        const guild = questsConfig.serverId.includes(interaction.guildId)
            ? interaction.guild
            : client.guilds.cache.get(questsConfig.serverId);

        const user = (guild && (interaction.options.getUser("member") || interaction.user)) || null;

        const member =
            user && (await guild.members.fetch(user.id).catch(() => null));

        if (!member)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(i18n.t("boost.memberNotFound")).setColor("DarkRed")
                ]
            });

        const userProfile = (
            await selfUser.api.get(`users/${member.user.id}/profile`).catch(() => null)
        )?.data;

        if (!userProfile)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(i18n.t("boost.userProfileNotFound")).setColor("DarkRed")
                ]
            });

        if (!userProfile?.premium_guild_since)
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(i18n.t("boost.noActiveBoost")).setColor("DarkRed")
                ]
            });

        const boostDate = moment(userProfile.premium_guild_since).toDate();
        const color = "#BE7AB7";

        let commandConfig = { targetLevel: -1 };

        const message = await interaction.editReply({
            ...genratePayLoad(i18n, boostDate, user, commandConfig.targetLevel, color)
        });

        if (message.components[0].components[0].disabled) return;

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: ms("5m")
        });

        collector.on("collect", async (i) => {
            if (!i.isStringSelectMenu()) return;

            const selected = i.values[0];
            commandConfig.targetLevel = parseInt(selected);

            await i.update({
                ...genratePayLoad(i18n, boostDate, user, commandConfig.targetLevel, color)
            });
        });

        collector.on("end", async () => {
            const reply = await interaction.fetchReply().catch(() => null);
            if (!reply) return;

            interaction.editReply({
                components: disableComponents(reply.components)
            }).catch(() => null);
        });
    }
};

function genratePayLoad(i18n, boostDate, author, targetLevelNumber, color) {

    const months = moment().diff(boostDate, "months");
    const sortedDesc = [...levels].sort((a, b) => b.months - a.months);

    const boostLevel = sortedDesc.find((l) => l.months <= months);
    const nextLevel = [...levels].sort((a, b) => a.months - b.months).find((l) => l.months > months);
    const targetLevel =
        targetLevelNumber !== -1
            ? levels.find((l) => l.level === targetLevelNumber)
            : nextLevel;

    const higherBoostLevels = levels
        .filter((l) => l.level > boostLevel.level)
        .sort((a, b) => a.months - b.months);

    const menu = new StringSelectMenuBuilder()
        .setMaxValues(1)
        .setMinValues(1)
        .setCustomId("boost_level")
        .setPlaceholder(i18n.t("boost.selectBoostLevel"));

    if (higherBoostLevels.length > 0) {
        for (const level of higherBoostLevels) {
            menu.addOptions({
                label: `${level.months} ${capitalizeWords(i18n.t("months"))}`,
                emoji: client.getEmoji(level.emoji, false) || "⭐",
                value: level.level.toString(),
                default: level.level === targetLevel?.level,
                description: i18n.t("boost.boostLevelAfter", {
                    level: level.level,
                    months: level.months
                })
            });
        }
    } else {
        menu.addOptions({
            label: i18n.t("boost.maxLevel"),
            emoji: client.getEmoji(boostLevel.emoji, false) || "⭐",
            value: boostLevel.level.toString(),
            default: true,
            description: i18n.t("boost.noMoreLevels")
        });
        menu.setDisabled(true);
    }

    const currentLevel = {
        emoji: client.getEmoji(boostLevel.emoji, false) || "⭐",
        level: boostLevel.level,
        months: boostLevel.months
    };

    const nextLevelData = nextLevel
        ? {
              emoji: client.getEmoji(nextLevel.emoji, false) || "⭐",
              level: nextLevel.level,
              months: nextLevel.months,
              nextLevelDate: moment(boostDate)
                  .add(nextLevel.months, "months")
                  .toDate()
          }
        : null;

    const targetLevelData = targetLevel
        ? {
              emoji: client.getEmoji(targetLevel.emoji, false) || "⭐",
              level: targetLevel.level,
              months: targetLevel.months,
              targetLevelDate: moment(boostDate)
                  .add(targetLevel.months, "months")
                  .toDate()
          }
        : null;

    let desc = ``;

    desc += `- **${i18n.t("boost.+")} ${currentLevel.level}** ${currentLevel.emoji}\n`;
    desc += `-# - ${i18n.t("boost.boostLevel")} ${formatDiscordTimestamp(boostDate.getTime(), "Date")}\n`;
    desc += `-# - ${i18n.t("boost.boostingStreak")}: \`${months}\` Months\n\n`;

    if (nextLevel) {
        desc += `- **${i18n.t("boost.nextLevel")} ${nextLevelData.level}** ${nextLevelData.emoji}\n`;
        desc += `-# - ${i18n.t("boost.nextLevelDate")} ${formatDiscordTimestamp(nextLevelData.nextLevelDate.getTime(), "Date")}\n`;
        desc += `-# - ${i18n.t("boost.nextLevelIn")}: ${formatDiscordTimestamp(nextLevelData.nextLevelDate.getTime(), "R")}\n\n`;

        if (nextLevel.level !== targetLevel.level) {
            desc += `- **${i18n.t("boost.targetLevel")} ${targetLevelData.level}** ${targetLevelData.emoji}\n`;
            desc += `-# - ${i18n.t("boost.targetLevelDate")} ${formatDiscordTimestamp(targetLevelData.targetLevelDate.getTime(), "Date")}\n`;
            desc += `-# - ${i18n.t("boost.TargetLevelIn")}: ${formatDiscordTimestamp(targetLevelData.targetLevelDate.getTime(), "R")}\n\n`;
        }
    } else {
        desc += `- **${i18n.t("boost.reachedMaxBoost")}** ${currentLevel.emoji}\n\n`;
    }

    desc += `-# - **${i18n.t("boost.developed")}**\n`;

    const embed = new EmbedBuilder()
        .setDescription(desc)
        .setThumbnail(author.displayAvatarURL())
        .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
        .setColor(color)
        .setFooter({
            text: i18n.t("boost.boostLevelCalculator"),
            iconURL: client.user.avatarURL() || undefined
        })
        .setImage("https://k.top4top.io/p_3343xcnvn1.png");

    return {
        components: [new ActionRowBuilder().addComponents(menu)],
        embeds: [embed]
    };
}
