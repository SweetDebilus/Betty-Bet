import { Events, Message } from "discord.js";
import { sleep } from "../utils/sleep";
import { log } from "../utils/log";

const debilus = process.env.DEBILUS!;

// --- Cooldown global ---
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

// --- Punchlines ---
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

function getRandomPunchline(): string {
    return punchlines[Math.floor(Math.random() * punchlines.length)];
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;
        if (message.channel.id !== process.env.CHANNEL_GENERAL_ID) return;

        const content = message.content.toLowerCase();

        const hasWitch = content.includes("witch");
        const hasWizard = content.includes("wizard");

        // Condition : "witch" présent, mais PAS "wizard"
        if (!hasWitch || hasWizard) return;

        // --- Cooldown global ---
        if (isOnCooldown("invocation")) {
            return;
        }

        setCooldown("invocation");

        await sleep(3000);

        await message.reply(getRandomPunchline());

        log(`INFO: Punchline sent to user ${message.author.id} after "witch" trigger.`);
    }
};