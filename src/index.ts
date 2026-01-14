import { Client, GatewayIntentBits, ActivityType, REST, Routes, Events } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();
import dns from 'dns';
import schedule from 'node-schedule';
import { log } from './utils/log';
import { addPointsToInventory, loadPoints } from './services/pointsManager';
import interactionCreate from './events/interactionCreate';


export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.on('interactionCreate', interactionCreate.execute);

export const commands: Map<string, any> = new Map();

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

schedule.scheduleJob('0 0 * * *', addPointsToInventory); // Exécute tous les jours à minuit
schedule.scheduleJob('0 12 * * *', addPointsToInventory); // Exécute tous les jours à midi

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

client.once(Events.ClientReady, async () => {

    await loadPoints();
    await addPointsToInventory();
    
    log(`Logged in as ${client.user?.tag}!`);

    client.user?.setActivity('/help | Gearbot', {
        type: ActivityType.Playing
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    try {
        log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user!.id),
            { body: commandData }
        );

        log('Successfully reloaded application (/) commands.');
    } catch (error) {
        log(`${error}`);
    }
});

async function waitForDiscord() {
    return new Promise((resolve) => {
        const checkConnection = () => {
            dns.lookup('discord.com', (err) => {
                if (!err) {
                    log('Connection to Discord servers detected!');
                    resolve(undefined);
                } else {
                    log('No connection to Discord yet, waiting...');
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
        log('Discord connection established!');
        log('Connecting to Discord...');
        await client.login(process.env.DISCORD_TOKEN!);
        log('Bot successfully connected!');
    } catch (error) {
        log(`Bot connection failed: ${error}`);
        await client.destroy();
        log('Process exited due to critical failure.');
        process.exit(1);
    }
}

startBot();