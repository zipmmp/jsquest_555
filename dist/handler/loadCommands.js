const { findClosestIndexFolder } = require('../utils/tools.js');
const { loadFolder } = require('./folderLoader.js');
const path = require('path');
const fs = require('fs');
const { Logger } = require('../core/logger.js');
/**
 * Load all commands, buttons, menus, message commands, and events
 * @param {CustomClient} client
 */
export async function loadCommands(client) {
    const rootDir = findClosestIndexFolder();
    const slashCommandPath = path.join(rootDir, "slashCommands");
    const messageCommandsPath = path.join(rootDir, "commands");
    const eventsPath = path.join(rootDir, "events");
    const buttonsPath = path.join(rootDir, "buttons");
    const selectMenusPath = path.join(rootDir, "menu");
    const tasks = [];
    // Slash commands
    if (fs.existsSync(slashCommandPath)) {
        tasks.push(loadFolder(slashCommandPath, { logger: false, shouldReturn: true, subFolders: true }).then((commands) => {
            for (const Command of commands) {
                if (typeof Command === "function") {
                    const cmd = new Command();
                    const name = cmd.getName();
                    Logger.info(`Loaded slash command: ${name}`);
                    client.slashCommands.set(name, cmd);
                }
            }
        }));
    }
    else {
        Logger.error(`Slash commands folder not found at ${slashCommandPath}`);
    }
    // Button commands
    if (fs.existsSync(buttonsPath)) {
        tasks.push(loadFolder(buttonsPath, { logger: false, shouldReturn: true, subFolders: true }).then((commands) => {
            for (const Command of commands) {
                if (typeof Command === "function") {
                    const cmd = new Command();
                    const name = cmd.getName();
                    Logger.info(`Loaded button command: ${name}`);
                    client.buttons.set(name, cmd);
                }
            }
        }));
    }
    // Select menu commands
    if (fs.existsSync(selectMenusPath)) {
        tasks.push(loadFolder(selectMenusPath, { logger: false, shouldReturn: true, subFolders: true }).then((menus) => {
            for (const Menu of menus) {
                if (typeof Menu === "function") {
                    const cmd = new Menu();
                    const name = cmd.getName();
                    Logger.info(`Loaded menu command: ${name}`);
                    client.menus.set(name, cmd);
                }
            }
        }));
    }
    else {
        Logger.error(`Select menus folder not found at ${selectMenusPath}`);
    }
    // Message commands
    if (fs.existsSync(messageCommandsPath)) {
        tasks.push(loadFolder(messageCommandsPath, { logger: false, shouldReturn: true, subFolders: true }).then((commands) => {
            for (const Command of commands) {
                if (typeof Command === "function") {
                    const cmd = new Command();
                    Logger.info(`Loaded message command: ${cmd.name}`);
                    client.messageCommands.set(cmd.name, cmd);
                }
            }
        }));
    }
    else {
        Logger.error(`Message commands folder not found at ${messageCommandsPath}`);
    }
    // Events
    if (fs.existsSync(eventsPath)) {
        tasks.push(loadFolder(eventsPath, { logger: false, shouldReturn: true, subFolders: true }).then((events) => {
            for (const EventClass of events) {
                if (typeof EventClass === "function") {
                    const instance = new EventClass(client);
                    if (instance.once) {
                        client.once(instance.name, (...args) => instance.executeEvent(...args));
                    }
                    else {
                        client.on(instance.name, (...args) => instance.executeEvent(...args));
                    }
                    Logger.info(`Loaded event: ${instance.name}`);
                }
                else {
                    Logger.error(`Invalid event class or missing executeEvent`);
                }
            }
        }));
    }
    else {
        Logger.error(`Events folder not found at ${eventsPath}`);
    }
    await Promise.all(tasks);
}
