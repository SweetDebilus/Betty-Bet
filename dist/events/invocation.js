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
const sleep_1 = require("../utils/sleep");
const log_1 = require("../utils/log");
const globalCooldowns = new Map();
const COOLDOWN = 300000; // 5 minutes
function isOnCooldown(trigger) {
    const last = globalCooldowns.get(trigger);
    const now = Date.now();
    return last && now - last < COOLDOWN;
}
function setCooldown(trigger) {
    globalCooldowns.set(trigger, Date.now());
}
const aliases = ["selena", "sweetheart", "selenya", "séléna", "sélénya", "sélena", "sélenna"];
const invocations = [
    `, the plebeians invoke you.`,
    `, your presence has been requested by mortals.`,
    `, someone has spoken the forbidden name.`,
    `, the council whispers your name.`,
    `, an invocation ritual has begun.`,
    `, prophecy foretold your arrival at this moment.`,
    `, the stars have aligned for your summoning.`,
    `, a humble servant calls upon you.`,
    `, destiny beckons you forth.`,
    `, the ancient ones have heard the call.`,
    `, a seeker of wisdom seeks your guidance.`,
    `, the veil between worlds thins for your arrival.`,
    `, the echoes of your name ripple through the ether.`,
    `, a mortal dares to summon your power.`,
    `, the fates have woven your presence into this moment.`
];
function getRandomInvocation() {
    return invocations[Math.floor(Math.random() * invocations.length)];
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
            const isInvoked = aliases.some(a => content.includes(a));
            if (!isInvoked)
                return;
            // Ne pas invoquer si le message contient "gomez" ou ses variantes
            if (content.includes("gomez") || content.includes("gómez") || content.includes("gomezz") || content.includes("gomees") || content.includes("gomeez")) {
                return;
            }
            // --- Cooldown global ---
            if (isOnCooldown("invocation")) {
                return;
            }
            setCooldown("invocation");
            yield (0, sleep_1.sleep)(3000);
            yield message.reply((0, discord_js_1.userMention)(process.env.SELENA_ID) + getRandomInvocation());
            (0, log_1.log)(`INFO: Invocation message sent to user ${message.author.id} in response to alias.`);
        });
    }
};
