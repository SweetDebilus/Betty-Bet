import { Events, Message } from "discord.js";
import { sleep } from "../utils/sleep";
import { log } from "../utils/log";

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
        let count = (countMessages.get(userId) || 0) + 1;
        countMessages.set(userId, count);
        await sleep(2000);

        // Punition
        if (count >= WARNING_THRESHOLD + 1) {
            countMessages.set(userId, 0);

            const { usersPoints, savePoints } = require("../services/pointsManager");

            if (usersPoints[userId]) {
                if (usersPoints[userId].points < POINTS_PENALTY) {
                    await message.reply({
                        content: `⚠️ ${message.author}, you have invoked the forbidden name **three times**.\n` +
                                `You're lucky to be poor, otherwise I would have taken away ${POINTS_PENALTY} points from you.`,
                    });
                    log(`WARNING: User ${userId} has insufficient points for penalty.`);
                    return;
                }

                usersPoints[userId].points -= POINTS_PENALTY;
                await savePoints();

                await message.reply({
                    content: `⚠️ ${message.author}, you have invoked the forbidden name **three times**.\n` +
                            `I'm taking ${POINTS_PENALTY} points from your inventory and store them in my debilus closet.`,
                });

                log(`PENALTY: Removed ${POINTS_PENALTY} points from user ${userId}. Current points: ${usersPoints[userId].points}`);
            } else {
                await message.reply({
                    content: `⚠️ ${message.author}, you have invoked the forbidden name **three times**.\n` +
                            `If you were registered, Betty would have punished you.`,
                });

                log(`WARNING: Unregistered user ${userId} reached forbidden-name threshold.`);
            }

            return;
        }

        // Warnings
        if (count === 1 || count === 2) {
            await message.reply(`⚠️ ${message.author}, ${getRandomResponse()}`);
            log(`INFO: Warning message sent to user ${userId}.`);
        }

        if (count === WARNING_THRESHOLD) {
            await message.reply(`⚠️ ${message.author}, ${getRandomResponse()} ${warnings}`);
            log(`INFO: Final warning message sent to user ${userId}.`);
        }
    }
};