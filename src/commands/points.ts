import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('points') 
        .setDescription('Check your points'),
    
    async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const pointsEmoji = process.env.POINTS!;
    const debilus = process.env.DEBILUS!;

    if (!usersPoints[userId]) {
        await interaction.reply({content:'You are not registered yet. Use */register* to register.', flags: MessageFlags.Ephemeral});
        return;
    }

    const userInfo = usersPoints[userId];
    const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
    await interaction.reply({ content: `**${userInfo.name}**\n\nYou have **${userInfo.points}** ${pointsEmoji}\n\n| **${userInfo.wins} wins** | **${userInfo.losses} losses** |\n\n**Status:** ${status}`, flags: MessageFlags.Ephemeral });
    }
};