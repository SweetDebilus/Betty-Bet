import { Client, GatewayIntentBits, ActivityType, REST, Routes, Events } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

import dns from 'dns';
import schedule from 'node-schedule';
import { log } from './utils/log';
import { addPointsToInventory, loadPoints } from './services/pointsManager';

log(
    `\n` +
    `   =============================\n` +
    `   ||        BETTY BET        ||\n` +
    `   =============================\n` +
    `   ||       By Selena V       ||\n` +
    `   =============================`
);

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

export const commands: Map<string, any> = new Map();

// -----------------------------
// COMMANDS LOADING
// -----------------------------
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file =>
    file.endsWith('.ts') || file.endsWith('.js')
);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { command } = require(filePath);
    commands.set(command.data.name, command);
}

const commandData = [...commands.values()].map(cmd => cmd.data.toJSON());
log(`INFO: Loaded ${commandData.length} commands.`);

// -----------------------------
// EVENTS LOADING
// -----------------------------
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file =>
    file.endsWith('.ts') || file.endsWith('.js')
);

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath).default;

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

schedule.scheduleJob('0 0 * * *', async () => {
    await addPointsToInventory();
    log('Scheduled Task: Added points to all users\' inventories.');
});
schedule.scheduleJob('0 12 * * *', async () => {
    await addPointsToInventory();
    log('Scheduled Task: Added points to all users\' inventories.');
});

// -----------------------------
// READY EVENT
// -----------------------------
client.once(Events.ClientReady, async () => {

    await loadPoints();
    await addPointsToInventory();

    log(`INFO: Logged in as ${client.user?.tag}!`);

    client.user?.setActivity('/help | Gearbot', {
        type: ActivityType.Playing
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    try {
        log('INFO: Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user!.id),
            { body: commandData }
        );

        log('INFO: Successfully reloaded application (/) commands.');
    } catch (error) {
        log(`ERROR: ${error}`);
    }
});

// -----------------------------
// BOT CONNECTION
// -----------------------------
async function waitForDiscord() {
    return new Promise((resolve) => {
        const checkConnection = () => {
            dns.lookup('discord.com', (err) => {
                if (!err) {
                    log('INFO: Connection to Discord servers detected!');
                    resolve(undefined);
                } else {
                    log('WARNING: No connection to Discord yet, waiting...');
                    setTimeout(checkConnection, 5000);
                }
            });
        };
        checkConnection();
    });
}

async function startBot(): Promise<void> {
    try {
        await waitForDiscord();
        log('INFO: Discord connection established!');
        log('INFO: Connecting to Discord...');
        await client.login(process.env.DISCORD_TOKEN!);
        log('INFO: Bot successfully connected!');
    } catch (error) {
        log(`ERROR: Bot connection failed: ${error}`);
        await client.destroy();
        log('ERROR: Process exited due to critical failure.');
        process.exit(1);
    }
}

startBot();