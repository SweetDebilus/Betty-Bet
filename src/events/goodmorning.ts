import { Events, Message, TextChannel, ThreadChannel } from "discord.js";
import fs from "fs";
import path from "path";
import { log } from "../utils/log";
import { sleep } from "../utils/sleep";


const morningTriggers = [
    "good morning",
    "gm",
    "bonjour",
    "ohayo",
    "おはよう",
    "buenos dias",
    "buenos días",
    "morning"
];

const morningGifs = [
    "https://tenor.com/view/good-morning-cyberpunk-2077-night-city-gif-19591988",
    "https://tenor.com/view/gooooooooood-morning-vietnaaaaaaaam-good-morning-veitnam-movie-good-morning-vietnam-gif-19697206",
    "https://tenor.com/view/nice-to-meet-you-cat-cute-sunglasses-shades-on-gif-777986269499010893"
];

const morningLines = [
    "## Good morning, mortal. Try not to break anything today.",
    "## The sun rises. Your sanity does not.",
    "## Awake already. Bold move.",
    "## May your coffee be strong and your decisions acceptable.",
    "## Betty observes the dawn."
];

const dataPath = path.join("src", "data", "goodmorningData.json");

function getLastMorningDate(): string | null { 
    try { 
        const raw = fs.readFileSync(dataPath, "utf-8"); 
        const parsed = JSON.parse(raw); 
        return parsed.lastMorningDate || null; 
    } 
    catch { 
            return null; 
    } 
}

function setLastMorningDate(date: string) { 
    const data = { 
        lastMorningDate: date 
    }; 
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8"); 
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;

        const content = message.content.toLowerCase();
        const triggered = morningTriggers.some(t => content.includes(t));
        if (!triggered) return;

        const today = new Date().toISOString().split("T")[0];
        const lastDate = getLastMorningDate();
        if (lastDate === today) return;

        setLastMorningDate(today);

        const gif = morningGifs[Math.floor(Math.random() * morningGifs.length)];
        const addLine = Math.random() < 0.2;
        const line = morningLines[Math.floor(Math.random() * morningLines.length)];

        if (message.channel instanceof TextChannel || message.channel instanceof ThreadChannel) { 
            await sleep(3000);
            if (addLine) { 
                await message.channel.send(`${gif}\n${line}`); 
            } else { 
                await message.channel.send(gif); 
            } 
            log(`INFO: Good morning message sent in channel ${message.channel.id} in response to morning trigger.`);
        } else {
            log("WARNING: Betty tried to send a message in a non-text channel.");
        }
    }
};