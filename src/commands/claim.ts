import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints, savePoints } from '../services/pointsManager';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('claim') 
        .setDescription('Claim points from your Point Vault'),

    async execute(interaction: ChatInputCommandInteraction) {
    const pointsEmoji = process.env.POINTS!;
    const userId = interaction.user.id;

    if (!usersPoints[userId]) {
        await interaction.reply({ 
            content: 'You are not registered yet. Use `/register` to register.', 
            flags: MessageFlags.Ephemeral 
        });
        log(`WARN: Unregistered user ${userId} attempted to claim points from Point Vault.`);
        return;
    }

    const pointsToClaim = usersPoints[userId].inventory;
    if (pointsToClaim > 0) {
        usersPoints[userId].points += pointsToClaim;
        usersPoints[userId].inventory = 0;
        usersPoints[userId].isDebilus = false;
        await savePoints();

        await interaction.reply({ 
            content: `You have claimed **${pointsToClaim}** ${pointsEmoji}.\n\nYou now have **${usersPoints[userId].points}** ${pointsEmoji}`, 
            flags: MessageFlags.Ephemeral 
        });
        log(`INFO: User ${userId} claimed ${pointsToClaim} points from Point Vault.`);
    } else {
        await interaction.reply({ 
            content: 'You have no points to claim. try again later !', 
            flags: MessageFlags.Ephemeral 
        });
        log(`INFO: User ${userId} attempted to claim points but had none in the Point Vault.`);
    }
    }
};