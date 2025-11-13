const { Collection } = require('discord.js');
const { loadQuests, sendToProcess } = require('./tools.js');
const { getIdFromToken } = require('../utils/quest/tokenUtils.js');
const { ChildUser } = require('./childUser.js');
const questsConfigs = new Collection();
const clients = new Collection();
// --- Error Handlers ---
process.on("uncaughtException", (err) => {
    console.error(`[Worker ${process.pid}] Uncaught Exception:`, err);
    process.send?.({
        type: "ERROR",
        error: `Uncaught Exception: ${err.message}`,
        stack: err.stack,
    });
});
process.on("unhandledRejection", (reason, promise) => {
    console.error(`[Worker ${process.pid}] Unhandled Rejection at:`, promise, "reason:", reason);
    process.send?.({
        type: "ERROR",
        error: `Unhandled Rejection: ${String(reason)}`,
    });
});
const addClient = (client) => {
    clients.set(client.id, client);
    sendToProcess({
        type: "process_update",
        count: clients.size
    });
};
const removeClient = (client) => {
    clients.delete(client.id);
    sendToProcess({
        type: "process_update",
        count: clients.size,
    });
};
// Async bootstrap
(async () => {
    await loadQuests(questsConfigs);
    console.log(`[Worker ${process.pid}] Quests loaded, ready for tasks.`);
    // Notify parent that worker is ready
    sendToProcess({
        type: "ready",
    });
    // Handle messages from parent
    process.on("message", async (msg) => {
        try {
            if (!msg || !msg.type)
                return;
            switch (msg.type) {
                case "start": {
                    const { type, data } = msg;
                    const { token, method, questId, proxy, current, target } = data;
                    const userId = getIdFromToken(data.token);
                    if (clients.has(userId)) {
                        console.warn(`[Worker ${process.pid}] User ${userId} is already being processed.`);
                        return;
                    }
                    const questConfig = questsConfigs.get(data.method);
                    if (!questConfig) {
                        console.error(`[Worker ${process.pid}] Quest ${data.method} not found.`);
                        sendToProcess?.({
                            type: "ERROR",
                            error: `Quest ${data.method} not found.`,
                        });
                        return;
                    }
                    const client = new ChildUser(token, proxy, questId, questConfig, current, target);
                    addClient(client);
                    client.start();
                    break;
                }
                case "kill": {
                    const { target } = msg;
                    if (!target)
                        return;
                    const user = clients.get(target);
                    if (user) {
                        user.stop();
                        removeClient(user);
                        console.log(`[Worker ${process.pid}] Stopped processing user ${target}.`);
                    }
                    else {
                        console.warn(`[Worker ${process.pid}] No active process found for user ${target}.`);
                    }
                    break;
                }
            }
        }
        catch (err) {
            console.error(`[Worker ${process.pid}] Error while handling message:`, err);
            sendToProcess?.({
                type: "ERROR",
                error: err.message ?? String(err),
            });
        }
    });
    // Prevent the process from exiting when idle
    setInterval(() => { }, 1 << 30);
})();
