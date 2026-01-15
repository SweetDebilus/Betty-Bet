"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const log_1 = require("../utils/log");
const morningTriggers = [
    "good morning",
    "gm",
    "bonjour",
    "ohayo",
    "おはよう",
    "buenos dias",
    "buenos días"
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
const dataPath = path_1.default.join("src", "data", "goodmorningData.json");
function getLastMorningDate() {
    try {
        const raw = fs_1.default.readFileSync(dataPath, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed.lastMorningDate || null;
    }
    catch (_a) {
        return null;
    }
}
function setLastMorningDate(date) {
    const data = {
        lastMorningDate: date
    };
    fs_1.default.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}
exports.default = {
    name: discord_js_1.Events.MessageCreate,
    execute(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.author.bot)
                return;
            const content = message.content.toLowerCase();
            const triggered = morningTriggers.some(t => content.includes(t));
            if (!triggered)
                return;
            const today = new Date().toISOString().split("T")[0];
            const lastDate = getLastMorningDate();
            if (lastDate === today)
                return;
            setLastMorningDate(today);
            const gif = morningGifs[Math.floor(Math.random() * morningGifs.length)];
            const addLine = Math.random() < 0.2;
            const line = morningLines[Math.floor(Math.random() * morningLines.length)];
            if (message.channel instanceof discord_js_1.TextChannel || message.channel instanceof discord_js_1.ThreadChannel) {
                if (addLine) {
                    yield message.channel.send(`${gif}\n${line}`);
                }
                else {
                    yield message.channel.send(gif);
                }
            }
            else {
                (0, log_1.log)("WARNING: Betty tried to send a message in a non-text channel.");
            }
        });
    }
};
