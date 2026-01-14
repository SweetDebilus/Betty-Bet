import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('pointvault') 
        .setDescription('Check the total points in the vault'),
    
    async execute(interaction: ChatInputCommandInteraction) {
    const pointsEmoji = process.env.POINTS!;

    const userId = interaction.user.id;

    if (!usersPoints[userId]) {
        await interaction.reply({ content:`You are not registered yet. Use */register* to register.`, flags: MessageFlags.Ephemeral })
        return;
    }
    const inventoryPoints = usersPoints[userId].inventory;
    await interaction.reply({ content: `You have **${inventoryPoints}** ${pointsEmoji} in your Point Vault.`, flags: MessageFlags.Ephemeral })
    }
};