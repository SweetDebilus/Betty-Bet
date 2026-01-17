import { Events, Message, userMention } from "discord.js";
import { sleep } from "../utils/sleep";
import { log } from "../utils/log";


const globalCooldowns = new Map<string, number>();
const COOLDOWN = 300000; // 5 minutes

function isOnCooldown(trigger: string) {
    const last = globalCooldowns.get(trigger);
    const now = Date.now();
    return last && now - last < COOLDOWN;
}

function setCooldown(trigger: string) {
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

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;
        if (message.channel.id !== process.env.CHANNEL_GENERAL_ID) return;

        const content = message.content.toLowerCase();
        const isInvoked = aliases.some(a => content.includes(a));

        if (!isInvoked) return;
        if (content.includes("gomez") || content.includes("gómez") || content.includes("gomezz") || content.includes("gomees") || content.includes("gomeez")) {
            return;
        }

        // --- Cooldown global ---
        if (isOnCooldown("invocation")) {
            return;
        }

        setCooldown("invocation");

        await sleep(3000);

        await message.reply(userMention(process.env.SELENA_ID!)+getRandomInvocation());

        log(`INFO: Invocation message sent to user ${message.author.id} in response to alias.`);
    }
};