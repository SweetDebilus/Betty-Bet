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
const sleep_1 = require("../utils/sleep");
const triggers = [
    "!mdj",
    "!messagejour",
    "!infofc"
];
const dataPath = path_1.default.join("src", "data", "messageDuJourData.json");
const messagePath = path_1.default.join("src", "data", "messageDuJour.txt");
function getLastMessageDate() {
    try {
        const raw = fs_1.default.readFileSync(dataPath, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed.lastMessageDate || null;
    }
    catch (_a) {
        return null;
    }
}
function setLastMessageDate(date) {
    const data = { lastMessageDate: date };
    fs_1.default.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}
exports.default = {
    name: discord_js_1.Events.MessageCreate,
    execute(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.author.bot)
                return;
            const content = message.content.toLowerCase();
            const triggered = triggers.some(t => content.includes(t));
            if (!triggered)
                return;
            const today = new Date().toISOString().split("T")[0];
            const lastDate = getLastMessageDate();
            if (lastDate === today)
                return;
            setLastMessageDate(today);
            let messageDuJour = "";
            try {
                messageDuJour = fs_1.default.readFileSync(messagePath, "utf-8");
            }
            catch (_a) {
                (0, log_1.log)("ERROR: Impossible de lire messageDuJour.txt");
                return;
            }
            if (message.channel instanceof discord_js_1.TextChannel || message.channel instanceof discord_js_1.ThreadChannel) {
                yield (0, sleep_1.sleep)(2000);
                yield message.channel.send("📢 **Message du jour :**\n\n" + messageDuJour);
                (0, log_1.log)(`INFO: Message du jour envoyé dans ${message.channel.id}`);
            }
            else {
                (0, log_1.log)("WARNING: Tentative d'envoi dans un canal non textuel.");
            }
        });
    }
};
