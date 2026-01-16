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
const COOLDOWN = 60000;
const cooldowns = new Map();
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
            var _a;
            if (message.author.bot)
                return;
            if (message.channel.id !== process.env.CHANNEL_GENERAL_ID)
                return;
            const content = message.content.toLowerCase();
            const isInvoked = aliases.some(a => content.includes(a));
            if (!isInvoked)
                return;
            // Cooldown global pour éviter le spam
            const last = cooldowns.get("invocation");
            const now = Date.now();
            if (last && now - last < COOLDOWN)
                return;
            cooldowns.set("invocation", now);
            const selena = (_a = message.guild) === null || _a === void 0 ? void 0 : _a.members.cache.get(process.env.SELENA_ID);
            if (!selena)
                return;
            yield (0, sleep_1.sleep)(3000);
            yield message.reply(`### ${selena}${getRandomInvocation()}`);
            (0, log_1.log)(`INFO: Invocation message sent to user ${message.author.id} in response to alias.`);
        });
    }
};
