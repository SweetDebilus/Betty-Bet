import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { savePoints, usersPoints } from '../services/pointsManager';

export const command = {
    data: new SlashCommandBuilder()  
        .setName('togglenotifications') 
        .setDescription('Toggle notifications for Point Vault GearPoints'),
    
    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;

        if (!usersPoints[userId]) {
            await interaction.reply({content:'You are not registered yet. Use `/register` to sign up.', flags: MessageFlags.Ephemeral});
            return;
        }

        usersPoints[userId].notificationsEnabled = !usersPoints[userId].notificationsEnabled;
        await savePoints();
        await interaction.reply({
            content:`Notifications have been ${usersPoints[userId].notificationsEnabled ? 'enabled' : 'disabled'}.`, 
            flags: MessageFlags.Ephemeral
        });
    }
};