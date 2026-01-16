import { Events, Message } from "discord.js";
import { sleep } from "../utils/sleep";
import { log } from "../utils/log";
import { usersPoints } from "../services/pointsManager";

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

const warningsForMembers = `If you continue, I'll deduct points from you and put them in my debilus closet.`;
const warningsForNonMembers = `If you were registered in my system, I would have punished you.`;

const countMessages = new Map<string, number>();
const WARNING_THRESHOLD = 3;

function getRandomResponse() {
    return responses[Math.floor(Math.random() * responses.length)];
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;
        if (message.channel.id !== process.env.CHANNEL_GENERAL_ID) return;

        const content = message.content.toLowerCase();
        const isInvoked = aliases.some(a => content.includes(a));
        if (!isInvoked) return;

        const userId = message.author.id;
        const isRegistered = Boolean(usersPoints[userId]);

        let count = (countMessages.get(userId) || 0) + 1;
        countMessages.set(userId, count);

        await sleep(2000);

        // --- Warnings 1 & 2 ---
        if (count === 1 || count === 2) {
            await message.reply(`⚠️ ${message.author.displayName}, ${getRandomResponse()}`);
            log(`INFO: Warning ${count}/3 sent to user ${userId}.`);
            return;
        }

        // --- Warning 3 (final) ---
        if (count === WARNING_THRESHOLD) {
            const extra = isRegistered ? warningsForMembers : warningsForNonMembers;
            await message.reply(`⚠️ ${message.author.displayName}, ${getRandomResponse()} ${extra}`);
            log(`INFO: Final warning sent to user ${userId}.`);
            return;
        }

        // --- Punition (4ᵉ message) ---
        if (count >= WARNING_THRESHOLD + 1) {
            countMessages.set(userId, 0);

            const { usersPoints, savePoints } = require("../services/pointsManager");

            if (!isRegistered) {
                await message.reply(`⚠️ ${message.author.displayName}, you have invoked the forbidden name **three times**.\n${warningsForNonMembers}`);
                log(`WARNING: Unregistered user ${userId} reached punishment threshold.`);
                return;
            }

            if (usersPoints[userId].points < POINTS_PENALTY) {
                await message.reply(
                    `⚠️ ${message.author.displayName}, you have invoked the forbidden name **three times**.\n` +
                    `You're lucky to be poor, otherwise I would have taken away ${POINTS_PENALTY} points from you.`
                );
                log(`WARNING: User ${userId} has insufficient points for penalty.`);
                return;
            }

            usersPoints[userId].points -= POINTS_PENALTY;
            await savePoints();

            await message.reply(
                `⚠️ ${message.author.displayName}, you have invoked the forbidden name **three times**.\n` +
                `I'm taking ${POINTS_PENALTY} points from your inventory and store them in my debilus closet.`
            );

            log(`PENALTY: Removed ${POINTS_PENALTY} points from user ${userId}. Remaining: ${usersPoints[userId].points}`);
        }
    }
};