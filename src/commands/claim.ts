import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints, savePoints } from '../services/pointsManager';

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
    } else {
        await interaction.reply({ 
            content: 'You have no points to claim. try again later !', 
            flags: MessageFlags.Ephemeral 
        });
    }
    }
};