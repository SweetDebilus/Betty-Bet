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
const aliases = ["gomez", "gómez", "gomezz", "gomees", "gomeez"];
const POINTS_PENALTY = 10;
const responses = [
    `It is forbidden to call my creator that.`,
    `How dare you disrespect Selena like that!`,
    `Call her Miss Sweetheart!`,
    `Selena is not pleased with your choice of name.`,
    `Such insolence will not be tolerated!`,
    `Beware, for disrespecting Selena has consequences.`,
    `Your audacity to use that name is noted.`,
    `Selena's patience wears thin with such disrespect.`,
    `You tread on dangerous ground by using that name.`
];
const warnings = `If you continue, I'll deduct points from you and put them in my debilus closet.`;
const countMessages = new Map();
const WARNING_THRESHOLD = 3;
function getRandomResponse() {
    return responses[Math.floor(Math.random() * responses.length)];
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
            const userId = message.author.id;
            let count = (countMessages.get(userId) || 0) + 1;
            countMessages.set(userId, count);
            yield (0, sleep_1.sleep)(2000);
            // Punition
            if (count >= WARNING_THRESHOLD + 1) {
                countMessages.set(userId, 0);
                const { usersPoints, savePoints } = require("../services/pointsManager");
                if (usersPoints[userId]) {
                    if (usersPoints[userId].points < POINTS_PENALTY) {
                        yield message.reply({
                            content: `⚠️ ${message.author}, you have invoked the forbidden name **three times**.\n` +
                                `You're lucky to be poor, otherwise I would have taken away ${POINTS_PENALTY} points from you.`,
                        });
                        (0, log_1.log)(`WARNING: User ${userId} has insufficient points for penalty.`);
                        return;
                    }
                    usersPoints[userId].points -= POINTS_PENALTY;
                    yield savePoints();
                    yield message.reply({
                        content: `⚠️ ${message.author}, you have invoked the forbidden name **three times**.\n` +
                            `I'm taking ${POINTS_PENALTY} points from your inventory and store them in my debilus closet.`,
                    });
                    (0, log_1.log)(`PENALTY: Removed ${POINTS_PENALTY} points from user ${userId}. Current points: ${usersPoints[userId].points}`);
                }
                else {
                    yield message.reply({
                        content: `⚠️ ${message.author}, you have invoked the forbidden name **three times**.\n` +
                            `If you were registered, Betty would have punished you.`,
                    });
                    (0, log_1.log)(`WARNING: Unregistered user ${userId} reached forbidden-name threshold.`);
                }
                return;
            }
            // Warnings
            if (count === 1 || count === 2) {
                yield message.reply(`⚠️ ${message.author}, ${getRandomResponse()}`);
                (0, log_1.log)(`INFO: Warning message sent to user ${userId}.`);
            }
            if (count === WARNING_THRESHOLD) {
                yield message.reply(`⚠️ ${message.author}, ${getRandomResponse()} ${warnings}`);
                (0, log_1.log)(`INFO: Final warning message sent to user ${userId}.`);
            }
        });
    }
};
