const defaults = {
    discord: { name: "discord", alt: "💬" },
    quest: { name: "quest", alt: "🗺️" },
    "5": { name: "nitro_level_stone", alt: "💎" },
    "3": { name: "discord", alt: "🎉" },
    "4": { name: "orbIcon", alt: "🧊" },
};
module.exports = (client, returnNull = false) => {
    return Object.fromEntries(Object.entries(defaults).map(([key, { name, alt }]) => [
        key,
        client.getEmoji(name.toLowerCase().trim(), false) ?? (returnNull ? null : alt)
    ]));
};
