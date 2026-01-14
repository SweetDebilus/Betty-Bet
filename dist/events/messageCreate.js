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
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const debilus = process.env.DEBILUS;
// Cooldown par utilisateur (en millisecondes)
const COOLDOWN = 10000; // 10 secondes
const cooldowns = new Map();
const punchlines = [
    `## You're the witch! 🫵${debilus}`,
    `## Witch detected. Proceed with caution. 🧹`,
    `## Selena’s magic strikes again. ✨`,
    `## You’ve been cursed with style. 😏`,
    `## Wizardry at its finest! 🪄`,
    `## Alakazam! You’re the wizard! 🧙‍♂️`,
    `## Spells, potions and ugly, you’re the wizard! 🫵😂`,
    `## Magic is real, and so are you! 👍`,
    `## Enchanted to meet you, heretic ☠️`,
    `## You must be the chosen one! 🌟`,
    `## You're the chosen one! 🌟`,
    `## you reek of heresy! ☠️`,
    `## By the power of the ancestral skull, I possess all powers! 💀`,
    `## You shall not pass... without a punchline! 🧙‍♂️`
];
function getRandomPunchline() {
    const index = Math.floor(Math.random() * punchlines.length);
    return punchlines[index];
}
exports.default = {
    name: discord_js_1.Events.MessageCreate,
    execute(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.author.bot)
                return;
            if (message.channel.id !== process.env.CHANNEL_GENERAL_ID)
                return;
            const content = message.content.toLowerCase();
            const hasWitch = content.includes("witch");
            const hasWizard = content.includes("wizard");
            // Condition principale
            if (!hasWitch || hasWizard)
                return;
            // Vérification du cooldown
            const lastTrigger = cooldowns.get(message.author.id);
            const now = Date.now();
            if (lastTrigger && now - lastTrigger < COOLDOWN) {
                return; // On ignore si cooldown pas fini
            }
            // Mise à jour du cooldown
            cooldowns.set(message.author.id, now);
            // Réponse
            yield message.reply(getRandomPunchline());
        });
    }
};
