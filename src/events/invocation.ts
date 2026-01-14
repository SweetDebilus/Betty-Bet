import { Events, Message } from "discord.js";

const COOLDOWN = 10000;
const cooldowns = new Map<string, number>();

const aliases = ["selena", "sweetheart", "selenya"];

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

        // Cooldown global pour éviter le spam
        const last = cooldowns.get("invocation");
        const now = Date.now();

        if (last && now - last < COOLDOWN) return;
        cooldowns.set("invocation", now);

        const selena = message.guild?.members.cache.get(process.env.SELENA_ID!);
        if (!selena) return;

        await message.reply(`### ${selena}${getRandomInvocation()}`);
    }
};
