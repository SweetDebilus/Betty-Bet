import { Events, Message, TextChannel, ThreadChannel } from "discord.js";
import fs from "fs";
import path from "path";
import { log } from "../utils/log";
import { sleep } from "../utils/sleep";

const triggers = [
    "!mdj",
    "!messagejour",
    "!infofc"
];

const dataPath = path.join("src", "data", "messageDuJourData.json");
const messagePath = path.join("src", "data", "messageDuJour.txt");

function getLastMessageDate(): string | null {
    try {
        const raw = fs.readFileSync(dataPath, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed.lastMessageDate || null;
    } catch {
        return null;
    }
}

function setLastMessageDate(date: string) {
    const data = { lastMessageDate: date };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;

        const content = message.content.toLowerCase();
        const triggered = triggers.some(t => content.includes(t));
        if (!triggered) return;

        const today = new Date().toISOString().split("T")[0];
        const lastDate = getLastMessageDate();
        if (lastDate === today) return;

        setLastMessageDate(today);

        let messageDuJour = "";
        try {
            messageDuJour = fs.readFileSync(messagePath, "utf-8");
        } catch {
            log("ERROR: Impossible de lire messageDuJour.txt");
            return;
        }

        if (message.channel instanceof TextChannel || message.channel instanceof ThreadChannel) {
            await sleep(2000);
            await message.channel.send("📢 **Message du jour :**\n\n" + messageDuJour);
            log(`INFO: Message du jour envoyé dans ${message.channel.id}`);
        } else {
            log("WARNING: Tentative d'envoi dans un canal non textuel.");
        }
    }
};