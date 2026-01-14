import { Events, Message } from "discord.js";

const debilus = process.env.DEBILUS!;

// Cooldown par utilisateur (en millisecondes)
const COOLDOWN = 10_000; // 10 secondes
const cooldowns = new Map<string, number>();

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
    const index = Math.floor(Math.random() * punchlines.length);
    return punchlines[index];
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;
        if (message.channel.id !== process.env.CHANNEL_GENERAL_ID) return;

        const content = message.content.toLowerCase();
        const hasWitch = content.includes("witch");
        const hasWizard = content.includes("wizard");

        // Condition principale
        if (!hasWitch || hasWizard) return;

        // Vérification du cooldown
        const lastTrigger = cooldowns.get(message.author.id);
        const now = Date.now();

        if (lastTrigger && now - lastTrigger < COOLDOWN) {
            return; // On ignore si cooldown pas fini
        }

        // Mise à jour du cooldown
        cooldowns.set(message.author.id, now);

        // Réponse
        await message.reply(getRandomPunchline());
    }
};
